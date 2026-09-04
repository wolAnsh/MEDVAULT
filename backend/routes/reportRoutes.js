const express = require('express')
const router = express.Router()
const multer = require('multer')
const UserReports = require('../models/UserReports')
const verifyToken = require('../middleware/verifyToken')

const upload = multer({ storage: multer.memoryStorage() })
const {
  generateShareLink,
  accessSharedReport,
  deleteReport,
  updateDescription
} = require('../controllers/reportController')

// ── Access Shared Report (public — no auth needed) ────────────────────────────
// This MUST be before router.use(verifyToken)
router.get('/shared/:token', accessSharedReport)

// ── All routes below require a valid JWT ──────────────────────────────────────
router.use(verifyToken)

// ── Share Link & QR ───────────────────────────────────────────────────────────
router.post('/generate-share-link/:fileName', generateShareLink)

// ── Add Report ────────────────────────────────────────────────────────────────
router.post('/addReport', async (req, res) => {
  try {
    const userId = req.user.id
    const { fileUrl, fileName, description, fileType, encryptionKey, aiSummary } = req.body

    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: 'fileUrl and fileName are required.' })
    }

    let userReports = await UserReports.findOne({ userId })
    const newReport = {
      fileUrl,
      fileName,
      description,
      fileType,
      encryptionKey,
      aiSummary,
      uploadedAt: new Date()
    }

    if (userReports) {
      userReports.reports.push(newReport)
    } else {
      userReports = new UserReports({ userId, reports: [newReport] })
    }

    await userReports.save()
    res.status(201).json({ message: 'Report added successfully!' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── Get All Reports ───────────────────────────────────────────────────────────
router.get('/getReports', async (req, res) => {
  try {
    const userId = req.user.id
    const userReports = await UserReports.findOne({ userId })
    if (!userReports) return res.json([])
    res.json(userReports.reports)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── Delete Report ─────────────────────────────────────────────────────────────
router.delete('/deleteReport/:fileName', deleteReport)

// ── Update Description ────────────────────────────────────────────────────────
router.put('/updateDescription/:fileName', updateDescription)

// ── Update AI Summary ─────────────────────────────────────────────────────────
router.put('/updateAiSummary/:fileName', async (req, res) => {
  try {
    const userId = req.user.id
    const { fileName } = req.params
    const { aiSummary } = req.body

    const result = await UserReports.updateOne(
      { userId, "reports.fileName": fileName },
      { $set: { "reports.$.aiSummary": aiSummary } }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Report not found for this user.' })
    }

    res.json({ message: 'AI summary saved to database successfully!', aiSummary })
  } catch (error) {
    console.error('Save AI summary error:', error)
    res.status(500).json({ message: error.message })
  }
})


const Vitals = require('../models/Vitals')
const jwt = require('jsonwebtoken')

// ── Gemini AI Report Analysis & Automatic Vitals Extraction ───────────────────
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded for analysis.' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is not configured.' })
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    const filePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype
      }
    }

    const summaryPrompt = `Analyze this medical report document.
Provide a clean, direct, and concise summary of the key findings.

Strict Rules:
- Keep it extremely concise and straight to the point.
- DO NOT use markdown bolding (**), asterisks (*), hashtags (#), horizontal dividers (---), or complex markdown tables. Use clean plain text only.
- Focus ONLY on:
  1. Primary abnormal lab values or vitals (with values, reference range, and high/low status).
  2. Main medical impression / diagnosis.
  3. Key recommendations / next steps.
- Do not repeat patient demographic metadata or unnecessary report header info.`

    const vitalsPrompt = `Extract any vital signs or telemetry data present in this medical report document.
Return ONLY a valid JSON object in the exact format:
{
  "systolic": number or null,
  "diastolic": number or null,
  "heartRate": number or null,
  "temperature": number or null,
  "spO2": number or null
}
Rules:
- If Blood Pressure is e.g. 120/80, set systolic=120, diastolic=80.
- Output raw JSON object only. No markdown, no triple backticks.`

    const modelCandidates = [
      "gemini-3.7-flash"
    ]

    let summary = null
    let lastError = null
    let extractedVitals = null

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" })
        const result = await model.generateContent([summaryPrompt, filePart])
        summary = result.response.text()
        if (summary) {
          summary = summary.replace(/\*{1,2}/g, '').replace(/#{1,6}\s?/g, '').trim()

          // Attempt Vitals Extraction
          try {
            const vitalsResult = await model.generateContent([vitalsPrompt, filePart])
            let rawVitalsText = vitalsResult.response.text().trim()
            rawVitalsText = rawVitalsText.replace(/```json/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(rawVitalsText)
            if (parsed && (parsed.systolic || parsed.heartRate || parsed.temperature || parsed.spO2)) {
              extractedVitals = parsed
            }
          } catch (vErr) {
            console.warn('Vitals extraction parse warning:', vErr.message)
          }

          break
        }
      } catch (err) {
        console.warn(`Gemini model ${modelName} attempt failed:`, err.message)
        lastError = err
      }
    }

    if (!summary) {
      throw lastError || new Error("Gemini API call failed.")
    }

    let vitalsSaved = false
    // If authorization header is present and vitals were extracted, auto-save to Vitals collection
    if (extractedVitals && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded && decoded.id) {
          const newVital = new Vitals({
            userId: decoded.id,
            bloodPressure: {
              systolic: extractedVitals.systolic ? Number(extractedVitals.systolic) : undefined,
              diastolic: extractedVitals.diastolic ? Number(extractedVitals.diastolic) : undefined
            },
            heartRate: extractedVitals.heartRate ? Number(extractedVitals.heartRate) : undefined,
            temperature: extractedVitals.temperature ? Number(extractedVitals.temperature) : undefined,
            spO2: extractedVitals.spO2 ? Number(extractedVitals.spO2) : undefined,
            recordedAt: new Date()
          })
          await newVital.save()
          vitalsSaved = true
          console.log('✅ Auto-extracted and saved vitals from report for user:', decoded.id)
        }
      } catch (authErr) {
        console.warn('Vitals save authorization skip:', authErr.message)
      }
    }

    res.json({
      summary,
      extractedVitals,
      vitalsSaved
    })
  } catch (error) {
    console.error('Gemini analysis error:', error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
