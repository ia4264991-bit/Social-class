import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

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

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:'100vh', backgroundColor:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
        <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,var(--accent),#CCA000)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito,sans-serif', fontWeight:900, fontSize:28, color:'var(--accent-text)' }}
          className="animate-pulse">R</div>
        <div style={{ color:'var(--muted)', fontSize:14, fontWeight:600 }} className="animate-pulse">Loading Roomio CS...</div>
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
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
