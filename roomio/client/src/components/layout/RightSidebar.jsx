import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import api from '../../lib/axios'
import Avatar from '../shared/Avatar'
import { useAuth } from '../../context/AuthContext'

export default function RightSidebar() {
  const { profile } = useAuth()
  const [online, setOnline] = useState([])
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!profile?.hall) return
    supabase.from('profiles').select('id,full_name,avatar_url,hall,room_number,level,is_online')
      .eq('hall', profile.hall).eq('is_online', true).neq('id', profile.id).limit(6)
      .then(({ data }) => setOnline(data || []))
    api.get('/api/marketplace?limit=3').then(({ data }) => setItems(data || []))
  }, [profile])

  return (
    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto scrollbar-hide py-3 px-2 gap-3">
      <div className="card p-4">
        <div className="text-xs font-black text-brand-green uppercase tracking-wider mb-3">🟢 Online Now</div>
        {online.length === 0 && <p className="text-xs text-dark-subtle">No one online from your hall</p>}
        {online.map(u => (
          <Link key={u.id} to={`/profile/${u.id}`} className="flex items-center gap-2.5 py-2 hover:bg-dark-card2 rounded-xl px-2 transition-colors press">
            <Avatar profile={u} size={32} showOnline />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{u.full_name}</div>
              <div className="text-xs text-dark-muted">{u.level}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-black text-brand-green uppercase tracking-wider">🛒 CS Store</div>
          <Link to="/marketplace" className="text-xs text-brand-blue font-bold">See all</Link>
        </div>
        {items.map(item => (
          <div key={item.id} className="flex gap-2.5 py-2 border-b border-dark-border last:border-0">
            <div className="w-10 h-10 rounded-xl bg-dark-card2 flex items-center justify-center text-xl flex-shrink-0">
              {item.category==='textbooks'?'📖':item.category==='electronics'?'💻':item.category==='furniture'?'🪑':'🛍️'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{item.title}</div>
              <div className="text-sm font-black text-brand-green">GH₵ {item.price}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="text-xs font-black text-brand-green uppercase tracking-wider mb-3">🎓 CS Resources</div>
        {[
          { label:'UCC CS Dept', url:'https://ucc.edu.gh' },
          { label:'Student Portal', url:'https://student.ucc.edu.gh' },
          { label:'UCC Library', url:'https://library.ucc.edu.gh' },
          { label:'GitHub Student', url:'https://education.github.com' },
        ].map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 py-2 text-xs text-dark-muted hover:text-brand-blue transition-colors">
            🔗 {l.label}
          </a>
        ))}
      </div>
    </aside>
  )
}
