import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../shared/Avatar'
import { useState } from 'react'

const BOTTOM_NAV = [
  { to: '/feed',        icon: '⚡', label: 'Feed'   },
  { to: '/slides',      icon: '📂', label: 'Slides' },
  { to: '/marketplace', icon: '🛒', label: 'Store'  },
  { to: '/chat',        icon: '💬', label: 'Chat'   },
  { to: '/friends',     icon: '👥', label: 'People' },
]

export default function Navbar() {
  const { profile, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)

  const handleLogout = async () => {
    setMenu(false)
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* TOP BAR */}
      <nav className="sticky top-0 z-50 bg-dark-bg/90 backdrop-blur-xl border-b border-dark-border flex items-center h-14 px-4 gap-3">
        <Link to="/feed" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-head font-black text-dark-bg text-base"
            style={{ background: 'linear-gradient(135deg,#00c853,#CCA000)' }}>R</div>
          <div className="hidden sm:block">
            <div className="font-head font-black text-white text-base leading-none tracking-tight">
              Roomio <span className="text-brand-green">CS</span>
            </div>
            <div className="text-[10px] text-dark-muted font-semibold tracking-widest">UCC · COMPUTER SCIENCE</div>
          </div>
        </Link>

        <div className="flex-1 flex items-center bg-dark-card border border-dark-border rounded-full px-3 py-2 gap-2 mx-2">
          <span className="text-dark-muted text-sm flex-shrink-0">🔍</span>
          <input type="text" placeholder="Search code, slides, posts..."
            className="bg-transparent outline-none text-sm text-dark-text placeholder-dark-subtle w-full min-w-0" />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {BOTTOM_NAV.map(l => {
            const active = location.pathname.startsWith(l.to)
            return (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all press
                  ${active ? 'bg-brand-green/10 text-brand-green' : 'text-dark-muted hover:bg-dark-card hover:text-white'}`}>
                <span>{l.icon}</span>
                <span className="hidden lg:block">{l.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Profile menu */}
        <div className="relative ml-auto flex-shrink-0">
          <button onClick={() => setMenu(m => !m)}
            className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-full pl-1 pr-3 py-1 press hover:bg-dark-card2 transition-colors">
            <Avatar profile={profile} size={28} />
            <span className="text-white text-sm font-semibold hidden sm:block">
              {profile?.full_name?.split(' ')[0] || 'Me'}
            </span>
          </button>

          {menu && (
            <div className="absolute right-0 top-12 bg-dark-card border border-dark-border rounded-2xl w-52 z-50 py-2 shadow-2xl">
              <Link to={`/profile/${profile?.id}`} onClick={() => setMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-dark-text hover:bg-dark-card2 transition-colors">
                👤 My Profile
              </Link>
              <Link to="/friends" onClick={() => setMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-dark-text hover:bg-dark-card2 transition-colors">
                👥 Classmates
              </Link>
              <Link to={`/hall/${encodeURIComponent(profile?.hall || '')}`} onClick={() => setMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-dark-text hover:bg-dark-card2 transition-colors">
                🏘️ My Hall
              </Link>
              <Link to="/notices" onClick={() => setMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-dark-text hover:bg-dark-card2 transition-colors">
                📣 Notice Board
              </Link>
              <Link to="/settings" onClick={() => setMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-dark-text hover:bg-dark-card2 transition-colors">
                ⚙️ Settings
              </Link>
              <hr className="border-dark-border my-1" />
              <button onClick={handleLogout}
                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-dark-card2 transition-colors">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-dark-card/95 backdrop-blur-xl border-t border-dark-border safe-bottom">
        <div className="flex">
          {BOTTOM_NAV.map(l => {
            const active = location.pathname.startsWith(l.to)
            return (
              <Link key={l.to} to={l.to}
                className={`flex-1 flex flex-col items-center justify-center pt-3 pb-1 gap-0.5 press transition-colors ${active ? 'text-brand-green' : 'text-dark-subtle'}`}>
                <span className="text-xl leading-none">{l.icon}</span>
                <span className="text-[10px] font-bold">{l.label}</span>
                {active && <div className="w-4 h-0.5 rounded-full bg-brand-green" />}
              </Link>
            )
          })}
          {/* Me tab */}
          <Link to={`/profile/${profile?.id}`}
            className={`flex-1 flex flex-col items-center justify-center pt-3 pb-1 gap-0.5 press ${location.pathname.startsWith('/profile') ? 'text-brand-green' : 'text-dark-subtle'}`}>
            <Avatar profile={profile} size={22} />
            <span className="text-[10px] font-bold">Me</span>
            {location.pathname.startsWith('/profile') && <div className="w-4 h-0.5 rounded-full bg-brand-green" />}
          </Link>
        </div>
      </nav>
    </>
  )
}
