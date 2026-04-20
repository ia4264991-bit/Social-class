import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/profiles/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Profile not found' })
  res.json(data)
})

// GET /api/profiles/hall/:hall  — all students in a hall
router.get('/hall/:hall', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, hall, room_number, department, level, is_online')
    .eq('hall', req.params.hall)
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// PUT /api/profiles/:id
router.put('/:id', async (req, res) => {
  const { full_name, bio, avatar_url, hall, room_number, department, level, is_online } = req.body
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, bio, avatar_url, hall, room_number, department, level, is_online })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

export default router
