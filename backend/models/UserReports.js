const mongoose = require("mongoose")
const reportSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  fileName: String,
  description: String,
  fileType: String,       // Store MIME type (e.g. application/pdf, image/png)
  encryptionKey: String,  // Hex-encoded symmetric key for decryption
  aiSummary: String,      // Gemini-generated analysis
  uploadedAt: { type: Date, default: Date.now }
})

const userReportsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  reports: [reportSchema]
})

module.exports =  mongoose.model("UserReports", userReportsSchema)
