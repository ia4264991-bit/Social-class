import { useEffect, useState, useCallback } from 'react'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import RightSidebar from '../components/layout/RightSidebar'
import CreatePost from '../components/feed/CreatePost'
import PostCard from '../components/feed/PostCard'
import api from '../lib/axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const FILTERS = [
  { key:'all',      label:'⚡ All' },
  { key:'code',     label:'</> Code' },
  { key:'video',    label:'🎬 Videos' },
  { key:'question', label:'❓ Questions' },
  { key:'my-hall',  label:'🏠 My Hall' },
]

export default function Feed() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter === 'my-hall' && profile?.hall) params.set('hall', profile.hall)
    else if (['code','video','question'].includes(filter)) params.set('post_type', filter)
    const { data } = await api.get(`/api/posts?${params}`)
    setPosts(data || [])
    setLoading(false)
  }, [filter, profile])

  useEffect(() => { loadPosts() }, [loadPosts])

  useEffect(() => {
    const ch = supabase.channel('feed').on('postgres_changes', { event:'INSERT', schema:'public', table:'posts' }, p => {
      setPosts(prev => [p.new, ...prev])
    }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto flex px-2 pt-4 pb-24 md:pb-6 gap-0">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4 max-w-xl mx-auto w-full">
          {/* Filter chips — horizontal scroll */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 border transition-all press
                  ${filter===f.key ? 'bg-brand-green text-dark-bg border-brand-green' : 'bg-dark-card text-dark-muted border-dark-border hover:border-dark-border2'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <CreatePost onPosted={p => setPosts(prev => [p, ...prev])} />

          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-dark-card2" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-dark-card2 rounded w-1/3" />
                      <div className="h-2 bg-dark-card2 rounded w-1/5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-dark-card2 rounded" />
                    <div className="h-3 bg-dark-card2 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <div className="font-head font-bold text-white text-lg">Nothing here yet</div>
              <div className="text-sm text-dark-muted mt-1">Be the first to post!</div>
            </div>
          )}

          {!loading && posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={async id => { await api.delete(`/api/posts/${id}`); setPosts(p => p.filter(x => x.id !== id)) }} />
          ))}
        </main>
        <RightSidebar />
      </div>
    </div>
  )
}
