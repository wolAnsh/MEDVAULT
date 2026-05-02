const jwt = require('jsonwebtoken')

/**
 * Middleware: verifies JWT Bearer token.
 * On success, attaches decoded payload to req.user ({ id, username, email, ... }).
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' })
    }
    return res.status(401).json({ message: 'Invalid token.' })
  }
}

module.exports = verifyToken
