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

const s = {
  nav: { backgroundColor:'var(--bg)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:50, height:56, display:'flex', alignItems:'center', padding:'0 16px', gap:12 },
  logo: { display:'flex', alignItems:'center', gap:8, flexShrink:0, textDecoration:'none' },
  logoIcon: { width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito,sans-serif', fontWeight:900, fontSize:16, background:'linear-gradient(135deg,var(--accent),#CCA000)', color:'var(--accent-text)', flexShrink:0 },
  logoText: { fontFamily:'Nunito,sans-serif', fontWeight:900, color:'var(--text)', fontSize:16, lineHeight:1 },
  logoSub: { fontSize:10, color:'var(--muted)', fontWeight:700, letterSpacing:2, display:'block', marginTop:2 },
  search: { flex:1, display:'flex', alignItems:'center', backgroundColor:'var(--card)', border:'1px solid var(--border)', borderRadius:999, padding:'8px 14px', gap:8 },
  searchInput: { background:'transparent', border:'none', outline:'none', fontSize:14, color:'var(--text)', width:'100%' },
  navLink: (active) => ({ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:12, fontSize:13, fontWeight:600, color: active ? 'var(--accent)' : 'var(--muted)', backgroundColor: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', textDecoration:'none', transition:'all 0.15s', whiteSpace:'nowrap' }),
  menuBtn: { display:'flex', alignItems:'center', gap:8, backgroundColor:'var(--card)', border:'1px solid var(--border)', borderRadius:999, padding:'4px 12px 4px 4px', cursor:'pointer', marginLeft:'auto' },
  menuName: { color:'var(--text)', fontSize:14, fontWeight:600 },
  dropdown: { position:'absolute', right:0, top:48, backgroundColor:'var(--card)', border:'1px solid var(--border)', borderRadius:16, width:200, zIndex:100, padding:'6px 0', boxShadow:'0 16px 48px rgba(0,0,0,0.4)' },
  dropItem: { display:'flex', alignItems:'center', gap:12, padding:'10px 16px', fontSize:14, color:'var(--text)', textDecoration:'none', cursor:'pointer', transition:'background 0.1s', background:'transparent', border:'none', width:'100%', textAlign:'left' },
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, zIndex:50, backgroundColor:'var(--card)', borderTop:'1px solid var(--border)', display:'flex' },
  navItem: (active) => ({ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:10, paddingBottom:4, gap:2, color: active ? 'var(--accent)' : 'var(--subtle)', textDecoration:'none', fontSize:10, fontWeight:700 }),
  activeDot: { width:16, height:2, borderRadius:999, backgroundColor:'var(--accent)' },
}

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
      <nav style={s.nav}>
        <Link to="/feed" style={s.logo}>
          <div style={s.logoIcon}>R</div>
          <div style={{ display:'none' }} className="sm:block">
            <span style={s.logoText}>Roomio <span style={{ color:'var(--accent)' }}>CS</span></span>
            <span style={s.logoSub}>UCC · COMPUTER SCIENCE</span>
          </div>
        </Link>

        <div style={s.search}>
          <span style={{ color:'var(--subtle)', fontSize:14 }}>🔍</span>
          <input style={s.searchInput} placeholder="Search posts, slides, people..." />
        </div>

        <div style={{ display:'none' }} className="md:flex items-center gap-1">
          {BOTTOM_NAV.map(l => {
            const active = location.pathname.startsWith(l.to)
            return (
              <Link key={l.to} to={l.to} style={s.navLink(active)} className="press">
                <span style={{ fontSize:16 }}>{l.icon}</span>
                <span className="hidden lg:block">{l.label}</span>
              </Link>
            )
          })}
        </div>

        <div style={{ position:'relative', marginLeft:'auto', flexShrink:0 }}>
          <button style={s.menuBtn} onClick={() => setMenu(m => !m)} className="press">
            <Avatar profile={profile} size={28} />
            <span style={s.menuName} className="hidden sm:block">{profile?.full_name?.split(' ')[0] || 'Me'}</span>
          </button>

          {menu && (
            <div style={s.dropdown}>
              {[
                { to: `/profile/${profile?.id}`, label: '👤 My Profile' },
                { to: '/friends', label: '👥 Classmates' },
                { to: `/hall/${encodeURIComponent(profile?.hall || '')}`, label: '🏘️ My Hall' },
                { to: '/notices', label: '📣 Notices' },
                { to: '/settings', label: '⚙️ Settings' },
              ].map(item => (
                <Link key={item.to} to={item.to} style={s.dropItem} onClick={() => setMenu(false)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--card2)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {item.label}
                </Link>
              ))}
              <div style={{ height:1, backgroundColor:'var(--border)', margin:'4px 0' }} />
              <button style={{ ...s.dropItem, color:'#ef4444' }} onClick={handleLogout}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--card2)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div style={s.bottomNav} className="md:hidden" id="mobile-nav">
        <div style={{ paddingBottom:'env(safe-area-inset-bottom, 8px)', display:'flex', width:'100%' }}>
          {BOTTOM_NAV.map(l => {
            const active = location.pathname.startsWith(l.to)
            return (
              <Link key={l.to} to={l.to} style={s.navItem(active)} className="press">
                <span style={{ fontSize:20, lineHeight:1 }}>{l.icon}</span>
                <span>{l.label}</span>
                {active && <div style={s.activeDot} />}
              </Link>
            )
          })}
          <Link to={`/profile/${profile?.id}`} style={s.navItem(location.pathname.startsWith('/profile'))} className="press">
            <Avatar profile={profile} size={20} />
            <span>Me</span>
            {location.pathname.startsWith('/profile') && <div style={s.activeDot} />}
          </Link>
        </div>
      </div>
    </>
  )
}
