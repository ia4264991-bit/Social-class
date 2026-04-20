import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/comments/:postId
router.get('/:postId', async (req, res) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(id, full_name, avatar_url, hall)')
    .eq('post_id', req.params.postId)
    .order('created_at', { ascending: true })
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// POST /api/comments
router.post('/', async (req, res) => {
  const { post_id, author_id, content } = req.body
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, author_id, content })
    .select('*, author:profiles(id, full_name, avatar_url, hall)')
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

export default router
