import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name, hall, room_number, department, level } = req.body

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return res.status(400).json({ error: authError.message })

  const username = email.split('@')[0]
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    full_name,
    username,
    hall,
    room_number,
    department,
    level,
  })
  if (profileError) return res.status(400).json({ error: profileError.message })

  res.json({ message: 'Registered successfully' })
})

// POST /api/auth/login  (Supabase Auth handled client-side; this is optional server validation)
router.post('/login', async (req, res) => {
  res.json({ message: 'Use Supabase client signInWithPassword on the frontend' })
})

export default router
