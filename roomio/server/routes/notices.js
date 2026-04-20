import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/notices
router.get('/', async (req, res) => {
  const { hall } = req.query
  let query = supabase
    .from('notices')
    .select('*, author:profiles(id, full_name, avatar_url, hall)')
    .order('created_at', { ascending: false })

  // Return campus-wide + hall-specific notices
  if (hall) query = query.or(`hall.eq.${hall},hall.is.null`)

  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// POST /api/notices
router.post('/', async (req, res) => {
  const { author_id, title, content, hall, priority } = req.body
  const { data, error } = await supabase
    .from('notices')
    .insert({ author_id, title, content, hall: hall || null, priority: priority || 'normal' })
    .select('*, author:profiles(id, full_name, avatar_url, hall)')
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

export default router
