import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '../shared/Avatar'
import api from '../../lib/axios'
import { useAuth } from '../../context/AuthContext'

const TYPE_BADGE = {
  code:     { bg:'bg-green-900/40',  text:'text-green-400',  label:'</> Code'     },
  video:    { bg:'bg-purple-900/40', text:'text-purple-400', label:'🎬 Video'     },
  notice:   { bg:'bg-yellow-900/40', text:'text-yellow-400', label:'📋 Notice'    },
  question: { bg:'bg-blue-900/40',   text:'text-blue-400',   label:'❓ Question'  },
  general:  { bg:'',                 text:'',                label:''             },
}

function CodeBlock({ content }) {
  const [copied, setCopied] = useState(false)
  const match = content.match(/```(\w+)?\n([\s\S]*?)```/)
  const lang = match?.[1] || 'code'
  const code = match?.[2] || content
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="rounded-xl overflow-hidden border border-dark-border my-2">
      <div className="flex items-center justify-between bg-dark-card2 px-4 py-2">
        <span className="text-xs font-bold text-green-400 font-mono">{lang}</span>
        <button onClick={copy} className="text-xs text-dark-muted hover:text-white press px-2 py-1 rounded-lg hover:bg-dark-border">
          {copied ? '✅ Copied' : '📋 Copy'}
        </button>
      </div>
      <pre className="bg-[#0d1117] px-4 py-3 text-sm text-green-300 font-mono overflow-x-auto scrollbar-hide whitespace-pre-wrap break-all">{code}</pre>
    </div>
  )
}

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState(post.reactions || [])
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  const myReaction = reactions.find(r => r.user_id === user?.id)
  const likeCount = reactions.filter(r => r.type === 'like').length

  const handleReact = async () => {
    if (myReaction) {
      await api.delete(`/api/reactions/${myReaction.id}`)
      setReactions(reactions.filter(r => r.id !== myReaction.id))
    } else {
      const { data } = await api.post('/api/reactions', { post_id:post.id, user_id:user.id, type:'like' })
      setReactions([...reactions, data])
    }
  }

  const loadComments = async () => {
    if (!showComments) {
      setLoadingComments(true)
      const { data } = await api.get(`/api/comments/${post.id}`)
      setComments(data || [])
      setLoadingComments(false)
    }
    setShowComments(s => !s)
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    const { data } = await api.post('/api/comments', { post_id:post.id, author_id:user.id, content:commentText.trim() })
    setComments([...comments, data])
    setCommentText('')
  }

  const badge = TYPE_BADGE[post.post_type] || TYPE_BADGE.general
  const isCode = post.post_type === 'code' || post.content?.startsWith('```')

  return (
    <div className="card mb-3 overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-2">
        <Link to={`/profile/${post.author?.id}`} className="flex-shrink-0 press">
          <Avatar profile={post.author} size={40} showOnline />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profile/${post.author?.id}`} className="font-bold text-sm text-white hover:text-brand-green transition-colors">
              {post.author?.full_name}
            </Link>
            {badge.label && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
            )}
          </div>
          <div className="text-xs text-dark-muted mt-0.5">
            {post.author?.hall} · {post.author?.level} · {formatDistanceToNow(new Date(post.created_at), { addSuffix:true })}
          </div>
        </div>
        {post.author?.id === user?.id && (
          <button onClick={() => onDelete?.(post.id)} className="text-dark-subtle hover:text-red-400 press p-1 rounded-lg">🗑️</button>
        )}
      </div>

      <div className="px-4 pb-2">
        {isCode ? <CodeBlock content={post.content} /> : (
          <p className="text-sm text-dark-text leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {post.video_url && (
        <video src={post.video_url} controls className="w-full max-h-80 object-cover bg-black" />
      )}
      {post.image_url && !post.video_url && (
        <img src={post.image_url} alt="" className="w-full max-h-80 object-cover" />
      )}

      <div className="flex items-center justify-between px-4 py-1.5 border-t border-dark-border/50 text-xs text-dark-subtle">
        <span>{likeCount > 0 && `👍 ${likeCount}`}</span>
        <button onClick={loadComments} className="hover:text-white transition-colors">{(post.comments?.length || 0)} comments</button>
      </div>

      <div className="flex border-t border-dark-border/50">
        <button onClick={handleReact}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors press rounded-bl-2xl
            ${myReaction ? 'text-brand-green' : 'text-dark-muted hover:text-white hover:bg-dark-card2'}`}>
          👍 {myReaction ? 'Liked' : 'Like'}
        </button>
        <button onClick={loadComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-dark-muted hover:text-white hover:bg-dark-card2 transition-colors press">
          💬 Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-dark-muted hover:text-white hover:bg-dark-card2 transition-colors press rounded-br-2xl">
          ↗️ Share
        </button>
      </div>

      {showComments && (
        <div className="border-t border-dark-border/50 px-4 pt-3 pb-3 bg-dark-card2/50">
          {loadingComments && <p className="text-xs text-dark-muted mb-2">Loading...</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 mb-2.5">
              <Avatar profile={c.author} size={26} />
              <div className="bg-dark-card border border-dark-border rounded-2xl px-3 py-2 flex-1 min-w-0">
                <div className="text-xs font-bold text-white">{c.author?.full_name}</div>
                <div className="text-sm text-dark-text mt-0.5">{c.content}</div>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2 mt-2">
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-dark-card border border-dark-border rounded-full px-4 py-2 text-sm text-white outline-none focus:border-brand-green/50 min-w-0" />
            <button type="submit" className="bg-brand-green text-dark-bg rounded-full px-4 py-2 text-sm font-black press">→</button>
          </form>
        </div>
      )}
    </div>
  )
}
