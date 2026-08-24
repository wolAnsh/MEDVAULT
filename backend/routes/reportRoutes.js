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

// ── Gemini AI Report Analysis ──────────────────────────────────────────────────
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" })

    const filePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype
      }
    }

    const prompt = `Analyze this medical report document (it might be an image of a report, a prescription, a scan result, or a PDF).
Provide a professional, concise, and structured summary of the report.
Include:
1. Patient Details (if visible)
2. Primary Observations & Clinical Findings
3. Key Vitals / Lab Values (if any, with reference ranges)
4. Diagnoses & Recommendations
If the document is handwritten, transcribe the handwritten text clearly first.
Keep the summary concise, readable, and structured using clean headings.`

    const result = await model.generateContent([prompt, filePart])
    const summary = result.response.text()

    res.json({ summary })
  } catch (error) {
    console.error('Gemini analysis error:', error)
    res.status(500).json({ message: 'AI Analysis failed: ' + error.message })
  }
})

module.exports = router
