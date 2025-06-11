
const express = require("express")
const UserReports = require("../models/UserReports.js")
const router = express.Router()
const userId = 107
const { generateShareLink, accessSharedReport } = require('../controllers/reportController');


router.post('/generate-share-link/:fileName', generateShareLink);
router.get('/shared/:token', accessSharedReport);

module.exports = router;

router.post("/addReport", async (req, res) => {
  try {
    const { userId, fileUrl, fileName, description } = req.body

    // check if user already has a document
    let userReports = await UserReports.findOne({ userId })

    const newReport = {
      fileUrl,
      fileName,
      description,
      uploadedAt: new Date()
    }


    if (userReports) {
      // if exists, push new report
      userReports.reports.push(newReport)
    } else {
      // if not, create new userReports document
      userReports = new UserReports({
        userId,
        reports: [newReport]
      })
    }

    await userReports.save()
    res.status(201).json({ message: "Report added successfully!" })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get all reports for a user
router.get("/getReports/:userId", async (req, res) => {
  try {
    const userReports = await UserReports.findOne({ userId: req.params.userId })
    if (!userReports) return res.status(404).json({ message: "No reports found." })
    res.json(userReports.reports)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
