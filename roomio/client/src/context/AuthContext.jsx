import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
    else console.warn('fetchProfile error:', error?.message)
    return data
  }

  const setOnline = (userId, online) =>
    supabase.from('profiles').update({ is_online: online }).eq('id', userId)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) { fetchProfile(u.id); setOnline(u.id, true) }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) { fetchProfile(u.id); setOnline(u.id, true) }
      else setProfile(null)
    })

    const handleUnload = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setOnline(session.user.id, false)
      })
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      listener.subscription.unsubscribe()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    if (user?.id) await setOnline(user.id, false)
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
  }

  const refreshProfile = () => user && fetchProfile(user.id)

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
