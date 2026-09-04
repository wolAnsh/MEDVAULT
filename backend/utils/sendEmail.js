const nodemailer = require('nodemailer')

const sendOTPEmail = async (email, otp) => {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com'
  const emailPort = parseInt(process.env.EMAIL_PORT || '587')

  console.log(`\n==========================================`)
  console.log(`🔐 MEDVAULT OTP FOR [${email}]: ${otp}`)
  console.log(`==========================================\n`)

  if (!emailUser || !emailPass) {
    console.log('⚠️ Nodemailer: EMAIL_USER or EMAIL_PASS not set in backend/.env. Logging OTP to console above for dev testing.')
    return { success: true, mode: 'console' }
  }

  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for 587
    auth: {
      user: emailUser,
      pass: emailPass
    }
  })

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px;">🏥</span>
        <h2 style="color: #38bdf8; margin: 8px 0 0 0; font-size: 24px;">MedVault</h2>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Secure Medical Record Verification</p>
      </div>

      <div style="background: #1e293b; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #334155;">
        <h3 style="color: #f1f5f9; margin-top: 0; font-size: 18px;">Your Verification Code</h3>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Use the 6-digit code below to verify your MedVault account. This code is valid for 10 minutes.</p>
        
        <div style="background: #0f172a; color: #38bdf8; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; display: inline-block; border: 1px solid #0284c7;">
          ${otp}
        </div>
      </div>

      <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">
        If you did not request this verification code, please ignore this email.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: `"MedVault Security" <${emailUser}>`,
    to: email,
    subject: `🔐 Your MedVault Verification Code: ${otp}`,
    html: htmlContent
  })

  return { success: true, mode: 'email' }
}

module.exports = { sendOTPEmail }
