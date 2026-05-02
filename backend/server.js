const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const reportRoutes = require('./routes/reportRoutes')
const authRoutes = require('./routes/authRoutes')

dotenv.config()

const app = express()

// ── Security & Middleware ─────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001']

app.use(cors({
  origin: (origin, callback) => {
    // During development, allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Rate Limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many attempts, please try again later.' }
})

const qrLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { message: 'Too many QR requests, slow down.' }
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authLimiter, authRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/reports/generate-share-link', qrLimiter)

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

// ── Database & Server ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
