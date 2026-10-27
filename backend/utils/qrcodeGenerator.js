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

module.exports = { generateQRCode, generateQRCodeSVG }
