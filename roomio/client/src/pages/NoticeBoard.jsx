import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { HALLS } from '../lib/halls'
import { formatDistanceToNow } from 'date-fns'

export default function NoticeBoard() {
  const { user, profile } = useAuth()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', content:'', hall:'', priority:'normal' })
  const [posting, setPosting] = useState(false)

  const load = async () => {
    setLoading(true)
    const hall = profile?.hall ? `?hall=${encodeURIComponent(profile.hall)}` : ''
    const { data } = await api.get(`/api/notices${hall}`)
    setNotices(data || [])
    setLoading(false)
  }

  useEffect(() => { if (profile) load() }, [profile])

  const handlePost = async (e) => {
    e.preventDefault(); setPosting(true)
    await api.post('/api/notices', { ...form, author_id:user.id })
    setForm({ title:'', content:'', hall:'', priority:'normal' }); setShowForm(false); load(); setPosting(false)
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto flex px-2 pt-4 pb-24 md:pb-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-head font-black text-white text-xl sm:text-2xl">📣 Notice Board</h1>
              <p className="text-xs text-dark-muted mt-0.5">Hall & CS department announcements</p>
            </div>
            <button onClick={() => setShowForm(s => !s)}
              className="bg-brand-green text-dark-bg px-4 py-2.5 rounded-2xl font-black text-sm press hover:bg-brand-green-dim">
              + Post
            </button>
          </div>

          {showForm && (
            <form onSubmit={handlePost} className="card p-5 mb-4">
              <h2 className="font-head font-bold text-white text-lg mb-4">Post a Notice</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
                    placeholder="e.g. Lecture cancelled — Thursday"
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Content *</label>
                  <textarea required value={form.content} onChange={e => setForm(f => ({ ...f, content:e.target.value }))}
                    rows={3} placeholder="Details..."
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-dark-muted mb-1.5">Hall</label>
                    <select value={form.hall} onChange={e => setForm(f => ({ ...f, hall:e.target.value }))}
                      className="w-full bg-dark-card2 border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
                      <option value="">All Campus</option>
                      {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-muted mb-1.5">Priority</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority:e.target.value }))}
                      className="w-full bg-dark-card2 border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
                      <option value="normal">Normal</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 border border-dark-border rounded-xl text-sm font-semibold text-dark-muted hover:bg-dark-card2 press">Cancel</button>
                  <button type="submit" disabled={posting}
                    className="flex-1 py-2.5 bg-brand-green text-dark-bg rounded-xl text-sm font-black disabled:opacity-40 press">
                    {posting ? 'Posting...' : 'Post Notice'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {loading && <div className="text-center py-12 text-brand-green font-bold animate-pulse">Loading notices...</div>}

          {!loading && notices.length === 0 && (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">📣</div>
              <div className="font-head font-bold text-white text-lg">No notices yet</div>
            </div>
          )}

          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className={`card overflow-hidden ${n.priority==='urgent' ? 'border-red-700/50' : ''}`}>
                {n.priority === 'urgent' && <div className="bg-red-900/60 text-red-300 text-xs font-black px-4 py-2 border-b border-red-700/30">🔴 URGENT NOTICE</div>}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-base flex-shrink-0
                      ${n.priority==='urgent' ? 'bg-red-700' : 'bg-brand-green/20 border border-brand-green/30'}`}>
                      {n.priority==='urgent' ? '🔴' : '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-sm">{n.title}</h3>
                        {n.hall
                          ? <span className="text-xs bg-brand-green/10 text-brand-green border border-brand-green/20 font-bold px-2 py-0.5 rounded-full">{n.hall}</span>
                          : <span className="text-xs bg-dark-card2 text-dark-muted border border-dark-border font-bold px-2 py-0.5 rounded-full">🌍 All Campus</span>}
                      </div>
                      <p className="text-sm text-dark-text mt-2 leading-relaxed">{n.content}</p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-border/50 text-xs text-dark-subtle">
                        <span>By <span className="text-dark-muted font-semibold">{n.author?.full_name}</span></span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix:true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
