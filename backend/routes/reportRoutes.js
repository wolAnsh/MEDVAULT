const express = require('express')
const router = express.Router()
const UserReports = require('../models/UserReports')
const verifyToken = require('../middleware/verifyToken')
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
    const { fileUrl, fileName, description } = req.body

    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: 'fileUrl and fileName are required.' })
    }

    let userReports = await UserReports.findOne({ userId })
    const newReport = { fileUrl, fileName, description, uploadedAt: new Date() }

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

module.exports = router
