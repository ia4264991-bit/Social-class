import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/slides
router.get('/', async (req, res) => {
  const { course, level, search, limit = 50, offset = 0 } = req.query
  let q = supabase.from('slides')
    .select('*, uploader:profiles(id,full_name,avatar_url,hall,level)')
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)
  if (course) q = q.eq('course', course)
  if (level)  q = q.eq('level', level)
  if (search) q = q.ilike('title', `%${search}%`)
  const { data, error } = await q
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// POST /api/slides
router.post('/', async (req, res) => {
  const { uploader_id, title, course, level, description, file_url, file_name, file_size, file_type } = req.body
  const { data, error } = await supabase.from('slides')
    .insert({ uploader_id, title, course, level, description, file_url, file_name, file_size, file_type })
    .select('*, uploader:profiles(id,full_name,avatar_url,hall,level)')
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// DELETE /api/slides/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('slides').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Deleted' })
})

export default router
