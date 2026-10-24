const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const UserReports = require('../models/UserReports');
const ragService = require('../services/medicalRagService');

// All RAG routes require authentication
router.use(verifyToken);

// ── Status endpoint ──────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({
    isInitialized: ragService.isInitialized,
    totalIndexedEntries: ragService.localVectorStore.length,
    vectorEngine: ragService.pinecone ? 'Pinecone Vector DB' : 'MedVault Semantic Vector Cache',
    pineconeConfigured: !!ragService.pinecone
  });
});

// ── Manual re-seed / index endpoint ──────────────────────────────────────────
router.post('/seed', async (req, res) => {
  try {
    const force = req.body?.force === true;
    await ragService.initializeKnowledgeBase(force);
    res.json({
      message: 'Medical knowledge base indexed successfully.',
      entriesCount: ragService.localVectorStore.length,
      vectorEngine: ragService.pinecone ? 'Pinecone' : 'Local Vector Store'
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Ask RAG AI about a report or general medical question ───────────────────
router.post('/ask', async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName, question, reportSummary: clientSummary } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required.' });
    }

    let reportSummary = clientSummary || '';
    let reportDescription = '';

    // If fileName is provided, fetch latest report details from user's records
    if (fileName) {
      const userReports = await UserReports.findOne({ userId });
      if (userReports) {
        const report = userReports.reports.find(r => r.fileName === fileName);
        if (report) {
          reportSummary = report.aiSummary || reportSummary;
          reportDescription = report.description || '';
        }
      }
    }

    // Call RAG interpretation service
    const result = await ragService.interpretReportWithRAG({
      reportSummary,
      reportDescription,
      userQuestion: question
    });

    res.json({
      success: true,
      answer: result.answer,
      retrievedKnowledge: result.retrievedKnowledge,
      modelUsed: result.modelUsed
    });
  } catch (err) {
    console.error('[RAG Route] Error:', err);
    res.status(500).json({
      message: err.message || 'Medical RAG Chatbot encountered an error processing your query.'
    });
  }
});

module.exports = router;
