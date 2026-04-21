import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

// Brevo SMTP transporter
// Credentials come from Supabase env vars you set on Render
export const transporter = nodemailer.createTransport({
  host:   process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port:   Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
})

const FROM = `"${process.env.BREVO_FROM_NAME || 'Roomio CS UCC'}" <${process.env.BREVO_FROM_EMAIL || 'noreply@roomio.ucc'}>`

export async function sendOtpEmail(toEmail, otp) {
  const html = `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f1117;color:#f1f5f9;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#006633,#CCA000);padding:28px 32px;text-align:center;">
        <span style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;">Roomio <span style="color:#0f1117;">CS</span></span>
        <div style="font-size:11px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:2px;">UCC · COMPUTER SCIENCE</div>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#fff;">Password Reset OTP</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
          Use the code below to reset your Roomio CS password. It expires in <strong style="color:#f1f5f9;">10 minutes</strong>.
        </p>
        <div style="background:#161b27;border:1px solid #1e293b;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#00c853;font-family:monospace;">${otp}</div>
        </div>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
          If you didn't request this, ignore this email — your account is safe.<br/>
          Do not share this code with anyone.
        </p>
      </div>
      <div style="background:#0a0f17;padding:16px 32px;text-align:center;">
        <span style="font-size:11px;color:#475569;">© Roomio CS UCC · Department of Computer Science</span>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `${otp} is your Roomio CS reset code`,
    html,
    text: `Your Roomio CS password reset code is: ${otp}\n\nExpires in 10 minutes. Do not share it.`,
  })
}
