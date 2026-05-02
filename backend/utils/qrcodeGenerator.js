const QRCode = require('qrcode')

/**
 * Generates a high-quality QR code as a Base64 data URL.
 * @param {string} text - The URL or text to encode
 * @returns {Promise<string>} Base64 PNG data URL
 */
const generateQRCode = async (text) => {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',  // Highest error correction — survives partial damage
    type: 'image/png',
    margin: 2,
    width: 300,
    color: {
      dark: '#0f172a',   // Deep navy — matches app design
      light: '#ffffff'
    }
  })
}

/**
 * Generates a QR code as an SVG string (useful for download).
 * @param {string} text
 * @returns {Promise<string>} SVG string
 */
const generateQRCodeSVG = async (text) => {
  return await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  })
}

module.exports = { generateQRCode, generateQRCodeSVG }
