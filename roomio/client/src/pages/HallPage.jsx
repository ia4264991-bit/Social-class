import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import PostCard from '../components/feed/PostCard'
import CreatePost from '../components/feed/CreatePost'
import Avatar from '../components/shared/Avatar'
import api from '../lib/axios'
import { hallGradientStyle } from '../lib/halls'
import { useAuth } from '../context/AuthContext'

export default function HallPage() {
  const { hallName } = useParams()
  const hall = decodeURIComponent(hallName)
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [posts, setPosts] = useState([])
  const [notices, setNotices] = useState([])
  const [tab, setTab] = useState('feed')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/api/profiles/hall/${encodeURIComponent(hall)}`),
      api.get(`/api/posts?hall=${encodeURIComponent(hall)}`),
      api.get(`/api/notices?hall=${encodeURIComponent(hall)}`),
    ]).then(([m, p, n]) => {
      setMembers(m.data || []); setPosts(p.data || []); setNotices(n.data || [])
      setLoading(false)
    })
  }, [hall])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto flex px-2 pt-4 pb-24 md:pb-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4">
          {/* Banner */}
          <div className="rounded-2xl overflow-hidden mb-4 border border-dark-border">
            <div className="h-28 sm:h-36 flex items-center justify-center" style={{ background: hallGradientStyle(hall) }}>
              <div className="text-center text-white px-4">
                <div className="font-head font-black text-2xl sm:text-3xl drop-shadow-lg">{hall}</div>
                <div className="text-sm opacity-80 mt-1">University of Cape Coast · CS Community</div>
              </div>
            </div>
            <div className="bg-dark-card px-4 py-3 flex items-center gap-5">
              <span className="text-sm font-semibold text-dark-muted">👥 <span className="text-white">{members.length}</span> members</span>
              <span className="text-sm font-semibold text-dark-muted">🟢 <span className="text-brand-green">{members.filter(m => m.is_online).length}</span> online</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-dark-card border border-dark-border p-1 rounded-2xl mb-4">
            {[{ key:'feed', label:'⚡ Feed' }, { key:'notices', label:'📣 Notices' }, { key:'members', label:'👥 Members' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all press
                  ${tab===t.key ? 'bg-brand-green text-dark-bg' : 'text-dark-muted hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-12 text-brand-green animate-pulse font-bold">Loading...</div>}

          {!loading && tab === 'feed' && (
            <>
              <CreatePost onPosted={p => setPosts(prev => [p, ...prev])} />
              {posts.length === 0
                ? <div className="card p-10 text-center"><div className="text-4xl mb-2">📭</div><div className="text-dark-muted">No posts yet</div></div>
                : posts.map(p => <PostCard key={p.id} post={p} onDelete={async id => { await api.delete(`/api/posts/${id}`); setPosts(prev => prev.filter(x => x.id !== id)) }} />)}
            </>
          )}

          {!loading && tab === 'notices' && (
            <div className="space-y-3">
              {notices.length === 0 && <div className="card p-10 text-center"><div className="text-4xl mb-2">📣</div><div className="text-dark-muted">No notices yet</div></div>}
              {notices.map(n => (
                <div key={n.id} className="card p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center flex-shrink-0">📋</div>
                    <div>
                      <div className="font-bold text-white text-sm">{n.title}</div>
                      <p className="text-sm text-dark-text mt-1 leading-relaxed">{n.content}</p>
                      <div className="text-xs text-dark-subtle mt-2">{n.author?.full_name} · {new Date(n.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && tab === 'members' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map(m => (
                <Link key={m.id} to={`/profile/${m.id}`}
                  className="card p-4 flex flex-col items-center text-center hover:border-dark-border2 transition-colors press">
                  <Avatar profile={m} size={52} showOnline />
                  <div className="font-bold text-sm text-white mt-2 truncate w-full">{m.full_name}</div>
                  <div className="text-xs text-brand-green font-semibold">Room {m.room_number}</div>
                  <div className="text-xs text-dark-muted mt-0.5 truncate w-full">{m.level}</div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
