import { Router } from 'express'
import { supabase } from '../supabase.js'
import { sendOtpEmail } from '../mailer.js'
import crypto from 'crypto'

const router = Router()

// ── helpers ──────────────────────────────────────────────────────
function generateOtp() {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + crypto.randomInt(900000)))
}

// Store OTPs in memory with expiry.
// For production with multiple server instances use Redis or the otp_codes table.
// This Map works fine for a single Render instance.
const otpStore = new Map() // email → { otp, expiresAt, attempts }

// ── POST /api/auth/register ───────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, full_name, hall, room_number, level } = req.body

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required' })
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) {
    console.error('Register auth error:', authError.message)
    return res.status(400).json({ error: authError.message })
  }

  const username = email.split('@')[0].replace(/[^a-z0-9_]/gi, '_')
  const { error: profileError } = await supabase.from('profiles').insert({
    id:          authData.user.id,
    full_name,
    username,
    hall:        hall || null,
    room_number: room_number || null,
    department:  'Computer Science',
    level:       level || null,
  })

  if (profileError) {
    console.error('Register profile error:', profileError.message)
    await supabase.auth.admin.deleteUser(authData.user.id)
    return res.status(400).json({ error: profileError.message })
  }

  res.json({ message: 'Registered successfully', userId: authData.user.id })
})

// ── POST /api/auth/send-otp ───────────────────────────────────────
// Step 1: User enters email → we send OTP via Brevo
router.post('/send-otp', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email is required' })

  // Check user exists in Supabase auth
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return res.status(500).json({ error: 'Could not verify account' })

  const userExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!userExists) {
    // Return success anyway to prevent email enumeration
    return res.json({ message: 'If that email is registered, an OTP has been sent.' })
  }

  // Rate limit: max 1 OTP per 60s per email
  const existing = otpStore.get(email.toLowerCase())
  if (existing && Date.now() < existing.expiresAt - 9 * 60 * 1000) {
    return res.status(429).json({ error: 'Please wait 60 seconds before requesting another code.' })
  }

  const otp = generateOtp()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

  otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 })

  try {
    await sendOtpEmail(email, otp)
    console.log(`OTP sent to ${email}`)
  } catch (mailErr) {
    console.error('Brevo send error:', mailErr.message)
    otpStore.delete(email.toLowerCase())
    return res.status(500).json({ error: 'Failed to send OTP email. Check Brevo credentials.' })
  }

  res.json({ message: 'OTP sent successfully.' })
})

// ── POST /api/auth/verify-otp ─────────────────────────────────────
// Step 2: User enters OTP → we verify it and return a reset token
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' })

  const record = otpStore.get(email.toLowerCase())

  if (!record) {
    return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' })
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase())
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
  }

  record.attempts += 1
  if (record.attempts > 5) {
    otpStore.delete(email.toLowerCase())
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' })
  }

  if (record.otp !== otp.trim()) {
    const remaining = 5 - record.attempts
    return res.status(400).json({ error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` })
  }

  // OTP is valid — delete it so it can't be reused
  otpStore.delete(email.toLowerCase())

  // Generate a short-lived admin token the client sends with the new password
  // We store a verified flag in memory keyed by email
  const resetToken = crypto.randomBytes(32).toString('hex')
  otpStore.set(`verified:${email.toLowerCase()}`, { resetToken, expiresAt: Date.now() + 15 * 60 * 1000 })

  res.json({ message: 'OTP verified.', resetToken })
})

// ── POST /api/auth/reset-password ────────────────────────────────
// Step 3: User enters new password with the reset token we gave them
router.post('/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ error: 'email, resetToken, and newPassword are required' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  const record = otpStore.get(`verified:${email.toLowerCase()}`)
  if (!record || record.resetToken !== resetToken || Date.now() > record.expiresAt) {
    return res.status(401).json({ error: 'Invalid or expired reset session. Start over.' })
  }

  // Find user by email
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return res.status(500).json({ error: 'Server error finding account' })

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return res.status(404).json({ error: 'Account not found' })

  // Update password using service role
  const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (updateErr) {
    console.error('Password update error:', updateErr.message)
    return res.status(400).json({ error: updateErr.message })
  }

  otpStore.delete(`verified:${email.toLowerCase()}`)
  res.json({ message: 'Password updated successfully.' })
})

export default router
