const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
  age: Number,
  height: Number,
  weight: Number,
  bloodType: String,
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
