const UserReports = require('../models/UserReports')
const SharedLink = require('../models/SharedLink')
const { generateQRCode } = require('../utils/qrcodeGenerator')
const crypto = require('crypto')

// ── Generate Share Link (idempotent) ─────────────────────────────────────────
const generateShareLink = async (req, res) => {
  try {
    const userId = req.user.id
    const { fileName } = req.params

    // Verify the report belongs to this user
    const userReports = await UserReports.findOne({ userId })
    if (!userReports) return res.status(404).json({ message: 'User reports not found' })

    const report = userReports.reports.find(r => r.fileName === fileName)
    if (!report) return res.status(404).json({ message: 'Report not found' })

    // Idempotent: reuse an existing, still-valid link for this file
    const existingLink = await SharedLink.findOne({
      userId,
      fileName,
      expiresAt: { $gt: new Date() }
    })

    let token, expiresAt

    if (existingLink) {
      token = existingLink.token
      expiresAt = existingLink.expiresAt
    } else {
      token = crypto.randomBytes(20).toString('hex')
      const expiryMs = parseInt(process.env.SHARE_LINK_TTL_MINUTES || '60') * 60 * 1000
      expiresAt = new Date(Date.now() + expiryMs)
      await SharedLink.create({ userId, fileName, token, expiresAt })
    }

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000'
    const shareURL = `${frontendBase}/shared/${token}`
    const qrCode = await generateQRCode(shareURL)

    res.json({ qrCode, shareURL, expiresAt })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Access Shared Report ──────────────────────────────────────────────────────
const accessSharedReport = async (req, res) => {
  try {
    const { token } = req.params

    const link = await SharedLink.findOne({ token })
    if (!link) return res.status(404).json({ message: 'Invalid or expired link' })
    if (new Date() > link.expiresAt) {
      await SharedLink.deleteOne({ token }) // clean up expired
      return res.status(410).json({ message: 'This link has expired.' })
    }

    const userReports = await UserReports.findOne({ userId: link.userId })
    if (!userReports) return res.status(404).json({ message: 'Report owner not found' })

    const report = userReports.reports.find(r => r.fileName === link.fileName)
    if (!report) return res.status(404).json({ message: 'Report not found' })

    res.json({ ...report.toObject(), expiresAt: link.expiresAt })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Delete Report ─────────────────────────────────────────────────────────────
const deleteReport = async (req, res) => {
  try {
    const userId = req.user.id
    const { fileName } = req.params

    const userReports = await UserReports.findOne({ userId })
    if (!userReports) return res.status(404).json({ message: 'User not found' })

    const originalLength = userReports.reports.length
    userReports.reports = userReports.reports.filter(r => r.fileName !== fileName)

    if (userReports.reports.length === originalLength) {
      return res.status(404).json({ message: 'Report not found' })
    }

    await userReports.save()
    // Also remove any shared links for this report
    await SharedLink.deleteMany({ userId, fileName })

    res.json({ message: 'Report deleted successfully.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Update Description ────────────────────────────────────────────────────────
const updateDescription = async (req, res) => {
  try {
    const userId = req.user.id
    const { fileName } = req.params
    const { newDescription } = req.body

    if (newDescription === undefined) {
      return res.status(400).json({ message: 'newDescription is required.' })
    }

    const userReports = await UserReports.findOne({ userId })
    if (!userReports) return res.status(404).json({ message: 'User not found' })

    const report = userReports.reports.find(r => r.fileName === fileName)
    if (!report) return res.status(404).json({ message: 'Report not found' })

    report.description = newDescription
    await userReports.save()

    res.json({ message: 'Description updated successfully.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { generateShareLink, accessSharedReport, deleteReport, updateDescription }
