import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function InputBar({ onSend, onTyping }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)  // { url, type, file }
  const fileRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const type = file.type.startsWith('video') ? 'video' : 'image'
    setPreview({ url: URL.createObjectURL(file), type, file })
  }

  const clearPreview = () => { setPreview(null); fileRef.current.value = '' }

  const handleSend = async () => {
    if (!text.trim() && !preview) return
    setUploading(true)

    let image_url = null, video_url = null

    if (preview?.file) {
      const ext = preview.file.name.split('.').pop()
      const folder = preview.type === 'video' ? 'chat-videos' : 'chat-images'
      const path = `${folder}/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('roomio').upload(path, preview.file)
      if (upErr) { console.error('Upload error:', upErr.message); setUploading(false); return }
      const { data: u } = supabase.storage.from('roomio').getPublicUrl(path)
      if (preview.type === 'video') video_url = u.publicUrl
      else image_url = u.publicUrl
    }

    onSend({ content: text.trim(), image_url, video_url })
    setText(''); clearPreview(); setUploading(false)
    onTyping?.(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="border-t border-dark-border bg-dark-card flex-shrink-0">
      {/* Media preview */}
      {preview && (
        <div className="px-3 pt-3 pb-1 flex items-start gap-2">
          <div className="relative rounded-xl overflow-hidden border border-dark-border">
            {preview.type === 'video'
              ? <video src={preview.url} className="h-28 max-w-xs rounded-xl object-cover" controls />
              : <img src={preview.url} alt="preview" className="h-28 max-w-xs rounded-xl object-cover" />}
            <button onClick={clearPreview}
              className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center press">✕</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3">
        <button onClick={() => fileRef.current.click()}
          className="w-9 h-9 rounded-xl bg-dark-card2 flex items-center justify-center text-base text-dark-muted hover:text-white press transition-colors flex-shrink-0">
          📷
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

        <input
          value={text}
          onChange={e => { setText(e.target.value); onTyping?.(true) }}
          onKeyDown={handleKey}
          placeholder="Message..."
          className="flex-1 bg-dark-card2 border border-dark-border rounded-full px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/40 transition-colors min-w-0"
        />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !preview) || uploading}
          className="w-10 h-10 rounded-full bg-brand-green text-dark-bg flex items-center justify-center text-lg font-black disabled:opacity-30 press hover:bg-brand-green-dim transition-colors flex-shrink-0">
          {uploading ? '…' : '→'}
        </button>
      </div>
    </div>
  )
}
