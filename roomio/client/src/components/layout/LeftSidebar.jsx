import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../shared/Avatar'
import { HALLS } from '../../lib/halls'

const NAV = [
  { to: '/feed',        icon: '⚡', label: 'CS Feed'       },
  { to: '/slides',      icon: '📂', label: 'Slide Storage' },
  { to: '/chat',        icon: '💬', label: 'Messages'      },
  { to: '/marketplace', icon: '🛒', label: 'CS Store'      },
  { to: '/notices',     icon: '📣', label: 'Notice Board'  },
  { to: '/friends',     icon: '👥', label: 'Classmates'    },
  { to: '/settings',    icon: '⚙️', label: 'Settings'      },
]

export default function LeftSidebar() {
  const { profile } = useAuth()
  const loc = useLocation()

  return (
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 py-3 px-2 gap-1"
      style={{ position:'sticky', top:56, height:'calc(100vh - 56px)', overflowY:'auto' }}>
      {profile && (
        <Link to={`/profile/${profile.id}`}
          style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderRadius:14, textDecoration:'none', marginBottom:4, border:'1px solid transparent', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
          <Avatar profile={profile} size={42} showOnline />
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile.full_name}</div>
            <div style={{ fontSize:11, color:'var(--accent)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.hall?.split(' ')[0]}</div>
            <div style={{ fontSize:11, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.level}</div>
          </div>
        </Link>
      )}

      <div style={{ height:1, backgroundColor:'var(--border)', margin:'4px 8px' }} />

      {NAV.map(item => {
        const active = loc.pathname.startsWith(item.to)
        return (
          <Link key={item.to} to={item.to}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, fontSize:13, fontWeight: active ? 700 : 500, textDecoration:'none', transition:'all 0.15s', color: active ? 'var(--accent)' : 'var(--muted)', backgroundColor: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent', border: active ? '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' : '1px solid transparent', marginBottom:1 }}
            className="press"
            onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.color = 'var(--text)' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted)' } }}>
            <span style={{ fontSize:16, width:20, textAlign:'center' }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}

      <div style={{ height:1, backgroundColor:'var(--border)', margin:'8px' }} />
      <div style={{ fontSize:11, fontWeight:700, color:'var(--subtle)', textTransform:'uppercase', letterSpacing:1, padding:'2px 12px 6px' }}>Halls</div>

      {HALLS.map(hall => {
        const active = profile?.hall === hall
        return (
          <Link key={hall} to={`/hall/${encodeURIComponent(hall)}`}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10, fontSize:12, fontWeight: active ? 700 : 500, textDecoration:'none', color: active ? 'var(--accent)' : 'var(--muted)', backgroundColor: active ? 'var(--card2)' : 'transparent', transition:'all 0.15s' }}
            className="press"
            onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--card)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}>
            <span style={{ width:22, height:22, borderRadius:6, background:'linear-gradient(135deg,var(--accent),#CCA000)', color:'var(--accent-text)', fontSize:11, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{hall[0]}</span>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{hall}</span>
          </Link>
        )
      })}
    </aside>
  )
}
