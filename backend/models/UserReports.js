// import mongoose from "mongoose"
const mongoose = require("mongoose")
const reportSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  fileName: String,
  description: String,
  uploadedAt: { type: Date, default: Date.now }
})

const userReportsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  reports: [reportSchema]
})

module.exports =  mongoose.model("UserReports", userReportsSchema)
