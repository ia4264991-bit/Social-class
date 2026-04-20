import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { supabase } from '../../lib/supabase'
import api from '../../lib/axios'
import Avatar from '../shared/Avatar'
import { useAuth } from '../../context/AuthContext'
import InputBar from './InputBar'

function DayDivider({ date }) {
  const d = new Date(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-dark-border" />
      <span className="text-xs text-dark-subtle font-semibold px-2">{label}</span>
      <div className="flex-1 h-px bg-dark-border" />
    </div>
  )
}

export default function ChatWindow({ otherUser, conversationId, onConversationCreated }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef()
  const typingTimeout = useRef()

  const loadMessages = async () => {
    if (!conversationId) return
    const { data } = await api.get(`/api/messages/${conversationId}`)
    setMessages(data || [])
    await api.patch(`/api/messages/read/${conversationId}`, { user_id: user.id })
  }

  useEffect(() => {
    if (!conversationId) return
    loadMessages()

    const msgCh = supabase.channel(`msgs-${conversationId}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`conversation_id=eq.${conversationId}` },
        payload => setMessages(prev => [...prev, payload.new]))
      .subscribe()

    const presenceCh = supabase.channel(`typing-${conversationId}`)
    presenceCh.on('presence', { event:'sync' }, () => {
      const state = presenceCh.presenceState()
      const others = Object.values(state).flat().filter(p => p.user_id !== user.id)
      setIsTyping(others.some(p => p.typing))
    }).subscribe(async status => {
      if (status === 'SUBSCRIBED') await presenceCh.track({ user_id: user.id, typing: false })
    })
    window._typingCh = presenceCh

    return () => {
      supabase.removeChannel(msgCh)
      supabase.removeChannel(presenceCh)
    }
  }, [conversationId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const handleSend = async (content) => {
    const { data } = await api.post('/api/messages', {
      conversation_id: conversationId || null,
      sender_id: user.id,
      receiver_id: otherUser.id,
      content,
    })
    if (!conversationId && data.conversation_id) onConversationCreated?.(data.conversation_id)
    if (conversationId) setMessages(prev => [...prev, data])
  }

  const handleTyping = async (typing) => {
    if (!window._typingCh) return
    clearTimeout(typingTimeout.current)
    await window._typingCh.track({ user_id: user.id, typing })
    if (typing) typingTimeout.current = setTimeout(() => window._typingCh.track({ user_id: user.id, typing: false }), 2000)
  }

  if (!otherUser) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-dark-card text-center px-8">
      <div className="text-6xl mb-4">💬</div>
      <div className="font-head font-bold text-white text-xl mb-2">Roomio Messages</div>
      <div className="text-sm text-dark-muted">Select a conversation to start chatting with your classmates.</div>
    </div>
  )

  // Group by day
  const grouped = []
  let lastDay = null
  for (const msg of messages) {
    const day = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (day !== lastDay) { grouped.push({ type:'divider', date: msg.created_at }); lastDay = day }
    grouped.push({ type:'msg', msg })
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border bg-dark-card flex-shrink-0">
        <Avatar profile={otherUser} size={38} showOnline />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-white">{otherUser.full_name}</div>
          <div className="text-xs">
            {otherUser.is_online
              ? <span className="text-brand-green font-semibold">● Active now</span>
              : <span className="text-dark-muted">Offline</span>}
            <span className="text-dark-subtle ml-2">· {otherUser.hall} · {otherUser.level}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-xl bg-dark-card2 text-dark-muted hover:text-white flex items-center justify-center press">📞</button>
          <button className="w-9 h-9 rounded-xl bg-dark-card2 text-dark-muted hover:text-white flex items-center justify-center press">🎥</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3">
        {grouped.map((item, i) => {
          if (item.type === 'divider') return <DayDivider key={`d-${i}`} date={item.date} />
          const { msg } = item
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex gap-2 mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && <Avatar profile={otherUser} size={28} className="flex-shrink-0 mt-1" />}
              <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                  ${isMe
                    ? 'bg-brand-green text-dark-bg rounded-br-sm font-medium'
                    : 'bg-dark-card2 border border-dark-border text-dark-text rounded-bl-sm'}`}>
                  {msg.content}
                </div>
                <span className="text-xs text-dark-subtle mt-1 px-1">
                  {format(new Date(msg.created_at), 'h:mm a')}
                  {isMe && <span className="ml-1">{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
                </span>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex gap-2 mb-3">
            <Avatar profile={otherUser} size={28} />
            <div className="bg-dark-card2 border border-dark-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay:`${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <InputBar onSend={handleSend} onTyping={handleTyping} />
    </div>
  )
}
