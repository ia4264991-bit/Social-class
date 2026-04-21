import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/settings/:userId
router.get('/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio, hall, room_number, level, department, theme')
    .eq('id', req.params.userId)
    .single()
  if (error) return res.status(404).json({ error: 'User not found' })
  res.json(data)
})

// PUT /api/settings/:userId
router.put('/:userId', async (req, res) => {
  const allowed = ['full_name', 'bio', 'theme', 'room_number', 'hall', 'level']
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid settings fields provided' })
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.params.userId)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

export default router
