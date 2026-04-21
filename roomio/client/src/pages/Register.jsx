import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/axios'
import { HALLS, CS_LEVELS } from '../lib/halls'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirmPassword: '',
    hall: '', room_number: '', level: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password needs at least 6 characters.')
    setLoading(true)

    try {
      // Use the server-side register route which uses the service_role key.
      // This bypasses RLS and creates both the auth user AND the profile
      // atomically — if the profile insert fails it rolls back the auth user too.
      const { data } = await api.post('/api/auth/register', {
        email:       form.email,
        password:    form.password,
        full_name:   form.full_name,
        hall:        form.hall,
        room_number: form.room_number,
        level:       form.level,
      })

      if (!data?.userId) throw new Error('Registration failed — no user ID returned')

      // Now sign in so the client gets a session
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      })
      if (signInErr) throw signInErr

      navigate('/feed')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 safe-top">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 font-head font-black text-dark-bg text-2xl"
            style={{ background: 'linear-gradient(135deg,#00c853,#CCA000)' }}>R</div>
          <h1 className="font-head font-black text-white text-2xl">Join Roomio CS</h1>
          <p className="text-dark-muted text-xs mt-1">UCC Computer Science · Connect & Grow</p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${step >= s ? 'bg-brand-green' : 'bg-dark-border'}`} />
          ))}
        </div>

        <div className="card p-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-head font-bold text-white text-lg">Personal Info</h2>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">Full Name</label>
                <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  placeholder="Kofi Agyemang"
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">Email</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="kofi@st.ucc.edu.gh"
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">Password</label>
                <input required type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">Confirm Password</label>
                <input required type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50" />
              </div>
              <button type="button"
                onClick={() => {
                  if (!form.full_name.trim()) return setError('Enter your full name.')
                  if (!form.email.trim()) return setError('Enter your email.')
                  if (!form.password) return setError('Enter a password.')
                  setError('')
                  setStep(2)
                }}
                className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm press hover:bg-brand-green-dim">
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-head font-bold text-white text-lg">Hall & Level</h2>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">Hall of Residence</label>
                <select required value={form.hall} onChange={e => set('hall', e.target.value)}
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50">
                  <option value="">Select your hall...</option>
                  {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">Room Number</label>
                <input required value={form.room_number} onChange={e => set('room_number', e.target.value)}
                  placeholder="e.g. 14B"
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1.5">Level</label>
                <select required value={form.level} onChange={e => set('level', e.target.value)}
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50">
                  <option value="">Select level...</option>
                  {CS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="px-5 py-3 border border-dark-border rounded-2xl text-sm font-bold text-dark-muted hover:bg-dark-card2 press">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-brand-green text-dark-bg rounded-2xl py-3 font-black text-sm hover:bg-brand-green-dim disabled:opacity-50 press">
                  {loading ? 'Creating account...' : 'Join Roomio 🚀'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-dark-muted">
            Already a member?{' '}
            <Link to="/login" className="text-brand-green font-bold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
