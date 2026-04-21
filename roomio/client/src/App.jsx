import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useEffect } from 'react'

import Login          from './pages/Login'
import Register       from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Feed           from './pages/Feed'
import Chat           from './pages/Chat'
import Marketplace    from './pages/Marketplace'
import HallPage       from './pages/HallPage'
import Profile        from './pages/Profile'
import NoticeBoard    from './pages/NoticeBoard'
import Slides         from './pages/Slides'
import Settings       from './pages/Settings'
import Friends        from './pages/Friends'

// Apply saved theme CSS variables on every page load
const THEME_VARS = {
  dark:      { '--bg':'#0f1117','--card':'#161b27','--card2':'#1a2235','--border':'#1e293b','--text':'#f1f5f9','--muted':'#94a3b8','--subtle':'#475569','--accent':'#00c853','--accent-dim':'#00a844' },
  midnight:  { '--bg':'#000000','--card':'#0a0a0a','--card2':'#111111','--border':'#1a1a1a','--text':'#f1f5f9','--muted':'#6b7280','--subtle':'#374151','--accent':'#6366f1','--accent-dim':'#4f46e5' },
  forest:    { '--bg':'#0a1a12','--card':'#0f2418','--card2':'#14301f','--border':'#1a3d28','--text':'#ecfdf5','--muted':'#6ee7b7','--subtle':'#34d399','--accent':'#22c55e','--accent-dim':'#16a34a' },
  ocean:     { '--bg':'#050d1a','--card':'#0c1a2e','--card2':'#0f2040','--border':'#162840','--text':'#eff6ff','--muted':'#93c5fd','--subtle':'#60a5fa','--accent':'#3b82f6','--accent-dim':'#2563eb' },
  sunset:    { '--bg':'#1a0f05','--card':'#2a1708','--card2':'#351f0a','--border':'#4a2d0f','--text':'#fffbeb','--muted':'#fcd34d','--subtle':'#fbbf24','--accent':'#f59e0b','--accent-dim':'#d97706' },
  purple:    { '--bg':'#0d0a1a','--card':'#160f2a','--card2':'#1e1535','--border':'#2d1d50','--text':'#faf5ff','--muted':'#c4b5fd','--subtle':'#a78bfa','--accent':'#a855f7','--accent-dim':'#9333ea' },
  light:     { '--bg':'#f0f4f0','--card':'#ffffff','--card2':'#f8faf8','--border':'#d4e8d4','--text':'#1c1e21','--muted':'#65676b','--subtle':'#94a3b8','--accent':'#006633','--accent-dim':'#008844' },
  solarized: { '--bg':'#002b36','--card':'#073642','--card2':'#0d4452','--border':'#114d5e','--text':'#fdf6e3','--muted':'#93a1a1','--subtle':'#657b83','--accent':'#2aa198','--accent-dim':'#1f8076' },
}

function ThemeLoader() {
  useEffect(() => {
    const saved = localStorage.getItem('roomio-theme') || 'dark'
    const vars = THEME_VARS[saved] || THEME_VARS.dark
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
  }, [])
  return null
}

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center font-head font-black text-dark-bg text-3xl animate-pulse"
          style={{ background: 'linear-gradient(135deg,#00c853,#CCA000)' }}>R</div>
        <div className="text-dark-muted text-sm font-semibold animate-pulse">Loading Roomio CS...</div>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <BrowserRouter>
      <ThemeLoader />
      <Routes>
        <Route path="/"                element={<Navigate to={user ? '/feed' : '/login'} replace />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/feed"            element={<Protected><Feed /></Protected>} />
        <Route path="/slides"          element={<Protected><Slides /></Protected>} />
        <Route path="/chat"            element={<Protected><Chat /></Protected>} />
        <Route path="/chat/:userId"    element={<Protected><Chat /></Protected>} />
        <Route path="/marketplace"     element={<Protected><Marketplace /></Protected>} />
        <Route path="/hall/:hallName"  element={<Protected><HallPage /></Protected>} />
        <Route path="/profile/:id"     element={<Protected><Profile /></Protected>} />
        <Route path="/notices"         element={<Protected><NoticeBoard /></Protected>} />
        <Route path="/friends"         element={<Protected><Friends /></Protected>} />
        <Route path="/settings"        element={<Protected><Settings /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
