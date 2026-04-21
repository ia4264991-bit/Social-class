import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import LeftSidebar from '../components/layout/LeftSidebar'
import Avatar from '../components/shared/Avatar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import api from '../lib/axios'
import { HALLS, CS_LEVELS } from '../lib/halls'
import { THEMES, applyTheme } from '../lib/theme'

const SECTIONS = ['Profile', 'Appearance', 'Account', 'Privacy', 'Notifications']

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{ position:'relative', width:44, height:24, borderRadius:999, backgroundColor: on ? 'var(--accent)' : 'var(--border)', border:'none', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }} className="press">
      <span style={{ position:'absolute', top:3, left: on ? 23 : 3, width:18, height:18, backgroundColor:'white', borderRadius:'50%', transition:'left 0.2s' }} />
    </button>
  )
}

function SettingRow({ label, desc, on, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, paddingRight:16 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{label}</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

export default function Settings() {
  const { user, profile, refreshProfile, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [section, setSection] = useState('Profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('roomio-theme') || 'dark')
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const [form, setForm] = useState({
    full_name:   profile?.full_name   || '',
    bio:         profile?.bio         || '',
    hall:        profile?.hall        || '',
    room_number: profile?.room_number || '',
    level:       profile?.level       || '',
  })

  const saveProfile = async () => {
    setSaving(true)
    try {
      await api.put(`/api/profiles/${user.id}`, { full_name: form.full_name, bio: form.bio, hall: form.hall, room_number: form.room_number, level: form.level })
      refreshProfile()
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const selectTheme = async (key) => {
    setSelectedTheme(key)
    applyTheme(key)                        // ← applies immediately to live UI
    await api.put(`/api/profiles/${user.id}`, { theme: key }).catch(() => {})
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploadingAvatar(true)
    const path = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('roomio').upload(path, file, { upsert: true })
    if (!error) {
      const { data: u } = supabase.storage.from('roomio').getPublicUrl(path)
      await api.put(`/api/profiles/${user.id}`, { avatar_url: u.publicUrl })
      refreshProfile()
    } else { console.error('Avatar upload:', error.message) }
    setUploadingAvatar(false)
  }

  const changePassword = async (e) => {
    e.preventDefault(); setPwError('')
    if (pwForm.new !== pwForm.confirm) return setPwError('Passwords do not match.')
    if (pwForm.new.length < 6) return setPwError('Min. 6 characters.')
    setChangingPw(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: pwForm.current })
    if (signInErr) { setPwError('Current password is wrong.'); setChangingPw(false); return }
    const { error: upErr } = await supabase.auth.updateUser({ password: pwForm.new })
    if (upErr) { setPwError(upErr.message); setChangingPw(false); return }
    setPwSuccess(true); setPwForm({ current:'', new:'', confirm:'' })
    setTimeout(() => setPwSuccess(false), 3000)
    setChangingPw(false)
  }

  const card = { backgroundColor:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 24px', marginBottom:16 }
  const inputStyle = { width:'100%', backgroundColor:'var(--card2)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 16px', fontSize:14, color:'var(--text)', outline:'none', boxSizing:'border-box' }
  const label = { display:'block', fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:6 }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth:1000, margin:'0 auto', display:'flex', padding:'16px 8px 96px', gap:0 }}>
        <LeftSidebar />
        <main style={{ flex:1, minWidth:0, padding:'0 0 0 16px' }}>
          <h1 style={{ fontFamily:'Nunito,sans-serif', fontWeight:900, color:'var(--text)', fontSize:24, marginBottom:16 }}>⚙️ Settings</h1>

          <div style={{ display:'flex', gap:16, flexDirection:'column' }} className="md:flex-row">
            {/* Section nav */}
            <div style={{ flexShrink:0, width:'auto' }}>
              <div style={{ ...card, padding:6, display:'flex', flexDirection:'row', gap:4, overflowX:'auto' }} className="md:flex-col md:w-44">
                {SECTIONS.map(s => (
                  <button key={s} onClick={() => setSection(s)} className="press"
                    style={{ flexShrink:0, padding:'9px 14px', borderRadius:10, fontSize:13, fontWeight:600, border:'1px solid transparent', textAlign:'left', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', backgroundColor: section===s ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', color: section===s ? 'var(--accent)' : 'var(--muted)', borderColor: section===s ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'transparent' }}>
                    {s === 'Profile' && '👤 '}{s === 'Appearance' && '🎨 '}{s === 'Account' && '🔐 '}{s === 'Privacy' && '🛡️ '}{s === 'Notifications' && '🔔 '}{s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex:1, minWidth:0 }}>

              {/* ── PROFILE ── */}
              {section === 'Profile' && (
                <div style={card}>
                  <h2 style={{ fontFamily:'Nunito,sans-serif', fontWeight:800, color:'var(--text)', fontSize:18, marginBottom:20 }}>Profile Information</h2>

                  <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
                    <div style={{ position:'relative' }} className="group">
                      <Avatar profile={profile} size={72} />
                      <button onClick={() => fileRef.current.click()} className="press"
                        style={{ position:'absolute', inset:0, borderRadius:'50%', backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer', opacity:0, transition:'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        <span style={{ color:'white', fontSize:12, fontWeight:800 }}>{uploadingAvatar ? '…' : '📷'}</span>
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
                    </div>
                    <div>
                      <button onClick={() => fileRef.current.click()} className="press"
                        style={{ padding:'8px 16px', backgroundColor:'var(--card2)', border:'1px solid var(--border)', borderRadius:10, fontSize:13, fontWeight:700, color:'var(--text)', cursor:'pointer' }}>
                        {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                      </button>
                      <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={label}>Full Name</label>
                      <input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={label}>Bio</label>
                      <textarea rows={3} style={{ ...inputStyle, resize:'none' }} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell your classmates about yourself..." onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={label}>Hall</label>
                      <select style={{ ...inputStyle, cursor:'pointer' }} value={form.hall} onChange={e => setForm(f => ({ ...f, hall: e.target.value }))}>
                        {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={label}>Room Number</label>
                      <input style={inputStyle} value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={label}>Level</label>
                      <select style={{ ...inputStyle, cursor:'pointer' }} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                        {CS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', paddingTop:20 }}>
                      <span style={{ fontSize:13, color:'var(--muted)' }}>🎓 Department: <span style={{ color:'var(--accent)', fontWeight:600 }}>Computer Science</span></span>
                    </div>
                  </div>

                  <button onClick={saveProfile} disabled={saving} className="press"
                    style={{ marginTop:20, padding:'10px 24px', backgroundColor: saved ? '#16a34a' : 'var(--accent)', color:'var(--accent-text)', borderRadius:20, fontWeight:800, fontSize:14, border:'none', cursor:'pointer', opacity: saving ? 0.5 : 1 }}>
                    {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* ── APPEARANCE ── */}
              {section === 'Appearance' && (
                <div style={card}>
                  <h2 style={{ fontFamily:'Nunito,sans-serif', fontWeight:800, color:'var(--text)', fontSize:18, marginBottom:6 }}>Appearance</h2>
                  <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Choose a theme. It applies instantly to the whole app.</p>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12 }}>
                    {Object.entries(THEMES).map(([key, theme]) => {
                      const active = selectedTheme === key
                      return (
                        <button key={key} onClick={() => selectTheme(key)} className="press"
                          style={{ padding:12, borderRadius:14, border: active ? '2px solid var(--accent)' : '1px solid var(--border)', backgroundColor: active ? 'color-mix(in srgb, var(--accent) 8%, var(--card2))' : 'var(--card2)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                          {/* Colour swatch */}
                          <div style={{ display:'flex', height:32, borderRadius:8, overflow:'hidden', marginBottom:8 }}>
                            <div style={{ flex:2, backgroundColor: theme.preview[0] }} />
                            <div style={{ flex:2, backgroundColor: theme.preview[1] }} />
                            <div style={{ flex:1, backgroundColor: theme.preview[2] }} />
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{theme.label}</div>
                          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{theme.desc}</div>
                          {active && (
                            <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--accent)', fontWeight:700 }}>
                              ✓ Active
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── ACCOUNT ── */}
              {section === 'Account' && (
                <div>
                  <div style={card}>
                    <h2 style={{ fontFamily:'Nunito,sans-serif', fontWeight:800, color:'var(--text)', fontSize:18, marginBottom:16 }}>Account Info</h2>
                    {[
                      { label:'Email', value: user?.email },
                      { label:'Department', value:'Computer Science' },
                      { label:'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GH', { month:'long', year:'numeric' }) : '—' },
                    ].map(row => (
                      <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ fontSize:14, color:'var(--muted)' }}>{row.label}</span>
                        <span style={{ fontSize:14, color:'var(--text)', fontWeight:500 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={card}>
                    <h2 style={{ fontFamily:'Nunito,sans-serif', fontWeight:800, color:'var(--text)', fontSize:18, marginBottom:16 }}>Change Password</h2>
                    {pwSuccess && <div style={{ backgroundColor:'rgba(22,163,74,0.2)', border:'1px solid rgba(22,163,74,0.4)', color:'#86efac', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:14 }}>✅ Password updated!</div>}
                    {pwError && <div style={{ backgroundColor:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{pwError}</div>}
                    <form onSubmit={changePassword}>
                      {[{k:'current',l:'Current Password'},{k:'new',l:'New Password'},{k:'confirm',l:'Confirm Password'}].map(f => (
                        <div key={f.k} style={{ marginBottom:12 }}>
                          <label style={label}>{f.l}</label>
                          <input type="password" style={inputStyle} value={pwForm[f.k]} onChange={e => setPwForm(p => ({ ...p, [f.k]: e.target.value }))} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                        </div>
                      ))}
                      <button type="submit" disabled={changingPw} className="press"
                        style={{ padding:'10px 20px', backgroundColor:'var(--accent)', color:'var(--accent-text)', borderRadius:20, fontWeight:800, fontSize:13, border:'none', cursor:'pointer', opacity: changingPw ? 0.5 : 1, marginTop:4 }}>
                        {changingPw ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  <div style={{ ...card, borderColor:'rgba(239,68,68,0.3)' }}>
                    <h2 style={{ fontFamily:'Nunito,sans-serif', fontWeight:800, color:'#f87171', fontSize:18, marginBottom:16 }}>⚠️ Danger Zone</h2>
                    <button onClick={async () => { await logout(); navigate('/login') }} className="press"
                      style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', backgroundColor:'var(--card2)', border:'1px solid var(--border)', borderRadius:10, fontSize:14, color:'var(--muted)', cursor:'pointer', marginBottom:12 }}>
                      <span>Sign out of Roomio</span><span>🚪</span>
                    </button>
                    <div style={{ border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:16 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#f87171', marginBottom:4 }}>Delete Account</div>
                      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>Permanently removes your account and all data. Type DELETE to confirm.</p>
                      <input style={{ ...inputStyle, borderColor:'rgba(239,68,68,0.4)', marginBottom:8 }} value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Type DELETE to confirm" />
                      <button disabled={deleteConfirm !== 'DELETE'} className="press"
                        style={{ padding:'8px 16px', backgroundColor:'#dc2626', color:'white', borderRadius:10, fontWeight:700, fontSize:13, border:'none', cursor:'pointer', opacity: deleteConfirm !== 'DELETE' ? 0.3 : 1 }}>
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PRIVACY ── */}
              {section === 'Privacy' && (
                <div style={card}>
                  <h2 style={{ fontFamily:'Nunito,sans-serif', fontWeight:800, color:'var(--text)', fontSize:18, marginBottom:16 }}>Privacy Settings</h2>
                  {[
                    { label:'Show online status', desc:"Let others see when you're active", def:true },
                    { label:'Show hall & room', desc:'Display your hall and room on profile', def:true },
                    { label:'Allow friend requests', desc:'Let students send you friend requests', def:true },
                    { label:'Show in search results', desc:'Allow others to find you by name', def:true },
                    { label:'Private profile', desc:'Only friends can see your posts', def:false },
                  ].map(item => {
                    const [on, setOn] = useState(item.def)
                    return <SettingRow key={item.label} label={item.label} desc={item.desc} on={on} onChange={setOn} />
                  })}
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {section === 'Notifications' && (
                <div style={card}>
                  <h2 style={{ fontFamily:'Nunito,sans-serif', fontWeight:800, color:'var(--text)', fontSize:18, marginBottom:16 }}>Notifications</h2>
                  {[
                    { label:'New messages', desc:'When someone messages you', def:true },
                    { label:'Friend requests', desc:'When someone sends you a request', def:true },
                    { label:'Post reactions', desc:'When someone likes your post', def:true },
                    { label:'Comments', desc:'When someone comments on your post', def:true },
                    { label:'Hall notices', desc:'Official notices from your hall', def:true },
                    { label:'New slides', desc:'When someone uploads course materials', def:false },
                    { label:'Marketplace', desc:'When someone messages about your listing', def:true },
                  ].map(item => {
                    const [on, setOn] = useState(item.def)
                    return <SettingRow key={item.label} label={item.label} desc={item.desc} on={on} onChange={setOn} />
                  })}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
