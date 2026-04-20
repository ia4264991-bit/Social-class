import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import { supabase } from '../lib/supabase'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { CS_COURSES } from '../lib/halls'
import { formatDistanceToNow } from 'date-fns'

const FILE_ICON = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['ppt','pptx'].includes(ext)) return '📊'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['zip','rar'].includes(ext)) return '🗜️'
  if (['py','js','java','cpp','c'].includes(ext)) return '💻'
  return '📎'
}

export default function Slides() {
  const { user, profile } = useAuth()
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [form, setForm] = useState({ title:'', course:'', level:'', description:'' })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCourse) params.set('course', filterCourse)
    if (filterLevel)  params.set('level', filterLevel)
    if (search)       params.set('search', search)
    const { data } = await api.get(`/api/slides?${params}`)
    setSlides(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filterCourse, filterLevel, search])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file || !form.title.trim()) return
    setUploading(true)
    setUploadProgress(10)

    const ext = file.name.split('.').pop()
    const path = `slides/${user.id}/${Date.now()}-${file.name}`
    setUploadProgress(30)

    const { error: upErr } = await supabase.storage.from('roomio').upload(path, file)
    setUploadProgress(70)
    if (upErr) { setUploading(false); alert('Upload failed: ' + upErr.message); return }

    const { data: urlData } = supabase.storage.from('roomio').getPublicUrl(path)
    setUploadProgress(85)

    await api.post('/api/slides', {
      uploader_id: user.id,
      title: form.title,
      course: form.course,
      level: form.level,
      description: form.description,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: ext,
    })

    setUploadProgress(100)
    setTimeout(() => {
      setUploading(false); setUploadProgress(0)
      setShowForm(false); setFile(null)
      setForm({ title:'', course:'', level:'', description:'' })
      load()
    }, 600)
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
    return (bytes/(1024*1024)).toFixed(1) + ' MB'
  }

  const filtered = slides.filter(s => {
    if (search && !s.title?.toLowerCase().includes(search.toLowerCase()) &&
        !s.course?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto flex px-2 pt-4 pb-24 md:pb-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-head font-black text-white text-xl sm:text-2xl">📂 Slide Storage</h1>
              <p className="text-xs text-dark-muted mt-0.5">All CS lecture slides, notes & resources in one place</p>
            </div>
            <button onClick={() => setShowForm(s => !s)}
              className="bg-brand-green text-dark-bg px-4 py-2.5 rounded-2xl font-black text-sm hover:bg-brand-green-dim transition-colors press">
              + Upload
            </button>
          </div>

          {/* Upload form */}
          {showForm && (
            <form onSubmit={handleUpload} className="card p-5 mb-4">
              <h2 className="font-head font-bold text-white text-lg mb-4">Upload Resource</h2>

              {/* File drop zone */}
              <div
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center mb-4 cursor-pointer transition-colors press
                  ${file ? 'border-brand-green/50 bg-brand-green/5' : 'border-dark-border hover:border-dark-border2'}`}>
                <input ref={fileRef} type="file" className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.py,.js,.java,.cpp,.c,.zip,.txt"
                  onChange={e => setFile(e.target.files[0])} />
                {file ? (
                  <div>
                    <div className="text-4xl mb-2">{FILE_ICON(file.name)}</div>
                    <div className="text-sm font-bold text-white truncate">{file.name}</div>
                    <div className="text-xs text-dark-muted mt-1">{formatSize(file.size)}</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📤</div>
                    <div className="text-sm font-semibold text-dark-muted">Tap to choose a file</div>
                    <div className="text-xs text-dark-subtle mt-1">PDF, PPT, DOCX, code files, ZIP</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
                    placeholder="e.g. Data Structures Week 5 — Trees"
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Course</label>
                  <select value={form.course} onChange={e => setForm(f => ({ ...f, course:e.target.value }))}
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
                    <option value="">Select course...</option>
                    {CS_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Level</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level:e.target.value }))}
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
                    <option value="">All levels</option>
                    {['Level 100','Level 200','Level 300','Level 400','Postgrad'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Description (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))}
                    rows={2} placeholder="What does this cover? Any notes?"
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50 resize-none" />
                </div>
              </div>

              {uploading && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-dark-muted mb-1">
                    <span>Uploading...</span><span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-dark-card2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-dark-border rounded-xl text-sm font-semibold text-dark-muted hover:bg-dark-card2 press">Cancel</button>
                <button type="submit" disabled={uploading || !file}
                  className="flex-1 py-2.5 bg-brand-green text-dark-bg rounded-xl text-sm font-black hover:bg-brand-green-dim disabled:opacity-40 press">
                  {uploading ? `Uploading ${uploadProgress}%...` : '📤 Upload'}
                </button>
              </div>
            </form>
          )}

          {/* Search & filter */}
          <div className="card p-3 mb-4 flex flex-col sm:flex-row gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search slides, notes..."
              className="flex-1 bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
              className="bg-dark-card2 border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
              <option value="">All Courses</option>
              {CS_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
              className="bg-dark-card2 border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
              <option value="">All Levels</option>
              {['Level 100','Level 200','Level 300','Level 400','Postgrad'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Course grouping — quick chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-3">
            <button onClick={() => setFilterCourse('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border flex-shrink-0 press transition-all
                ${!filterCourse ? 'bg-brand-green text-dark-bg border-brand-green' : 'bg-dark-card border-dark-border text-dark-muted'}`}>
              All
            </button>
            {CS_COURSES.slice(0,8).map(c => (
              <button key={c} onClick={() => setFilterCourse(f => f===c?'':c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border flex-shrink-0 press transition-all
                  ${filterCourse===c ? 'bg-brand-green text-dark-bg border-brand-green' : 'bg-dark-card border-dark-border text-dark-muted hover:border-dark-border2'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Slides grid */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-dark-card2 mb-3" />
                  <div className="h-3 bg-dark-card2 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-dark-card2 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-3">📂</div>
              <div className="font-head font-bold text-white text-lg">No slides yet</div>
              <div className="text-sm text-dark-muted mt-1">Upload the first resource for your coursemates!</div>
              <button onClick={() => setShowForm(true)} className="mt-4 bg-brand-green text-dark-bg px-6 py-2.5 rounded-2xl font-black text-sm press">
                Upload Now
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(slide => (
              <div key={slide.id} className="card p-4 hover:border-dark-border2 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-dark-card2 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-dark-border transition-colors">
                    {FILE_ICON(slide.file_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate leading-tight">{slide.title}</div>
                    {slide.course && <div className="text-xs text-brand-green font-semibold mt-0.5 truncate">{slide.course}</div>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {slide.level && <span className="text-xs bg-dark-card2 border border-dark-border text-dark-muted px-2 py-0.5 rounded-full">{slide.level}</span>}
                      <span className="text-xs text-dark-subtle">{formatSize(slide.file_size)}</span>
                    </div>
                  </div>
                </div>

                {slide.description && (
                  <p className="text-xs text-dark-muted mt-2 line-clamp-2 leading-relaxed">{slide.description}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border/50">
                  <div className="text-xs text-dark-subtle truncate">
                    by <span className="text-dark-muted font-semibold">{slide.uploader?.full_name?.split(' ')[0]}</span>
                    {' · '}{formatDistanceToNow(new Date(slide.created_at), { addSuffix:true })}
                  </div>
                  <a href={slide.file_url} download target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-brand-green/20 transition-colors press flex-shrink-0 ml-2">
                    ⬇️ Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
