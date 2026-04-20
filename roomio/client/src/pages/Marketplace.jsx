import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import ItemCard from '../components/marketplace/ItemCard'
import api from '../lib/axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { HALLS } from '../lib/halls'

const CATS = [
  { key:'', label:'🛒 All' },
  { key:'textbooks', label:'📖 Books' },
  { key:'electronics', label:'💻 Tech' },
  { key:'furniture', label:'🪑 Furniture' },
  { key:'clothing', label:'👕 Clothing' },
  { key:'other', label:'📦 Other' },
]

export default function Marketplace() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', price:'', category:'textbooks' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [posting, setPosting] = useState(false)

  const load = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (cat) p.set('category', cat)
    if (search) p.set('search', search)
    const { data } = await api.get(`/api/marketplace?${p}`)
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [cat, search])

  const handlePost = async (e) => {
    e.preventDefault(); setPosting(true)
    let image_url = null
    if (imageFile) {
      const path = `marketplace/${user.id}/${Date.now()}-${imageFile.name}`
      const { error } = await supabase.storage.from('roomio').upload(path, imageFile)
      if (!error) {
        const { data: u } = supabase.storage.from('roomio').getPublicUrl(path)
        image_url = u.publicUrl
      }
    }
    await api.post('/api/marketplace', { seller_id:user.id, title:form.title, description:form.description, price:parseFloat(form.price), image_url, category:form.category, hall:profile?.hall })
    setShowForm(false); setForm({ title:'', description:'', price:'', category:'textbooks' }); setImageFile(null); setImagePreview(null)
    load(); setPosting(false)
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto flex px-2 pt-4 pb-24 md:pb-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-head font-black text-white text-xl sm:text-2xl">🛒 CS Store</h1>
              <p className="text-xs text-dark-muted mt-0.5">Buy & sell within the CS community</p>
            </div>
            <button onClick={() => setShowForm(s => !s)}
              className="bg-brand-green text-dark-bg px-4 py-2.5 rounded-2xl font-black text-sm press hover:bg-brand-green-dim">
              + List Item
            </button>
          </div>

          {showForm && (
            <form onSubmit={handlePost} className="card p-5 mb-4">
              <h2 className="font-head font-bold text-white text-lg mb-4">List a New Item</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Item Name *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
                    placeholder="e.g. HP Laptop 250 G8 — great condition"
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Price (GH₵) *</label>
                  <input required type="number" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price:e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category:e.target.value }))}
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
                    {CATS.filter(c => c.key).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))}
                    rows={2} placeholder="Describe condition, specs, etc."
                    className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-dark-muted mb-1.5">Photo</label>
                  <input type="file" accept="image/*" onChange={e => { setImageFile(e.target.files[0]); setImagePreview(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null) }}
                    className="text-sm text-dark-muted" />
                  {imagePreview && <img src={imagePreview} className="mt-2 h-24 rounded-xl object-cover" alt="preview" />}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-dark-border rounded-xl text-sm font-semibold text-dark-muted hover:bg-dark-card2 press">Cancel</button>
                <button type="submit" disabled={posting}
                  className="flex-1 py-2.5 bg-brand-green text-dark-bg rounded-xl text-sm font-black disabled:opacity-40 press hover:bg-brand-green-dim">
                  {posting ? 'Listing...' : 'List Item'}
                </button>
              </div>
            </form>
          )}

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-3">
            {CATS.map(c => (
              <button key={c.key} onClick={() => setCat(c.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 border press transition-all
                  ${cat===c.key ? 'bg-brand-green text-dark-bg border-brand-green' : 'bg-dark-card border-dark-border text-dark-muted hover:border-dark-border2'}`}>
                {c.label}
              </button>
            ))}
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search items..."
            className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50 mb-4" />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card animate-pulse">
                  <div className="h-36 bg-dark-card2 rounded-t-2xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-dark-card2 rounded w-3/4" />
                    <div className="h-4 bg-dark-card2 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">🛒</div>
              <div className="font-head font-bold text-white text-lg">Nothing for sale yet</div>
              <div className="text-sm text-dark-muted mt-1">Be the first to list something!</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map(item => <ItemCard key={item.id} item={item} onMessage={s => navigate(`/chat/${s.id}`)} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
