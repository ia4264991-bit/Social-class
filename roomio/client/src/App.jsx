import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login       from './pages/Login'
import Register    from './pages/Register'
import Feed        from './pages/Feed'
import Chat        from './pages/Chat'
import Marketplace from './pages/Marketplace'
import HallPage    from './pages/HallPage'
import Profile     from './pages/Profile'
import NoticeBoard from './pages/NoticeBoard'
import Slides      from './pages/Slides'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center font-head font-black text-dark-bg text-3xl animate-pulse"
          style={{ background:'linear-gradient(135deg,#00c853,#CCA000)' }}>R</div>
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
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/feed' : '/login'} replace />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/feed"     element={<Protected><Feed /></Protected>} />
        <Route path="/slides"   element={<Protected><Slides /></Protected>} />
        <Route path="/chat"     element={<Protected><Chat /></Protected>} />
        <Route path="/chat/:userId" element={<Protected><Chat /></Protected>} />
        <Route path="/marketplace"  element={<Protected><Marketplace /></Protected>} />
        <Route path="/hall/:hallName" element={<Protected><HallPage /></Protected>} />
        <Route path="/profile/:id"  element={<Protected><Profile /></Protected>} />
        <Route path="/notices"  element={<Protected><NoticeBoard /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
