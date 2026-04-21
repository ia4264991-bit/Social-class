import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/feed')
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 safe-top">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 font-head font-black text-dark-bg text-3xl"
            style={{ background: 'linear-gradient(135deg,#00c853,#CCA000)' }}>R</div>
          <h1 className="font-head font-black text-white text-3xl tracking-tight">
            Roomio <span className="text-brand-green">CS</span>
          </h1>
          <p className="text-dark-muted text-sm mt-1">UCC Computer Science Community</p>
        </div>

        <div className="card p-6">
          <h2 className="font-head font-black text-white text-lg mb-5">Welcome back 👋</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-dark-muted mb-1.5">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@st.ucc.edu.gh"
                className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50 transition-colors" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-dark-muted">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-green hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 pr-11 text-sm text-white outline-none focus:border-brand-green/50 transition-colors" />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white text-sm press">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-green text-dark-bg rounded-2xl py-3.5 font-black text-sm hover:bg-brand-green-dim transition-colors disabled:opacity-50 press mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-dark-muted">
            New to Roomio?{' '}
            <Link to="/register" className="text-brand-green font-bold hover:underline">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
