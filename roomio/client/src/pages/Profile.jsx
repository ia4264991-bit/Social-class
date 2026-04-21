import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import PostCard from '../components/feed/PostCard'
import ItemCard from '../components/marketplace/ItemCard'
import Avatar from '../components/shared/Avatar'
import api from '../lib/axios'
import { supabase } from '../lib/supabase'
import { hallGradientStyle } from '../lib/halls'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { id } = useParams()
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const isMe = user?.id === id
  const fileRef = useRef()

  const [profile, setProfile]         = useState(null)
  const [posts, setPosts]             = useState([])
  const [items, setItems]             = useState([])
  const [tab, setTab]                 = useState('posts')
  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState({})
  const [saving, setSaving]           = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [friendship, setFriendship]   = useState(null)  // null | { id, status, requester_id }
  const [friendLoading, setFriendLoading] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => {
      setProfile(data)
      setEditForm({ bio: data?.bio || '', room_number: data?.room_number || '' })
    })
    api.get(`/api/posts?author_id=${id}`).then(r => setPosts(r.data || [])).catch(() => {})
    api.get(`/api/marketplace?seller_id=${id}`).then(r => setItems(r.data || [])).catch(() => {})

    // Load friendship status
    if (user && user.id !== id) {
      api.get(`/api/friends/${user.id}`).then(r => {
        const all = r.data || []
        const f = all.find(fr => fr.requester_id === id || fr.receiver_id === id)
        setFriendship(f || null)
      }).catch(() => {})
    }
  }, [id, user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/api/profiles/${id}`, editForm)
      setProfile(p => ({ ...p, ...editForm }))
      refreshProfile()
      setEditing(false)
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('roomio').upload(path, file, { upsert: true })
    if (!error) {
      const { data: u } = supabase.storage.from('roomio').getPublicUrl(path)
      await api.put(`/api/profiles/${id}`, { avatar_url: u.publicUrl })
      setProfile(p => ({ ...p, avatar_url: u.publicUrl }))
      refreshProfile()
    } else {
      console.error('Avatar upload failed:', error.message)
    }
    setUploadingAvatar(false)
  }

  const sendFriendRequest = async () => {
    setFriendLoading(true)
    try {
      const { data } = await api.post('/api/friends/request', { requester_id: user.id, receiver_id: id })
      setFriendship(data)
    } catch(e) { console.error(e) }
    setFriendLoading(false)
  }

  const acceptFriend = async () => {
    if (!friendship) return
    setFriendLoading(true)
    const { data } = await api.patch(`/api/friends/${friendship.id}/accept`)
    setFriendship(data)
    setFriendLoading(false)
  }

  const removeFriend = async () => {
    if (!friendship) return
    setFriendLoading(true)
    await api.delete(`/api/friends/${friendship.id}`)
    setFriendship(null)
    setFriendLoading(false)
  }

  const friendStatus = !friendship ? 'none'
    : friendship.status === 'accepted' ? 'friends'
    : friendship.requester_id === user?.id ? 'sent'
    : 'received'

  if (!profile) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-brand-green font-bold animate-pulse text-lg">Loading profile...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto flex px-2 pt-4 pb-24 md:pb-6 gap-0">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4 max-w-2xl mx-auto w-full">
          <div className="card overflow-hidden mb-4">
            {/* Banner */}
            <div className="h-24 sm:h-32 relative" style={{ background: hallGradientStyle(profile.hall) }}>
              <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="px-4 sm:px-6 pb-5">
              <div className="flex items-end gap-3 sm:gap-4 -mt-10 mb-4 flex-wrap">
                {/* Avatar */}
                <div className="relative group">
                  <div className="ring-4 ring-dark-card rounded-full">
                    <Avatar profile={profile} size={72} showOnline={!isMe} />
                  </div>
                  {isMe && (
                    <>
                      <button onClick={() => fileRef.current.click()}
                        className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity press">
                        <span className="text-white text-xs font-black">{uploadingAvatar ? '…' : '📷'}</span>
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </>
                  )}
                </div>

                <div className="flex-1 pb-1 min-w-0">
                  <h1 className="font-head font-black text-xl text-white truncate">{profile.full_name}</h1>
                  <div className="text-sm text-brand-green font-semibold">{profile.hall} · Room {profile.room_number}</div>
                  <div className="text-xs text-dark-muted">Computer Science · {profile.level}</div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {isMe ? (
                    <>
                      <button onClick={() => setEditing(e => !e)}
                        className="px-4 py-2 border border-dark-border rounded-xl text-sm font-bold text-dark-muted hover:bg-dark-card2 press">
                        ✏️ Edit
                      </button>
                      <Link to="/settings"
                        className="px-4 py-2 border border-dark-border rounded-xl text-sm font-bold text-dark-muted hover:bg-dark-card2 press">
                        ⚙️
                      </Link>
                    </>
                  ) : (
                    <>
                      <button onClick={() => navigate(`/chat/${profile.id}`)}
                        className="px-4 py-2 bg-brand-green text-dark-bg rounded-xl text-sm font-black press hover:bg-brand-green-dim">
                        💬 Chat
                      </button>
                      {friendStatus === 'none' && (
                        <button onClick={sendFriendRequest} disabled={friendLoading}
                          className="px-4 py-2 bg-dark-card2 border border-dark-border text-white rounded-xl text-sm font-bold press hover:border-brand-green/40 disabled:opacity-50">
                          + Friend
                        </button>
                      )}
                      {friendStatus === 'sent' && (
                        <button onClick={removeFriend} disabled={friendLoading}
                          className="px-4 py-2 bg-dark-card2 border border-brand-green/30 text-brand-green rounded-xl text-sm font-bold press">
                          Sent ✓
                        </button>
                      )}
                      {friendStatus === 'received' && (
                        <button onClick={acceptFriend} disabled={friendLoading}
                          className="px-4 py-2 bg-brand-green text-dark-bg rounded-xl text-sm font-black press hover:bg-brand-green-dim">
                          Accept
                        </button>
                      )}
                      {friendStatus === 'friends' && (
                        <button onClick={removeFriend} disabled={friendLoading}
                          className="px-4 py-2 bg-dark-card2 border border-dark-border text-dark-muted rounded-xl text-sm font-bold press hover:text-red-400">
                          ✓ Friends
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {profile.bio && !editing && (
                <p className="text-sm text-dark-text mb-3 leading-relaxed">{profile.bio}</p>
              )}

              {editing && (
                <div className="space-y-3 mt-1 p-4 bg-dark-card2 rounded-2xl border border-dark-border mb-3">
                  <div>
                    <label className="block text-xs font-bold text-dark-muted mb-1.5">Bio</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      rows={2} placeholder="Tell your classmates about yourself..."
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-green/50 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-dark-muted mb-1.5">Room Number</label>
                    <input value={editForm.room_number} onChange={e => setEditForm(f => ({ ...f, room_number: e.target.value }))}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-green/50" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="px-4 py-2 border border-dark-border rounded-xl text-sm text-dark-muted press">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-brand-green text-dark-bg rounded-xl text-sm font-black disabled:opacity-50 press">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-sm flex-wrap">
                <span className="text-dark-muted">📬 <strong className="text-white">{posts.length}</strong> posts</span>
                <span className="text-dark-muted">🛒 <strong className="text-white">{items.length}</strong> listings</span>
                <Link to={`/hall/${encodeURIComponent(profile.hall)}`} className="text-brand-green font-semibold hover:underline">🏠 {profile.hall}</Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-dark-card border border-dark-border p-1 rounded-2xl mb-4">
            {[{ key:'posts', label:'⚡ Posts' }, { key:'store', label:'🛒 Store' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all press
                  ${tab === t.key ? 'bg-brand-green text-dark-bg' : 'text-dark-muted hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'posts' && (
            posts.length === 0
              ? <div className="card p-10 text-center"><div className="text-3xl mb-2">📭</div><div className="text-dark-muted text-sm">No posts yet</div></div>
              : posts.map(post => <PostCard key={post.id} post={post} onDelete={async postId => { await api.delete(`/api/posts/${postId}`); setPosts(p => p.filter(x => x.id !== postId)) }} />)
          )}
          {tab === 'store' && (
            items.length === 0
              ? <div className="card p-10 text-center"><div className="text-3xl mb-2">🛒</div><div className="text-dark-muted text-sm">No listings yet</div></div>
              : <div className="grid grid-cols-2 gap-3">{items.map(item => <ItemCard key={item.id} item={item} onMessage={() => navigate(`/chat/${item.seller?.id}`)} />)}</div>
          )}
        </main>
      </div>
    </div>
  )
}
