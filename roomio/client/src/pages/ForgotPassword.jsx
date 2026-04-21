import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/axios'

// 3-step flow:
// Step 1 — Enter email → POST /api/auth/send-otp
// Step 2 — Enter 6-digit OTP → POST /api/auth/verify-otp → get resetToken
// Step 3 — Enter new password → POST /api/auth/reset-password

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // ── Step 1: send OTP ──────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/send-otp', { email })
      setStep(2)
      startCooldown()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const startCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/send-otp', { email })
      setOtp(['', '', '', '', '', ''])
      startCooldown()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend.')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP input boxes ───────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    // Auto-advance focus
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      document.getElementById('otp-5')?.focus()
    }
    e.preventDefault()
  }

  // ── Step 2: verify OTP ────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return setError('Enter all 6 digits.')
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/verify-otp', { email, otp: code })
      setResetToken(data.resetToken)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect code.')
      // Shake the boxes
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: reset password ────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { email, resetToken, newPassword })
      setStep(4) // success
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = newPassword.length === 0 ? 0
    : newPassword.length < 6 ? 1
    : newPassword.length < 9 ? 2
    : newPassword.length < 12 ? 3 : 4
  const pwLabels = ['', 'Too short', 'Fair', 'Good', 'Strong ✓']
  const pwColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-brand-green']

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 safe-top">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 font-head font-black text-dark-bg text-3xl"
            style={{ background: 'linear-gradient(135deg,#00c853,#CCA000)' }}>R</div>
          <h1 className="font-head font-black text-white text-2xl">Reset Password</h1>
          <p className="text-dark-muted text-sm mt-1">Roomio CS · UCC</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-500 ${step > s ? 'bg-brand-green' : step === s ? 'bg-brand-green/60' : 'bg-dark-border'}`} />
          ))}
        </div>

        <div className="card p-6">

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <>
              <h2 className="font-head font-bold text-white text-lg mb-1">Forgot your password?</h2>
              <p className="text-dark-muted text-sm mb-5">Enter your email and we'll send you a 6-digit OTP.</p>

              {error && <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@st.ucc.edu.gh"
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50 transition-colors" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm hover:bg-brand-green-dim transition-colors disabled:opacity-50 press">
                  {loading ? 'Sending OTP...' : 'Send OTP Code'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <>
              <h2 className="font-head font-bold text-white text-lg mb-1">Check your email</h2>
              <p className="text-dark-muted text-sm mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-white font-bold text-sm mb-6">{email}</p>

              {error && <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

              <form onSubmit={handleVerifyOtp}>
                {/* OTP boxes */}
                <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-14 text-center text-2xl font-black rounded-xl border-2 bg-dark-card2 text-white outline-none transition-all
                        ${digit ? 'border-brand-green text-brand-green' : 'border-dark-border focus:border-brand-green/50'}`}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join('').length < 6}
                  className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm hover:bg-brand-green-dim disabled:opacity-50 press mb-4">
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <div className="text-center space-y-2">
                <button onClick={handleResend} disabled={resendCooldown > 0 || loading}
                  className="text-sm text-brand-green font-bold hover:underline disabled:text-dark-subtle disabled:no-underline press">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
                <div />
                <button onClick={() => { setStep(1); setOtp(['','','','','','']); setError('') }}
                  className="text-xs text-dark-muted hover:text-white press">
                  ← Use a different email
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: New password ── */}
          {step === 3 && (
            <>
              <h2 className="font-head font-bold text-white text-lg mb-1">Set new password</h2>
              <p className="text-dark-muted text-sm mb-5">Choose a strong password for your account.</p>

              {error && <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">New Password</label>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50 transition-colors" />
                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${pwStrength >= i ? pwColors[pwStrength] : 'bg-dark-border'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-dark-subtle">{pwLabels[pwStrength]}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full bg-dark-card2 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50 transition-colors
                      ${confirmPassword && confirmPassword !== newPassword ? 'border-red-700/60' : 'border-dark-border'}`} />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
                  )}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm hover:bg-brand-green-dim disabled:opacity-50 press">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="font-head font-bold text-white text-xl mb-2">Password Updated!</h2>
              <p className="text-dark-muted text-sm mb-1">Your password has been successfully changed.</p>
              <p className="text-dark-subtle text-xs">Redirecting you to sign in...</p>
            </div>
          )}

          {step < 4 && (
            <div className="mt-5 text-center">
              <Link to="/login" className="text-xs text-dark-muted hover:text-brand-green transition-colors">← Back to Sign In</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
