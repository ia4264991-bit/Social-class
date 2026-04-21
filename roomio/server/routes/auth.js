import { Router } from 'express'
import { supabase } from '../supabase.js'
import crypto from 'crypto'

const router = Router()

// In-memory OTP store: email → { otp, expiresAt, attempts }
// Works for a single server instance (Render). For multiple instances use Redis.
const otpStore = new Map()

function generateOtp() {
  return String(Math.floor(100000 + crypto.randomInt(900000)))
}

// ── POST /api/auth/register ───────────────────────────────────────
// Uses service_role key so profile insert bypasses RLS.
// This is the ONLY correct way to register — never use client signUp() + profile insert
// because at signUp time the user isn't authenticated so RLS blocks the profile insert.
router.post('/register', async (req, res) => {
  const { email, password, full_name, hall, room_number, level } = req.body

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required' })
  }

  // Step 1: create auth user (email_confirm: true skips the confirmation email)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // ← confirms immediately, no email verification needed
  })

  if (authError) {
    console.error('Register auth error:', authError.message)
    return res.status(400).json({ error: authError.message })
  }

  const userId = authData.user.id
  const username = email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase()

  // Step 2: insert profile using service_role (bypasses RLS)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id:          userId,
    full_name:   full_name.trim(),
    username,
    hall:        hall        || null,
    room_number: room_number || null,
    department:  'Computer Science',
    level:       level       || null,
    is_online:   false,
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('Register profile error:', profileError.message)
    // Clean up the auth user so the user can retry
    await supabase.auth.admin.deleteUser(userId).catch(() => {})
    return res.status(400).json({ error: profileError.message })
  }

  console.log(`✅ Registered user ${email} (${userId})`)
  res.json({ message: 'Registered successfully', userId })
})

// ── POST /api/auth/send-otp ───────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email is required' })

  // Check if user exists (without revealing which emails are registered)
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) {
    console.error('List users error:', listErr.message)
    return res.status(500).json({ error: 'Server error. Please try again.' })
  }

  const exists = users.some(u => u.email?.toLowerCase() === email.toLowerCase())

  // Rate limit: 1 OTP per 60 seconds
  const existing = otpStore.get(email.toLowerCase())
  if (existing && Date.now() < existing.expiresAt - 9 * 60 * 1000) {
    return res.status(429).json({ error: 'Please wait 60 seconds before requesting another code.' })
  }

  // Always respond with success to prevent email enumeration
  if (!exists) {
    console.log(`OTP requested for non-existent email: ${email}`)
    return res.json({ message: 'If that email is registered, a code has been sent.' })
  }

  const otp = generateOtp()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 min

  otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 })
  console.log(`OTP for ${email}: ${otp}`) // Remove in production or use a proper logger

  // Send via Brevo SMTP
  try {
    const { sendOtpEmail } = await import('../mailer.js')
    await sendOtpEmail(email, otp)
  } catch (mailErr) {
    console.error('Brevo send error:', mailErr.message)
    otpStore.delete(email.toLowerCase())
    return res.status(500).json({
      error: 'Failed to send email. Check BREVO_SMTP_USER and BREVO_SMTP_PASS in your Render environment variables.'
    })
  }

  res.json({ message: 'Code sent successfully.' })
})

// ── POST /api/auth/verify-otp ─────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' })

  const record = otpStore.get(email.toLowerCase())

  if (!record) {
    return res.status(400).json({ error: 'No code found for this email. Request a new one.' })
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase())
    return res.status(400).json({ error: 'Code expired. Request a new one.' })
  }

  record.attempts += 1
  if (record.attempts > 5) {
    otpStore.delete(email.toLowerCase())
    return res.status(429).json({ error: 'Too many incorrect attempts. Request a new code.' })
  }

  if (record.otp !== otp.trim()) {
    const left = 5 - record.attempts
    return res.status(400).json({
      error: `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`
    })
  }

  // Valid — issue a short-lived reset token
  otpStore.delete(email.toLowerCase())
  const resetToken = crypto.randomBytes(32).toString('hex')
  otpStore.set(`verified:${email.toLowerCase()}`, {
    resetToken,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 min to set new password
  })

  res.json({ message: 'Code verified.', resetToken })
})

// ── POST /api/auth/reset-password ────────────────────────────────
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
    return res.status(401).json({ error: 'Reset session expired or invalid. Start over.' })
  }

  // Find user by email
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) return res.status(500).json({ error: 'Server error' })

  const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!target) return res.status(404).json({ error: 'Account not found' })

  const { error: updateErr } = await supabase.auth.admin.updateUserById(target.id, {
    password: newPassword,
  })
  if (updateErr) {
    console.error('Password update error:', updateErr.message)
    return res.status(400).json({ error: updateErr.message })
  }

  otpStore.delete(`verified:${email.toLowerCase()}`)
  console.log(`✅ Password reset for ${email}`)
  res.json({ message: 'Password updated successfully.' })
})

export default router
