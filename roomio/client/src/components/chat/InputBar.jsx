import { useState } from 'react'

export default function InputBar({ onSend, onTyping }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim()); setText('')
    onTyping && onTyping(false)
  }

  return (
    <div className="flex items-center gap-2 p-3 border-t border-dark-border bg-dark-card flex-shrink-0">
      <button className="w-9 h-9 rounded-xl bg-dark-card2 flex items-center justify-center text-base text-dark-muted hover:text-white hover:bg-dark-border press transition-colors">📎</button>
      <button className="w-9 h-9 rounded-xl bg-dark-card2 flex items-center justify-center text-base text-dark-muted hover:text-white hover:bg-dark-border press transition-colors">📷</button>
      <input value={text}
        onChange={e => { setText(e.target.value); onTyping?.(true) }}
        onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
        placeholder="Message..."
        className="flex-1 bg-dark-card2 border border-dark-border rounded-full px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/40 transition-colors" />
      <button onClick={handleSend} disabled={!text.trim()}
        className="w-10 h-10 rounded-full bg-brand-green text-dark-bg flex items-center justify-center text-lg font-black disabled:opacity-30 press hover:bg-brand-green-dim transition-colors">→</button>
    </div>
  )
}
