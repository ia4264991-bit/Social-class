import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import Avatar from '../components/shared/Avatar'
import api from '../lib/axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'

export default function Friends() {
  const { user } = useAuth()
  const [friendships, setFriendships] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('friends') // friends | requests | suggestions
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get(`/api/friends/${user.id}`)
    setFriendships(data || [])
    setLoading(false)
  }

  const loadSuggestions = async () => {
    // Suggest people from same hall
    const { data } = await supabase.from('profiles')
      .select('id, full_name, avatar_url, hall, level, is_online')
      .neq('id', user.id)
      .limit(20)
    setSuggestions(data || [])
  }

  useEffect(() => { if (user) { load(); loadSuggestions() } }, [user])

  const search = async (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase.from('profiles')
      .select('id, full_name, avatar_url, hall, level, is_online')
      .ilike('full_name', `%${q}%`)
      .neq('id', user.id)
      .limit(10)
    setSearchResults(data || [])
    setSearching(false)
  }

  const sendRequest = async (receiverId) => {
    try {
      await api.post('/api/friends/request', { requester_id: user.id, receiver_id: receiverId })
      load()
    } catch (err) {
      console.error('Friend request error:', err.response?.data?.error)
    }
  }

  const accept = async (friendshipId) => {
    await api.patch(`/api/friends/${friendshipId}/accept`)
    load()
  }

  const remove = async (friendshipId) => {
    await api.delete(`/api/friends/${friendshipId}`)
    load()
  }

  const getStatus = (profileId) => {
    const f = friendships.find(fr =>
      fr.requester_id === profileId || fr.receiver_id === profileId
    )
    if (!f) return 'none'
    if (f.status === 'accepted') return 'friends'
    if (f.requester_id === user.id) return 'sent'
    return 'received'
  }

  const getFriendship = (profileId) =>
    friendships.find(fr => fr.requester_id === profileId || fr.receiver_id === profileId)

  const friends   = friendships.filter(f => f.status === 'accepted')
  const received  = friendships.filter(f => f.status === 'pending' && f.receiver_id === user.id)
  const sent      = friendships.filter(f => f.status === 'pending' && f.requester_id === user.id)

  const getOther = (f) => f.requester_id === user.id ? f.receiver : f.requester

  const displaySuggestions = (searchQuery ? searchResults : suggestions).filter(p => {
    const status = getStatus(p.id)
    return status === 'none'
  })

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto flex px-2 pt-4 pb-24 md:pb-6 gap-0">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-head font-black text-white text-xl sm:text-2xl">👥 Classmates</h1>
          </div>

          {/* Search */}
          <div className="card p-3 mb-4 flex items-center gap-3">
            <span className="text-dark-muted">🔍</span>
            <input value={searchQuery} onChange={e => search(e.target.value)}
              placeholder="Search for classmates by name..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-dark-subtle" />
            {searching && <span className="text-xs text-dark-muted animate-pulse">Searching...</span>}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-dark-card border border-dark-border p-1 rounded-2xl mb-4">
            {[
              { key:'friends',     label:`Friends (${friends.length})` },
              { key:'requests',    label:`Requests ${received.length > 0 ? `(${received.length})` : ''}` },
              { key:'suggestions', label:'Find People' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all press
                  ${tab === t.key ? 'bg-brand-green text-dark-bg' : 'text-dark-muted hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-12 text-brand-green animate-pulse font-bold">Loading...</div>}

          {/* ── FRIENDS ── */}
          {!loading && tab === 'friends' && (
            <div>
              {friends.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="text-5xl mb-3">👥</div>
                  <div className="font-head font-bold text-white text-lg">No friends yet</div>
                  <div className="text-sm text-dark-muted mt-1">Find classmates in the Find People tab</div>
                  <button onClick={() => setTab('suggestions')} className="mt-4 px-5 py-2.5 bg-brand-green text-dark-bg rounded-2xl font-black text-sm press">
                    Find People
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {friends.map(f => {
                    const other = getOther(f)
                    if (!other) return null
                    return (
                      <div key={f.id} className="card p-4 flex flex-col items-center text-center">
                        <Avatar profile={other} size={56} showOnline />
                        <div className="font-bold text-sm text-white mt-2 truncate w-full">{other.full_name}</div>
                        <div className="text-xs text-brand-green font-semibold">{other.hall?.split(' ')[0]}</div>
                        <div className="text-xs text-dark-muted">{other.level}</div>
                        <div className="flex gap-2 mt-3 w-full">
                          <Link to={`/chat/${other.id}`}
                            className="flex-1 py-2 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-xl text-xs font-bold text-center press hover:bg-brand-green/20">
                            💬 Chat
                          </Link>
                          <button onClick={() => remove(f.id)}
                            className="px-3 py-2 bg-dark-card2 border border-dark-border rounded-xl text-xs text-dark-muted hover:text-red-400 press">
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── REQUESTS ── */}
          {!loading && tab === 'requests' && (
            <div className="space-y-3">
              {received.length > 0 && (
                <div>
                  <div className="text-xs font-black text-dark-muted uppercase tracking-wider mb-2 px-1">
                    Incoming Requests ({received.length})
                  </div>
                  {received.map(f => {
                    const other = f.requester
                    return (
                      <div key={f.id} className="card p-4 flex items-center gap-3">
                        <Avatar profile={other} size={50} showOnline />
                        <div className="flex-1 min-w-0">
                          <Link to={`/profile/${other?.id}`} className="font-bold text-white text-sm hover:text-brand-green">{other?.full_name}</Link>
                          <div className="text-xs text-brand-green font-semibold">{other?.hall}</div>
                          <div className="text-xs text-dark-muted">{other?.level} · {formatDistanceToNow(new Date(f.created_at), { addSuffix:true })}</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => accept(f.id)}
                            className="px-4 py-2 bg-brand-green text-dark-bg rounded-xl text-xs font-black press hover:bg-brand-green-dim">
                            Accept
                          </button>
                          <button onClick={() => remove(f.id)}
                            className="px-3 py-2 bg-dark-card2 border border-dark-border rounded-xl text-xs text-dark-muted hover:text-red-400 press">
                            Decline
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {sent.length > 0 && (
                <div>
                  <div className="text-xs font-black text-dark-muted uppercase tracking-wider mb-2 px-1 mt-4">
                    Sent Requests ({sent.length})
                  </div>
                  {sent.map(f => {
                    const other = f.receiver
                    return (
                      <div key={f.id} className="card p-4 flex items-center gap-3">
                        <Avatar profile={other} size={44} />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm">{other?.full_name}</div>
                          <div className="text-xs text-dark-muted">Pending · {formatDistanceToNow(new Date(f.created_at), { addSuffix:true })}</div>
                        </div>
                        <button onClick={() => remove(f.id)}
                          className="px-3 py-2 bg-dark-card2 border border-dark-border rounded-xl text-xs text-dark-muted hover:text-red-400 press">
                          Cancel
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {received.length === 0 && sent.length === 0 && (
                <div className="card p-12 text-center">
                  <div className="text-5xl mb-3">📭</div>
                  <div className="font-head font-bold text-white">No pending requests</div>
                </div>
              )}
            </div>
          )}

          {/* ── FIND PEOPLE ── */}
          {!loading && tab === 'suggestions' && (
            <div>
              {displaySuggestions.length === 0 && !searchQuery && (
                <div className="card p-12 text-center">
                  <div className="text-5xl mb-3">🔍</div>
                  <div className="font-head font-bold text-white">Search for classmates</div>
                  <div className="text-sm text-dark-muted mt-1">Type a name above to find people</div>
                </div>
              )}
              {displaySuggestions.length === 0 && searchQuery && !searching && (
                <div className="card p-8 text-center">
                  <div className="text-4xl mb-2">😶</div>
                  <div className="text-dark-muted text-sm">No results for "{searchQuery}"</div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displaySuggestions.map(p => {
                  const status = getStatus(p.id)
                  const friendship = getFriendship(p.id)
                  return (
                    <div key={p.id} className="card p-4 flex flex-col items-center text-center">
                      <Avatar profile={p} size={52} showOnline />
                      <div className="font-bold text-sm text-white mt-2 truncate w-full">{p.full_name}</div>
                      <div className="text-xs text-brand-green font-semibold truncate w-full">{p.hall?.split(' ')[0]}</div>
                      <div className="text-xs text-dark-muted">{p.level}</div>
                      <div className="mt-3 w-full">
                        {status === 'none' && (
                          <button onClick={() => sendRequest(p.id)}
                            className="w-full py-2 bg-brand-green text-dark-bg rounded-xl text-xs font-black press hover:bg-brand-green-dim">
                            + Add Friend
                          </button>
                        )}
                        {status === 'sent' && (
                          <button onClick={() => friendship && remove(friendship.id)}
                            className="w-full py-2 bg-dark-card2 border border-dark-border text-dark-muted rounded-xl text-xs font-bold press">
                            Request Sent ✓
                          </button>
                        )}
                        {status === 'received' && (
                          <button onClick={() => friendship && accept(friendship.id)}
                            className="w-full py-2 bg-brand-green/20 text-brand-green border border-brand-green/30 rounded-xl text-xs font-bold press">
                            Accept Request
                          </button>
                        )}
                        {status === 'friends' && (
                          <Link to={`/chat/${p.id}`}
                            className="block w-full py-2 bg-dark-card2 border border-dark-border text-dark-muted rounded-xl text-xs font-bold text-center press hover:text-white">
                            💬 Message
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
