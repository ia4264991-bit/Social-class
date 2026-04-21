import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach Supabase JWT to every request so the server knows who's calling
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Global error logging
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error || err.message
    console.error(`[API] ${err.config?.method?.toUpperCase()} ${err.config?.url} →`, msg)
    return Promise.reject(err)
  }
)

export default api
