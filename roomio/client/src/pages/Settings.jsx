import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import Avatar from '../components/shared/Avatar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import api from '../lib/axios'
import { HALLS, CS_LEVELS } from '../lib/halls'

const THEMES = [
  { key: 'dark',       label: 'Dark',        desc: 'Deep space dark',     preview: ['#0f1117','#161b27','#00c853'] },
  { key: 'midnight',   label: 'Midnight',    desc: 'Pure black OLED',     preview: ['#000000','#0a0a0a','#6366f1'] },
  { key: 'forest',     label: 'Forest',      desc: 'Deep green nature',   preview: ['#0a1a12','#0f2418','#22c55e'] },
  { key: 'ocean',      label: 'Ocean',       desc: 'Deep blue vibes',     preview: ['#050d1a','#0c1a2e','#3b82f6'] },
  { key: 'sunset',     label: 'Sunset',      desc: 'Warm amber tones',    preview: ['#1a0f05','#2a1708','#f59e0b'] },
  { key: 'purple',     label: 'Galaxy',      desc: 'Cosmic purple',       preview: ['#0d0a1a','#160f2a','#a855f7'] },
  { key: 'light',      label: 'Light',       desc: 'Clean & bright',      preview: ['#f8fafc','#ffffff','#006633'] },
  { key: 'solarized',  label: 'Solarized',   desc: 'Easy on the eyes',    preview: ['#002b36','#073642','#2aa198'] },
]

const THEME_VARS = {
  dark:       { '--bg':'#0f1117','--card':'#161b27','--card2':'#1a2235','--border':'#1e293b','--text':'#f1f5f9','--muted':'#94a3b8','--accent':'#00c853','--accent-dim':'#00a844' },
  midnight:   { '--bg':'#000000','--card':'#0a0a0a','--card2':'#111111','--border':'#1a1a1a','--text':'#f1f5f9','--muted':'#6b7280','--accent':'#6366f1','--accent-dim':'#4f46e5' },
  forest:     { '--bg':'#0a1a12','--card':'#0f2418','--card2':'#14301f','--border':'#1a3d28','--text':'#ecfdf5','--muted':'#6ee7b7','--accent':'#22c55e','--accent-dim':'#16a34a' },
  ocean:      { '--bg':'#050d1a','--card':'#0c1a2e','--card2':'#0f2040','--border':'#162840','--text':'#eff6ff','--muted':'#93c5fd','--accent':'#3b82f6','--accent-dim':'#2563eb' },
  sunset:     { '--bg':'#1a0f05','--card':'#2a1708','--card2':'#351f0a','--border':'#4a2d0f','--text':'#fffbeb','--muted':'#fcd34d','--accent':'#f59e0b','--accent-dim':'#d97706' },
  purple:     { '--bg':'#0d0a1a','--card':'#160f2a','--card2':'#1e1535','--border':'#2d1d50','--text':'#faf5ff','--muted':'#c4b5fd','--accent':'#a855f7','--accent-dim':'#9333ea' },
  light:      { '--bg':'#f0f4f0','--card':'#ffffff','--card2':'#f8faf8','--border':'#d4e8d4','--text':'#1c1e21','--muted':'#65676b','--accent':'#006633','--accent-dim':'#008844' },
  solarized:  { '--bg':'#002b36','--card':'#073642','--card2':'#0d4452','--border':'#114d5e','--text':'#fdf6e3','--muted':'#93a1a1','--accent':'#2aa198','--accent-dim':'#1f8076' },
}

function applyTheme(key) {
  const vars = THEME_VARS[key] || THEME_VARS.dark
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  localStorage.setItem('roomio-theme', key)
}

const SECTIONS = ['Profile', 'Appearance', 'Account', 'Privacy', 'Notifications']

export default function Settings() {
  const { user, profile, refreshProfile, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [section, setSection] = useState('Profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(profile?.theme || localStorage.getItem('roomio-theme') || 'dark')
  const [changingPassword, setChangingPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const [form, setForm] = useState({
    full_name:   profile?.full_name   || '',
    bio:         profile?.bio         || '',
    hall:        profile?.hall        || '',
    room_number: profile?.room_number || '',
    level:       profile?.level       || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const saveProfile = async () => {
    setSaving(true)
    try {
      await api.put(`/api/profiles/${user.id}`, form)
      refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Save profile error:', err)
    } finally {
      setSaving(false)
    }
  }

  const saveTheme = async (key) => {
    setSelectedTheme(key)
    applyTheme(key)
    await api.put(`/api/profiles/${user.id}`, { theme: key }).catch(() => {})
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('roomio').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data: u } = supabase.storage.from('roomio').getPublicUrl(path)
      await api.put(`/api/profiles/${user.id}`, { avatar_url: u.publicUrl })
      refreshProfile()
    } else {
      console.error('Avatar upload error:', upErr.message)
    }
    setUploadingAvatar(false)
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.new !== pwForm.confirm) return setPwError('Passwords do not match.')
    if (pwForm.new.length < 6) return setPwError('Password must be at least 6 characters.')
    setChangingPassword(true)
    // Re-authenticate then update
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: pwForm.current })
    if (signInErr) { setPwError('Current password is incorrect.'); setChangingPassword(false); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.new })
    if (updateErr) { setPwError(updateErr.message); setChangingPassword(false); return }
    setPwSuccess(true)
    setPwForm({ current: '', new: '', confirm: '' })
    setChangingPassword(false)
    setTimeout(() => setPwSuccess(false), 3000)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto flex px-2 pt-4 pb-24 md:pb-6 gap-0">
        <LeftSidebar />
        <main className="flex-1 min-w-0 md:px-4">
          <h1 className="font-head font-black text-white text-2xl mb-4">⚙️ Settings</h1>

          <div className="flex gap-3 flex-col md:flex-row">
            {/* Sidebar nav */}
            <div className="md:w-44 flex-shrink-0">
              <div className="card p-2 flex md:flex-col gap-1 overflow-x-auto scrollbar-hide md:overflow-visible">
                {SECTIONS.map(s => (
                  <button key={s} onClick={() => setSection(s)}
                    className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all press whitespace-nowrap
                      ${section === s ? 'bg-brand-green/15 text-brand-green border border-brand-green/20' : 'text-dark-muted hover:bg-dark-card2 hover:text-white'}`}>
                    {s === 'Profile' && '👤 '}
                    {s === 'Appearance' && '🎨 '}
                    {s === 'Account' && '🔐 '}
                    {s === 'Privacy' && '🛡️ '}
                    {s === 'Notifications' && '🔔 '}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* ── PROFILE ─────────────────────────────── */}
              {section === 'Profile' && (
                <div className="card p-6 space-y-5">
                  <h2 className="font-head font-bold text-white text-lg">Profile Information</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar profile={profile} size={72} />
                      <button onClick={() => fileRef.current.click()}
                        className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 md:transition-opacity press active:opacity-100">
                        <span className="text-white text-xs font-black">{uploadingAvatar ? '…' : '📷'}</span>
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <div>
                      <button onClick={() => fileRef.current.click()}
                        className="px-4 py-2 bg-dark-card2 border border-dark-border rounded-xl text-sm font-bold text-white hover:bg-dark-border press">
                        {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                      </button>
                      <p className="text-xs text-dark-muted mt-1">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-dark-muted mb-1.5">Full Name</label>
                      <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                        className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-dark-muted mb-1.5">Bio</label>
                      <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3}
                        placeholder="Tell your classmates about yourself..."
                        className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-dark-muted mb-1.5">Hall</label>
                      <select value={form.hall} onChange={e => set('hall', e.target.value)}
                        className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
                        {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-dark-muted mb-1.5">Room Number</label>
                      <input value={form.room_number} onChange={e => set('room_number', e.target.value)}
                        className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-dark-muted mb-1.5">Level</label>
                      <select value={form.level} onChange={e => set('level', e.target.value)}
                        className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50">
                        {CS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center text-sm text-dark-muted pt-5">
                      <span className="text-dark-subtle">🎓 Department:</span>
                      <span className="ml-2 text-brand-green font-semibold">Computer Science</span>
                    </div>
                  </div>

                  <button onClick={saveProfile} disabled={saving}
                    className={`px-6 py-2.5 rounded-2xl text-sm font-black press transition-all
                      ${saved ? 'bg-green-600 text-white' : 'bg-brand-green text-dark-bg hover:bg-brand-green-dim'} disabled:opacity-50`}>
                    {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* ── APPEARANCE ──────────────────────────── */}
              {section === 'Appearance' && (
                <div className="card p-6">
                  <h2 className="font-head font-bold text-white text-lg mb-1">Appearance</h2>
                  <p className="text-dark-muted text-sm mb-5">Choose a theme that suits your style.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {THEMES.map(theme => (
                      <button key={theme.key} onClick={() => saveTheme(theme.key)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all press
                          ${selectedTheme === theme.key
                            ? 'border-brand-green bg-brand-green/10'
                            : 'border-dark-border hover:border-dark-border2'}`}>
                        {/* Preview swatch */}
                        <div className="w-full h-12 rounded-xl overflow-hidden flex">
                          <div className="flex-1" style={{ background: theme.preview[0] }} />
                          <div className="flex-1" style={{ background: theme.preview[1] }} />
                          <div className="w-4" style={{ background: theme.preview[2] }} />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-white">{theme.label}</div>
                          <div className="text-xs text-dark-subtle mt-0.5">{theme.desc}</div>
                        </div>
                        {selectedTheme === theme.key && (
                          <div className="w-4 h-4 rounded-full bg-brand-green flex items-center justify-center">
                            <span className="text-dark-bg text-xs font-black">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-dark-card2 border border-dark-border rounded-xl">
                    <div className="text-sm font-semibold text-white mb-1">📱 Font Size</div>
                    <div className="flex gap-2 mt-2">
                      {['Small', 'Medium', 'Large'].map(size => (
                        <button key={size}
                          className="flex-1 py-2 rounded-xl text-xs font-bold border border-dark-border text-dark-muted hover:border-brand-green/40 hover:text-white press transition-colors">
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACCOUNT ─────────────────────────────── */}
              {section === 'Account' && (
                <div className="space-y-4">
                  {/* Account info */}
                  <div className="card p-6">
                    <h2 className="font-head font-bold text-white text-lg mb-4">Account Info</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-dark-border">
                        <span className="text-sm text-dark-muted">Email</span>
                        <span className="text-sm text-white font-medium">{user?.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-dark-border">
                        <span className="text-sm text-dark-muted">Department</span>
                        <span className="text-sm text-brand-green font-medium">Computer Science</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-dark-muted">Member since</span>
                        <span className="text-sm text-white font-medium">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GH', { month:'long', year:'numeric' }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Change password */}
                  <div className="card p-6">
                    <h2 className="font-head font-bold text-white text-lg mb-4">Change Password</h2>
                    {pwSuccess && (
                      <div className="bg-green-900/30 border border-green-700/50 text-green-400 rounded-xl px-4 py-3 text-sm mb-4">
                        ✅ Password updated successfully!
                      </div>
                    )}
                    {pwError && (
                      <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{pwError}</div>
                    )}
                    <form onSubmit={changePassword} className="space-y-3">
                      {[
                        { key:'current', label:'Current Password', placeholder:'Your current password' },
                        { key:'new',     label:'New Password',     placeholder:'Min. 6 characters' },
                        { key:'confirm', label:'Confirm Password', placeholder:'Repeat new password' },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="block text-xs font-bold text-dark-muted mb-1.5">{field.label}</label>
                          <input type="password" value={pwForm[field.key]}
                            onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full bg-dark-card2 border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-green/50" />
                        </div>
                      ))}
                      <button type="submit" disabled={changingPassword}
                        className="px-6 py-2.5 bg-brand-green text-dark-bg rounded-2xl text-sm font-black hover:bg-brand-green-dim disabled:opacity-50 press">
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  {/* Danger zone */}
                  <div className="card p-6 border-red-800/40">
                    <h2 className="font-head font-bold text-red-400 text-lg mb-4">⚠️ Danger Zone</h2>
                    <div className="space-y-3">
                      <button onClick={handleLogout}
                        className="w-full flex items-center justify-between px-4 py-3 bg-dark-card2 border border-dark-border rounded-xl text-sm text-dark-muted hover:text-white hover:border-dark-border2 press transition-colors">
                        <span>Sign out of Roomio</span>
                        <span>🚪</span>
                      </button>
                      <div className="border border-red-800/40 rounded-xl p-4">
                        <div className="text-sm font-bold text-red-400 mb-1">Delete Account</div>
                        <p className="text-xs text-dark-muted mb-3">This permanently removes your account, posts, and data. Type DELETE to confirm.</p>
                        <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="w-full bg-dark-card2 border border-red-800/40 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500 mb-2" />
                        <button disabled={deleteConfirm !== 'DELETE'}
                          className="px-4 py-2 bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-30 press hover:bg-red-600">
                          Delete My Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PRIVACY ─────────────────────────────── */}
              {section === 'Privacy' && (
                <div className="card p-6 space-y-4">
                  <h2 className="font-head font-bold text-white text-lg">Privacy Settings</h2>
                  {[
                    { label:'Show online status', desc:'Let others see when you\'re active', defaultOn: true },
                    { label:'Show hall & room', desc:'Display your hall and room on your profile', defaultOn: true },
                    { label:'Allow friend requests', desc:'Let other students send you friend requests', defaultOn: true },
                    { label:'Show in search results', desc:'Allow others to find you by name', defaultOn: true },
                    { label:'Private profile', desc:'Only friends can see your posts', defaultOn: false },
                  ].map(setting => (
                    <ToggleSetting key={setting.label} {...setting} />
                  ))}
                </div>
              )}

              {/* ── NOTIFICATIONS ───────────────────────── */}
              {section === 'Notifications' && (
                <div className="card p-6 space-y-4">
                  <h2 className="font-head font-bold text-white text-lg">Notification Preferences</h2>
                  {[
                    { label:'New messages', desc:'Get notified when someone messages you', defaultOn: true },
                    { label:'Friend requests', desc:'Alerts when someone sends you a request', defaultOn: true },
                    { label:'Post reactions', desc:'When someone likes or reacts to your post', defaultOn: true },
                    { label:'Comments', desc:'When someone comments on your post', defaultOn: true },
                    { label:'Hall notices', desc:'Official notices from your hall', defaultOn: true },
                    { label:'New slides', desc:'When someone uploads course materials', defaultOn: false },
                    { label:'Marketplace', desc:'When someone messages about your listing', defaultOn: true },
                  ].map(setting => (
                    <ToggleSetting key={setting.label} {...setting} />
                  ))}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function ToggleSetting({ label, desc, defaultOn }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-border/50 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-dark-muted mt-0.5">{desc}</div>
      </div>
      <button onClick={() => setOn(o => !o)}
        className={`relative w-12 h-6 rounded-full transition-colors press flex-shrink-0 ${on ? 'bg-brand-green' : 'bg-dark-border'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )
}
