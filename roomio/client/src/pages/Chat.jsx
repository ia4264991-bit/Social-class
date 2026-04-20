import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import ThreadList from '../components/chat/ThreadList'
import ChatWindow from '../components/chat/ChatWindow'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { userId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [otherUser, setOtherUser] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const showChat = !!userId

  useEffect(() => {
    if (!userId || !user) return
    supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => setOtherUser(data))
    const p1 = user.id < userId ? user.id : userId
    const p2 = user.id < userId ? userId : user.id
    supabase.from('conversations').select('id').eq('participant_one', p1).eq('participant_two', p2).single()
      .then(({ data }) => { if (data) setConversationId(data.id) })
  }, [userId, user])

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-6xl mx-auto w-full md:px-2 md:py-4 md:gap-3 overflow-hidden" style={{ height:'calc(100vh - 56px)' }}>

        {/* Thread list */}
        <div className={`bg-dark-card border-r border-dark-border md:border md:rounded-2xl overflow-hidden flex-col flex-shrink-0
          ${showChat ? 'hidden md:flex' : 'flex w-full'}
          md:w-72`} style={{ height:'100%' }}>
          <ThreadList />
        </div>

        {/* Chat window */}
        <div className={`bg-dark-card md:border border-dark-border md:rounded-2xl overflow-hidden flex-col flex-1 min-w-0
          ${showChat ? 'flex' : 'hidden md:flex'}`} style={{ height:'100%' }}>
          {showChat && (
            <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-dark-border flex-shrink-0">
              <button onClick={() => navigate('/chat')} className="text-brand-green font-bold text-sm press">← Back</button>
              {otherUser && <span className="text-white font-semibold text-sm">{otherUser.full_name}</span>}
            </div>
          )}
          <ChatWindow otherUser={otherUser} conversationId={conversationId} onConversationCreated={id => setConversationId(id)} />
        </div>

        {/* Profile panel — xl only */}
        {otherUser && (
          <div className="hidden xl:flex flex-col w-52 bg-dark-card border border-dark-border rounded-2xl p-4 flex-shrink-0 overflow-y-auto" style={{ height:'100%' }}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-black text-2xl mb-2"
                style={{ background:'linear-gradient(135deg,#006633,#CCA000)' }}>
                {otherUser.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
              </div>
              <div className="font-bold text-sm text-white">{otherUser.full_name}</div>
              <div className="text-xs text-brand-green font-semibold mt-0.5">{otherUser.hall}</div>
              <div className="text-xs text-dark-muted">{otherUser.level}</div>
            </div>
            <div className="h-px bg-dark-border mb-3" />
            {[{icon:'👤',label:'View Profile'},{icon:'🏘️',label:'Their Hall'},{icon:'🔔',label:'Mute'}].map(a => (
              <button key={a.label} className="flex items-center gap-2 w-full text-left px-2 py-2.5 rounded-xl text-sm text-dark-muted hover:bg-dark-card2 hover:text-white transition-colors press">
                {a.icon} {a.label}
              </button>
            ))}
            {otherUser.hall === user?.hall && (
              <div className="mt-3 bg-brand-green/10 border border-brand-green/20 rounded-xl p-3">
                <div className="text-xs font-bold text-brand-green">🏠 Same Hall</div>
                <div className="text-xs text-dark-muted mt-0.5">{otherUser.hall}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
