const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/verifyToken");
const User = require("../models/User"); 
const router = express.Router();
const secretKey = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("Received signup request:", req.body);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });

    await user.save();
    console.log("User saved successfully!");

    res.json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request received:", email);

    const user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("Generated Token:", token);

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     console.log("Login request received:", email);
// console.log("JWT Secret Key:", process.env.JWT_SECRET);

//     const user = await User.findOne({ email });
//     console.log("User found:", user);

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       console.error("Invalid credentials");
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "1h" });
//     console.log("Generated token:", token);
    
//     res.json({ token });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// Protected Route Example
router.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: "Welcome to the protected route!", user: req.user });
});

module.exports = router;
