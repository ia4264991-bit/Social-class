import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../shared/Avatar'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'

const TYPES = [
  { type:'general',   icon:'💬', label:'Post'    },
  { type:'code',      icon:'</>', label:'Code'    },
  { type:'video',     icon:'🎬', label:'Video'   },
  { type:'notice',    icon:'📋', label:'Notice'  },
  { type:'question',  icon:'❓', label:'Ask'     },
]

const CODE_LANGS = ['JavaScript','Python','Java','C++','C','TypeScript','SQL','HTML/CSS','Bash','Other']

export default function CreatePost({ onPosted }) {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('general')
  const [lang, setLang] = useState('Python')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'image' | 'video'
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleMedia = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType(file.type.startsWith('video') ? 'video' : 'image')
    if (file.type.startsWith('video')) setPostType('video')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !mediaFile) return
    setLoading(true)
    let image_url = null, video_url = null
    if (mediaFile) {
      const ext = mediaFile.name.split('.').pop()
      const folder = mediaType === 'video' ? 'videos' : 'posts'
      const path = `${folder}/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('roomio').upload(path, mediaFile)
      if (!upErr) {
        const { data: u } = supabase.storage.from('roomio').getPublicUrl(path)
        if (mediaType === 'video') video_url = u.publicUrl
        else image_url = u.publicUrl
      }
    }
    try {
      const body = postType === 'code'
        ? { author_id:user.id, content:`\`\`\`${lang}\n${content}\n\`\`\``, image_url, video_url, post_type:'code', hall_tag:profile?.hall }
        : { author_id:user.id, content:content.trim(), image_url, video_url, post_type:postType, hall_tag:profile?.hall }
      const { data } = await api.post('/api/posts', body)
      onPosted && onPosted(data)
      setContent(''); setMediaFile(null); setMediaPreview(null); setMediaType(null)
      setOpen(false); setPostType('general')
    } finally { setLoading(false) }
  }

  if (!open) return (
    <div className="card p-3 mb-3 flex items-center gap-3 press cursor-pointer" onClick={() => setOpen(true)}>
      <Avatar profile={profile} size={38} />
      <div className="flex-1 bg-dark-card2 border border-dark-border rounded-2xl px-4 py-2.5 text-sm text-dark-subtle">
        Share code, ideas, questions...
      </div>
      <button className="w-9 h-9 rounded-xl bg-dark-card2 border border-dark-border flex items-center justify-center text-base">🎬</button>
    </div>
  )

  return (
    <div className="card p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <Avatar profile={profile} size={38} />
        <div>
          <div className="text-sm font-bold text-white">{profile?.full_name}</div>
          <div className="text-xs text-brand-green font-semibold">{profile?.hall} · {profile?.level}</div>
        </div>
      </div>

      {/* Type selector */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
        {TYPES.map(t => (
          <button key={t.type} type="button" onClick={() => setPostType(t.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all press flex-shrink-0
              ${postType===t.type ? 'bg-brand-green/15 text-brand-green border-brand-green/30' : 'border-dark-border text-dark-muted hover:border-dark-border2'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {postType === 'code' && (
        <select value={lang} onChange={e => setLang(e.target.value)}
          className="w-full bg-dark-card2 border border-dark-border rounded-xl px-3 py-2 text-sm text-white outline-none mb-2">
          {CODE_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      )}

      <textarea value={content} onChange={e => setContent(e.target.value)} autoFocus rows={postType==='code'?5:3}
        placeholder={
          postType==='code'    ? `// Paste your ${lang} code here...` :
          postType==='question'? 'Ask your CS question...' :
          postType==='video'   ? 'Describe this video...' :
          postType==='notice'  ? 'Write a notice...' :
          'Share an idea, a discovery, anything...'
        }
        className={`w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-green/50 resize-none transition-colors
          ${postType==='code' ? 'font-mono text-green-400' : ''}`} />

      {mediaPreview && (
        <div className="relative mt-2 rounded-xl overflow-hidden">
          {mediaType === 'video'
            ? <video src={mediaPreview} controls className="w-full max-h-48 rounded-xl object-cover" />
            : <img src={mediaPreview} alt="" className="w-full max-h-48 object-cover rounded-xl" />
          }
          <button onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null) }}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 text-sm flex items-center justify-center press">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border">
        <div className="flex gap-2">
          <button type="button" onClick={() => fileRef.current.click()}
            className="flex items-center gap-1.5 text-sm text-dark-muted hover:text-brand-green px-3 py-1.5 rounded-xl hover:bg-dark-card2 transition-colors press">
            {postType==='video' ? '🎬 Video' : '📷 Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMedia} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-dark-muted rounded-xl hover:bg-dark-card2 press">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || (!content.trim() && !mediaFile)}
            className="px-5 py-2 bg-brand-green text-dark-bg rounded-xl text-sm font-black hover:bg-brand-green-dim transition-colors disabled:opacity-40 press">
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
