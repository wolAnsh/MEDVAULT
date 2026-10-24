const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let PineconeClient = null;
try {
  const { Pinecone } = require('@pinecone-database/pinecone');
  PineconeClient = Pinecone;
} catch (err) {
  console.warn('[RAG] @pinecone-database/pinecone not loaded. Will use local vector engine.');
}

const KNOWLEDGE_FILE = path.join(__dirname, '../data/medicalKnowledge.json');
const CACHE_FILE = path.join(__dirname, '../data/medical_vector_cache.json');

// ── Math Helpers for Local Vector Cosine Similarity ─────────────────────────
function dotProduct(vecA, vecB) {
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += vecA[i] * vecB[i];
  }
  return sum;
}

function magnitude(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(vecA, vecB) / (magA * magB);
}

class MedicalRagService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.pineconeApiKey = process.env.PINECONE_API_KEY || null;
    this.pineconeIndexName = process.env.PINECONE_INDEX || 'medvault-medical-kb';
    this.pinecone = null;
    this.localVectorStore = []; // Array of { id, topic, category, normalRange, content, embedding }
    this.isInitialized = false;

    if (this.pineconeApiKey && PineconeClient) {
      try {
        this.pinecone = new PineconeClient({ apiKey: this.pineconeApiKey });
        console.log('[RAG] Pinecone client configured with index:', this.pineconeIndexName);
      } catch (err) {
        console.warn('[RAG] Failed to initialize Pinecone client:', err.message);
      }
    }
  }

  // ── Embed text using Gemini Embedding Model ──────────────────────────────
  async getEmbedding(text) {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured in backend environment.');
    }
    const candidateEmbeddingModels = ['gemini-embedding-001', 'gemini-embedding-2'];
    let lastError = null;

    for (const modelName of candidateEmbeddingModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(text);
        return result.embedding.values;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Failed to generate embedding with Gemini.');
  }

  // ── Load & Index Knowledge Base ──────────────────────────────────────────
  async initializeKnowledgeBase(forceReindex = false) {
    if (this.isInitialized && !forceReindex) return;

    if (!fs.existsSync(KNOWLEDGE_FILE)) {
      console.warn('[RAG] Knowledge file not found at:', KNOWLEDGE_FILE);
      return;
    }

    const rawData = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
    const medicalEntries = JSON.parse(rawData);

    // Check if we have cached embeddings
    if (!forceReindex && fs.existsSync(CACHE_FILE)) {
      try {
        const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        if (Array.isArray(cached) && cached.length === medicalEntries.length) {
          this.localVectorStore = cached;
          this.isInitialized = true;
          console.log(`[RAG] Loaded ${cached.length} medical knowledge embeddings from local cache.`);
          return;
        }
      } catch (e) {
        console.warn('[RAG] Cache file corrupt or invalid, generating fresh embeddings...');
      }
    }

    console.log(`[RAG] Indexing ${medicalEntries.length} clinical knowledge entries...`);
    const indexedEntries = [];
    const pineconeRecords = [];

    for (const item of medicalEntries) {
      const textToEmbed = `${item.category}: ${item.topic}. Normal Range: ${item.normalRange}. ${item.content}`;
      try {
        let embedding = null;
        if (this.genAI) {
          embedding = await this.getEmbedding(textToEmbed);
        }

        const entryWithVector = {
          ...item,
          fullText: textToEmbed,
          embedding
        };
        indexedEntries.push(entryWithVector);

        if (this.pinecone && embedding) {
          pineconeRecords.push({
            id: item.id,
            values: embedding,
            metadata: {
              topic: item.topic,
              category: item.category,
              normalRange: item.normalRange,
              content: item.content
            }
          });
        }
      } catch (err) {
        console.warn(`[RAG] Embedding failed for ${item.id}:`, err.message);
      }
    }

    this.localVectorStore = indexedEntries;

    // Save cache locally
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(indexedEntries, null, 2));
      console.log(`[RAG] Saved ${indexedEntries.length} embedded medical documents to cache.`);
    } catch (e) {
      console.warn('[RAG] Could not write vector cache:', e.message);
    }

    // Upsert to Pinecone if configured
    if (this.pinecone && pineconeRecords.length > 0) {
      try {
        const index = this.pinecone.index(this.pineconeIndexName);
        await index.upsert(pineconeRecords);
        console.log(`[RAG] Successfully upserted ${pineconeRecords.length} records into Pinecone.`);
      } catch (pineErr) {
        console.warn('[RAG] Pinecone upsert note:', pineErr.message);
      }
    }

    this.isInitialized = true;
  }

  // ── Semantic Search Across Medical Knowledge ─────────────────────────────
  async searchMedicalKnowledge(query, topK = 3) {
    if (!this.isInitialized) {
      await this.initializeKnowledgeBase();
    }

    // Try Pinecone first if configured
    if (this.pinecone && this.genAI) {
      try {
        const queryEmbedding = await this.getEmbedding(query);
        const index = this.pinecone.index(this.pineconeIndexName);
        const results = await index.query({
          vector: queryEmbedding,
          topK,
          includeMetadata: true
        });

        if (results && results.matches && results.matches.length > 0) {
          return results.matches.map(m => ({
            id: m.id,
            score: m.score,
            topic: m.metadata.topic,
            category: m.metadata.category,
            normalRange: m.metadata.normalRange,
            content: m.metadata.content,
            source: 'Pinecone Vector DB'
          }));
        }
      } catch (err) {
        console.warn('[RAG] Pinecone query failed, falling back to local vector store:', err.message);
      }
    }

    // Fallback: Local Vector Store Cosine Similarity
    if (this.localVectorStore.length === 0) {
      return [];
    }

    try {
      const queryEmbedding = await this.getEmbedding(query);
      const scored = this.localVectorStore
        .filter(item => item.embedding && item.embedding.length > 0)
        .map(item => ({
          id: item.id,
          score: cosineSimilarity(queryEmbedding, item.embedding),
          topic: item.topic,
          category: item.category,
          normalRange: item.normalRange,
          content: item.content,
          source: 'MedVault Medical Vector Index'
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return scored;
    } catch (err) {
      console.warn('[RAG] Local vector search fallback to keyword matching:', err.message);
      // Keyword fallback if embedding API fails
      const qLower = query.toLowerCase();
      return this.localVectorStore
        .map(item => {
          let score = 0;
          if (qLower.includes(item.topic.toLowerCase())) score += 0.5;
          if (qLower.includes(item.category.toLowerCase())) score += 0.3;
          if (item.content.toLowerCase().includes(qLower)) score += 0.2;
          return { ...item, score, source: 'MedVault Knowledge Base' };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }
  }

  // ── RAG Report Interpretation Core ───────────────────────────────────────
  async interpretReportWithRAG({ reportSummary = '', reportDescription = '', userQuestion = '', conversationHistory = [] }) {
    if (!userQuestion || !userQuestion.trim()) {
      throw new Error('User question is required.');
    }

    // Build the search query combining user question with key report findings
    const searchQuery = `${userQuestion} ${reportSummary.slice(0, 300)}`;
    const retrievedDocs = await this.searchMedicalKnowledge(searchQuery, 3);

    // Format retrieved clinical reference literature
    const formattedContext = retrievedDocs.length > 0
      ? retrievedDocs.map((doc, idx) => `[Source ${idx + 1}: ${doc.category} - ${doc.topic}]
Normal Reference Range: ${doc.normalRange || 'N/A'}
Clinical Details: ${doc.content}`).join('\n\n')
      : 'No specific reference manual excerpts retrieved for this query.';

    // Construct grounded medical RAG prompt
    const prompt = `You are the MedVault AI Clinical Assistant, an empathetic and highly knowledgeable medical AI designed to help patients understand diagnostic reports and health records.

PATIENT'S MEDICAL REPORT CONTEXT:
----------------------------------------
Description: ${reportDescription || 'Uploaded Medical Diagnostic Document'}
AI Extracted Report Summary:
${reportSummary || 'No preliminary summary available for this report.'}
----------------------------------------

VERIFIED MEDICAL REFERENCE KNOWLEDGE (Retrieved via RAG Vector Search):
----------------------------------------
${formattedContext}
----------------------------------------

PATIENT'S QUESTION:
"${userQuestion}"

INSTRUCTIONS:
1. Explain the answer clearly in empathetic, easy-to-understand language. Translate medical jargon into plain English.
2. Ground your explanations in the verified medical literature and normal reference ranges provided above.
3. If the report exhibits out-of-range or abnormal findings, explain what they typically signify, potential non-critical reasons (e.g. hydration, temporary inflammation), and healthy lifestyle/dietary considerations.
4. Clearly highlight when a parameter looks healthy/normal to reassure the patient.
5. Provide actionable, concise questions the patient can bring to their next appointment with their physician.
6. Always maintain a professional, calm tone. Always conclude with a brief disclaimer that this is an AI interpretation and must not replace professional medical diagnosis or consultation.`;

    const candidateModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-flash-latest"];
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });
        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        return {
          answer,
          retrievedKnowledge: retrievedDocs.map(d => ({
            topic: d.topic,
            category: d.category,
            normalRange: d.normalRange,
            score: d.score,
            source: d.source
          })),
          modelUsed: modelName
        };
      } catch (err) {
        console.warn(`[RAG] Gemini model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error('Failed to generate RAG response from Gemini.');
  }
}

const ragServiceInstance = new MedicalRagService();
module.exports = ragServiceInstance;
