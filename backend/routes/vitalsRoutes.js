const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const vitalsController = require('../controllers/vitalsController')

// All routes require valid user token
router.use(verifyToken)

router.post('/add', vitalsController.addVitals)
router.get('/', vitalsController.getVitals)

module.exports = router
