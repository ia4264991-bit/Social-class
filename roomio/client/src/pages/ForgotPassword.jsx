import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/axios'

// ─── Step 1: Enter email ─────────────────────────────────────────
function StepEmail({ onSent }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post('/api/auth/send-otp', { email: email.trim() })
      onSent(email.trim())
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send code. Check your connection.'
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">📧</div>
        <h2 className="font-head font-black text-white text-xl">Forgot your password?</h2>
        <p className="text-dark-muted text-sm mt-2 leading-relaxed">
          Enter your registered email and we'll send a 6-digit verification code via Brevo.
        </p>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-dark-muted mb-1.5">Email address</label>
          <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@st.ucc.edu.gh"
            className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50 transition-colors" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm hover:bg-brand-green-dim disabled:opacity-50 press">
          {loading ? 'Sending code...' : 'Send Verification Code →'}
        </button>
      </form>
    </>
  )
}

// ─── Step 2: Enter OTP ───────────────────────────────────────────
function StepOtp({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(60)
  const [resending, setResending] = useState(false)
  const refs = useRef([])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const updateDigit = (idx, val) => {
    // Handle paste of full 6-digit code
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const arr = val.split('')
      setDigits(arr)
      refs.current[5]?.focus()
      return
    }
    const clean = val.replace(/\D/g, '').slice(0, 1)
    const next = [...digits]
    next[idx] = clean
    setDigits(next)
    if (clean && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleKey = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  const submit = async () => {
    const otp = digits.join('')
    if (otp.length < 6) { setError('Enter all 6 digits.'); return }
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/api/auth/verify-otp', { email, otp })
      onVerified(data.resetToken)
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect code. Try again.')
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setResending(true); setError('')
    try {
      await api.post('/api/auth/send-otp', { email })
      setCooldown(60)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend.')
    } finally { setResending(false) }
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🔢</div>
        <h2 className="font-head font-black text-white text-xl">Enter verification code</h2>
        <p className="text-dark-muted text-sm mt-2 leading-relaxed">
          We sent a 6-digit code to <span className="text-white font-semibold">{email}</span>
          <br/>Check your inbox and spam folder. Code expires in 10 minutes.
        </p>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      {/* OTP digit boxes */}
      <div className="flex gap-2 justify-center mb-6">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => refs.current[i] = el}
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={d}
            onChange={e => updateDigit(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onFocus={e => e.target.select()}
            className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all bg-dark-card2 text-white
              ${d ? 'border-brand-green text-brand-green' : 'border-dark-border focus:border-brand-green/60'}`}
          />
        ))}
      </div>

      <button onClick={submit} disabled={loading || digits.join('').length < 6}
        className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm hover:bg-brand-green-dim disabled:opacity-50 press mb-4">
        {loading ? 'Verifying...' : 'Verify Code →'}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-dark-muted hover:text-white press">← Change email</button>
        <button onClick={resend} disabled={cooldown > 0 || resending}
          className="text-brand-green font-bold disabled:text-dark-subtle disabled:cursor-default press">
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend code'}
        </button>
      </div>
    </>
  )
}

// ─── Step 3: Set new password ────────────────────────────────────
function StepNewPassword({ email, resetToken, onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const strength = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 9  ? 2
    : password.length < 12 ? 3 : 4

  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong ✓']
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-brand-green']

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { email, resetToken, newPassword: password })
      onDone()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password.')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🔑</div>
        <h2 className="font-head font-black text-white text-xl">Set new password</h2>
        <p className="text-dark-muted text-sm mt-2">Choose a strong password for your account.</p>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-dark-muted mb-1.5">New Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} required autoFocus
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 pr-12 text-sm text-white outline-none focus:border-brand-green/50" />
            <button type="button" onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white text-lg press">
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${strength >= i ? strengthColor[strength] : 'bg-dark-border'}`} />
                ))}
              </div>
              <p className="text-xs text-dark-muted">{strengthLabel[strength]}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-dark-muted mb-1.5">Confirm Password</label>
          <input type={showPw ? 'text' : 'password'} required
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            className={`w-full bg-dark-card2 border rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors
              ${confirm && confirm !== password ? 'border-red-600' : 'border-dark-border focus:border-brand-green/50'}`} />
          {confirm && confirm !== password && (
            <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
          )}
        </div>
        <button type="submit" disabled={loading || password !== confirm || password.length < 6}
          className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm hover:bg-brand-green-dim disabled:opacity-50 press">
          {loading ? 'Updating...' : 'Update Password ✓'}
        </button>
      </form>
    </>
  )
}

// ─── Step 4: Success ─────────────────────────────────────────────
function StepSuccess() {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate('/login'), 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="text-center py-6">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="font-head font-black text-white text-xl mb-2">Password updated!</h2>
      <p className="text-dark-muted text-sm">Redirecting you to sign in...</p>
      <div className="mt-4 h-1 bg-dark-border rounded-full overflow-hidden">
        <div className="h-full bg-brand-green rounded-full animate-[grow_3s_linear_forwards]"
          style={{ animation: 'width 3s linear forwards', width: '100%' }} />
      </div>
    </div>
  )
}

// ─── Main page orchestrator ──────────────────────────────────────
export default function ForgotPassword() {
  const [step, setStep] = useState(1)       // 1 | 2 | 3 | 4
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')

  const STEP_LABELS = ['Email', 'Verify', 'Password', 'Done']

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 safe-top">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 font-head font-black text-dark-bg text-2xl"
            style={{ background: 'linear-gradient(135deg,#00c853,#CCA000)' }}>R</div>
          <h1 className="font-head font-black text-white text-xl">Roomio <span className="text-brand-green">CS</span></h1>
          <p className="text-dark-muted text-xs mt-1">Password Reset</p>
        </div>

        {/* Step progress */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-6">
            {STEP_LABELS.slice(0, 3).map((label, i) => {
              const s = i + 1
              const active = step === s
              const done = step > s
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all
                    ${done ? 'bg-brand-green text-dark-bg' : active ? 'bg-brand-green/20 text-brand-green border border-brand-green/50' : 'bg-dark-border text-dark-subtle'}`}>
                    {done ? '✓' : s}
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-brand-green' : done ? 'text-dark-muted' : 'text-dark-subtle'}`}>{label}</span>
                  {s < 3 && <div className={`flex-1 h-px ${done ? 'bg-brand-green/50' : 'bg-dark-border'}`} />}
                </div>
              )
            })}
          </div>
        )}

        <div className="card p-6">
          {step === 1 && (
            <StepEmail onSent={e => { setEmail(e); setStep(2) }} />
          )}
          {step === 2 && (
            <StepOtp
              email={email}
              onVerified={token => { setResetToken(token); setStep(3) }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepNewPassword
              email={email}
              resetToken={resetToken}
              onDone={() => setStep(4)}
            />
          )}
          {step === 4 && <StepSuccess />}

          {step < 4 && (
            <div className="mt-5 text-center">
              <Link to="/login" className="text-xs text-dark-muted hover:text-brand-green press">
                ← Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
