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


const { sendOTPEmail } = require('../utils/sendEmail')

// ── Sign Up (Step 1: Save details & Send OTP) ─────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, age, height, weight, bloodType } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required.' })
    }

    let user = await User.findOne({ email })
    if (user && user.isVerified) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    if (user) {
      user.username = username
      user.password = hashedPassword
      user.age = age ? Number(age) : undefined
      user.height = height ? Number(height) : undefined
      user.weight = weight ? Number(weight) : undefined
      user.bloodType = bloodType
      user.otp = otp
      user.otpExpires = otpExpires
    } else {
      user = new User({
        username,
        email,
        password: hashedPassword,
        age: age ? Number(age) : undefined,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        bloodType,
        isVerified: false,
        otp,
        otpExpires
      })
    }

    await user.save()
    await sendOTPEmail(email, otp)

    res.status(200).json({
      message: 'OTP sent to your email address.',
      otpSent: true,
      email
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Server error during signup: ' + error.message })
  }
})

// ── Verify OTP (Step 2: Validate OTP & Complete Registration) ─────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required.' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please sign up again.' })
    }

    if (!user.otp || user.otp !== otp.trim() || !user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please request a new one.' })
    }

    user.isVerified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Account verified successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        age: user.age,
        height: user.height,
        weight: user.weight,
        bloodType: user.bloodType
      }
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ message: 'Server error during OTP verification.' })
  }
})

// ── Resend OTP ────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required.' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'Account not found.' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.otp = otp
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendOTPEmail(email, otp)
    res.json({ message: 'A new OTP has been sent to your email.' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend OTP.' })
  }
})

// ── Log In ────────────────────────────────────────────────────────────
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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        age: user.age,
        height: user.height,
        weight: user.weight,
        bloodType: user.bloodType
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// ── Profile Endpoints ──────────────────────────────────────────────────
const verifyToken = require('../middleware/verifyToken')

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires')
    if (!user) return res.status(404).json({ message: 'User not found.' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile.' })
  }
})

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, age, height, weight, bloodType } = req.body
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    if (username) user.username = username
    if (age !== undefined) user.age = Number(age)
    if (height !== undefined) user.height = Number(height)
    if (weight !== undefined) user.weight = Number(weight)
    if (bloodType) user.bloodType = bloodType

    await user.save()
    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        age: user.age,
        height: user.height,
        weight: user.weight,
        bloodType: user.bloodType,
        isVerified: user.isVerified
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile.' })
  }
})

module.exports = router
