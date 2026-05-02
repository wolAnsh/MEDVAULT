const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const router = express.Router()

// ── Sign Up ───────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required.' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = new User({ username, email, password: hashedPassword })
    await user.save()

    res.status(201).json({ message: 'Account created successfully! Please log in.' })
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// ── Log In ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await User.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

module.exports = router
