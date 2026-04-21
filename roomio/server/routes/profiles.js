import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/profiles/hall/:hall  — MUST be before /:id to avoid route conflict
router.get('/hall/:hall', async (req, res) => {
  const hall = decodeURIComponent(req.params.hall)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, hall, room_number, department, level, is_online')
    .eq('hall', hall)
  if (error) {
    console.error('GET /profiles/hall/:hall', error.message)
    return res.status(400).json({ error: error.message })
  }
  res.json(data || [])
})

// GET /api/profiles/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) {
    console.error('GET /profiles/:id', error.message)
    return res.status(404).json({ error: 'Profile not found' })
  }
  res.json(data)
})

// PUT /api/profiles/:id
router.put('/:id', async (req, res) => {
  const allowed = ['full_name', 'bio', 'avatar_url', 'hall', 'room_number', 'department', 'level', 'is_online', 'theme']
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) {
    console.error('PUT /profiles/:id', error.message)
    return res.status(400).json({ error: error.message })
  }
  res.json(data)
})

export default router
