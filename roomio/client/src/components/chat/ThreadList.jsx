import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import Avatar from '../shared/Avatar'
import { useAuth } from '../../context/AuthContext'

export default function ThreadList() {
  const { user } = useAuth()
  const { userId: activeId } = useParams()
  const [convos, setConvos] = useState([])

  const load = async () => {
    const { data } = await api.get(`/api/messages/conversations/${user.id}`)
    setConvos(data || [])
  }

  useEffect(() => {
    if (!user) return
    load()
    const ch = supabase.channel('convos').on('postgres_changes', { event:'*', schema:'public', table:'conversations' }, load).subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const getOther = (c) => c.participant_one === user.id ? c.participant_two_profile : c.participant_one_profile

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-dark-border flex-shrink-0">
        <h2 className="font-head font-black text-white text-xl">Messages</h2>
        <div className="mt-2 bg-dark-card2 border border-dark-border rounded-xl flex items-center px-3 py-2 gap-2">
          <span className="text-dark-muted text-sm">🔍</span>
          <input placeholder="Search..." className="bg-transparent text-sm text-white outline-none flex-1 placeholder-dark-subtle" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {convos.length === 0 && (
          <div className="p-8 text-center text-dark-muted text-sm">No conversations yet.<br/>Message a classmate!</div>
        )}
        {convos.map(conv => {
          const other = getOther(conv)
          if (!other) return null
          const isActive = activeId === other.id
          return (
            <Link key={conv.id} to={`/chat/${other.id}`}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-dark-border/50 transition-colors press
                ${isActive ? 'bg-brand-green/10 border-l-2 border-l-brand-green' : 'hover:bg-dark-card2'}`}>
              <Avatar profile={other} size={44} showOnline />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">{other.full_name}</div>
                <div className="text-xs text-dark-muted truncate mt-0.5">{conv.last_message || 'Start chatting'}</div>
                <div className="text-xs text-brand-green/70 font-semibold mt-0.5 truncate">{other.hall?.split(' ')[0]} · {other.level}</div>
              </div>
              {conv.last_message_at && (
                <div className="text-xs text-dark-subtle flex-shrink-0">{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix:false })}</div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
