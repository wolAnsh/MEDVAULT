const mongoose = require('mongoose');

const sharedLinkSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('SharedLink', sharedLinkSchema);
