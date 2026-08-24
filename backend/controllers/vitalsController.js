const Vitals = require('../models/Vitals')

exports.addVitals = async (req, res) => {
  try {
    const userId = req.user.id
    const { systolic, diastolic, heartRate, temperature, spO2 } = req.body

    // Basic validation
    if (!systolic || !diastolic || !heartRate || !temperature || !spO2) {
      return res.status(400).json({ message: 'All vitals fields are required.' })
    }

    const newReading = new Vitals({
      userId,
      bloodPressure: {
        systolic: Number(systolic),
        diastolic: Number(diastolic)
      },
      heartRate: Number(heartRate),
      temperature: Number(temperature),
      spO2: Number(spO2),
      recordedAt: new Date()
    })

    await newReading.save()
    res.status(201).json({ message: 'Vitals recorded successfully!', data: newReading })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getVitals = async (req, res) => {
  try {
    const userId = req.user.id
    // Fetch last 10 readings, sorted descending by recordedAt
    const readings = await Vitals.find({ userId })
      .sort({ recordedAt: -1 })
      .limit(10)

    // Reverse to chronological order for line charts
    res.json(readings.reverse())
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
