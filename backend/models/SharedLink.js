const mongoose = require('mongoose')

const sharedLinkSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  fileName:  { type: String, required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date,   required: true }
})

// ── TTL Index: MongoDB auto-deletes expired documents ─────────────────────────
// Documents are removed automatically after their expiresAt time passes.
sharedLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// ── Compound index for idempotent lookup ──────────────────────────────────────
sharedLinkSchema.index({ userId: 1, fileName: 1, expiresAt: 1 })

module.exports = mongoose.model('SharedLink', sharedLinkSchema)
