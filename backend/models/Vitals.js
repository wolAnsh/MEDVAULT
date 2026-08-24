const mongoose = require("mongoose");

const vitalsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  temperature: Number,
  spO2: Number,
  recordedAt: { type: Date, default: Date.now }
});

vitalsSchema.index({ userId: 1, recordedAt: -1 });

module.exports = mongoose.model("Vitals", vitalsSchema);
