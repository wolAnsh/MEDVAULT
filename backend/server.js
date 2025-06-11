const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const reportRoutes = require('./routes/reportRoutes')
const authRoutes = require('./routes/authRoutes.js');
const app = express()

dotenv.config()

app.use(cors())
app.use(express.json())
app.use('/auth', authRoutes);
app.use('/api/reports', reportRoutes)

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err))


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
