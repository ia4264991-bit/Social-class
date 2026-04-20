import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../shared/Avatar'
import { HALLS } from '../../lib/halls'

const NAV = [
  { to:'/feed',        icon:'⚡', label:'CS Feed'      },
  { to:'/slides',      icon:'📂', label:'Slide Storage' },
  { to:'/chat',        icon:'💬', label:'Messages'      },
  { to:'/marketplace', icon:'🛒', label:'CS Store'      },
  { to:'/notices',     icon:'📣', label:'Notice Board'  },
]

export default function LeftSidebar() {
  const { profile } = useAuth()
  const loc = useLocation()
  return (
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto scrollbar-hide py-3 px-2 gap-1">
      {profile && (
        <Link to={`/profile/${profile.id}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-card2 transition-colors mb-1 border border-transparent hover:border-dark-border">
          <Avatar profile={profile} size={42} showOnline />
          <div className="min-w-0">
            <div className="font-bold text-sm text-white truncate">{profile.full_name}</div>
            <div className="text-xs text-brand-green font-semibold truncate">{profile.hall?.split(' ')[0]}</div>
            <div className="text-xs text-dark-muted truncate">{profile.level}</div>
          </div>
        </Link>
      )}
      <div className="h-px bg-dark-border mx-2 mb-1" />
      {NAV.map(item => {
        const active = loc.pathname.startsWith(item.to)
        return (
          <Link key={item.to} to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors press
              ${active ? 'bg-brand-green/10 text-brand-green font-bold border border-brand-green/20' : 'text-dark-muted hover:bg-dark-card hover:text-white border border-transparent'}`}>
            <span className="text-base w-5 text-center">{item.icon}</span>{item.label}
          </Link>
        )
      })}
      <div className="h-px bg-dark-border mx-2 my-2" />
      <div className="text-xs font-bold text-dark-subtle uppercase tracking-wider px-3 py-1">Halls</div>
      {HALLS.map(hall => (
        <Link key={hall} to={`/hall/${encodeURIComponent(hall)}`}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors press
            ${profile?.hall === hall ? 'bg-dark-card2 text-brand-green border border-dark-border2' : 'text-dark-muted hover:bg-dark-card hover:text-white'}`}>
          <span className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-white text-xs flex-shrink-0" style={{ background: 'linear-gradient(135deg,#006633,#CCA000)' }}>{hall[0]}</span>
          <span className="truncate">{hall}</span>
        </Link>
      ))}
    </aside>
  )
}
