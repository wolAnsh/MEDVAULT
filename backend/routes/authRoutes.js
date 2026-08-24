const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')

const router = express.Router()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  })
  return ticket.getPayload()
}

// ── Google Sign In ────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ message: 'Token is required.' })
    }

    const payload = await verifyGoogleToken(token)
    const { sub, email, name } = payload

    let user = await User.findOne({ email })
    if (!user) {
      user = new User({
        username: name || email.split('@')[0],
        email,
        googleId: sub
      })
      await user.save()
    } else if (!user.googleId) {
      user.googleId = sub
      await user.save()
    }

    const jwtToken = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token: jwtToken,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (error) {
    console.error('Google Auth Error:', error.message)
    res.status(401).json({ message: 'Invalid Google token.' })
  }
})


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
