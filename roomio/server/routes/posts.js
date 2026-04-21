import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/posts
router.get('/', async (req, res) => {
  const { hall, post_type, author_id, limit = 30, offset = 0 } = req.query

  let q = supabase
    .from('posts')
    .select(`
      id, content, image_url, video_url, post_type, hall_tag, created_at,
      author:profiles(id, full_name, username, avatar_url, hall, room_number, level, is_online),
      reactions(id, type, user_id),
      comments(id)
    `)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (hall)      q = q.eq('hall_tag', hall)
  if (post_type) q = q.eq('post_type', post_type)
  if (author_id) q = q.eq('author_id', author_id)

  const { data, error } = await q
  if (error) {
    console.error('GET /posts', error.message)
    return res.status(400).json({ error: error.message })
  }
  res.json(data || [])
})

// POST /api/posts
router.post('/', async (req, res) => {
  const { author_id, content, image_url, video_url, post_type, hall_tag } = req.body

  // Validation
  if (!author_id) return res.status(400).json({ error: 'author_id is required' })
  if (!content && !image_url && !video_url) {
    return res.status(400).json({ error: 'Post must have content, an image, or a video' })
  }

  const insert = {
    author_id,
    content: content || null,
    image_url: image_url || null,
    video_url: video_url || null,
    post_type: post_type || 'general',
    hall_tag: hall_tag || null,
  }

  console.log('POST /posts inserting:', JSON.stringify(insert))

  const { data, error } = await supabase
    .from('posts')
    .insert(insert)
    .select(`
      id, content, image_url, video_url, post_type, hall_tag, created_at,
      author:profiles(id, full_name, username, avatar_url, hall, room_number, level, is_online)
    `)
    .single()

  if (error) {
    console.error('POST /posts Supabase error:', error.message, '| code:', error.code)
    return res.status(400).json({ error: error.message, code: error.code })
  }

  // Attach empty arrays so frontend doesn't crash
  res.json({ ...data, reactions: [], comments: [] })
})

// DELETE /api/posts/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('posts').delete().eq('id', req.params.id)
  if (error) {
    console.error('DELETE /posts/:id', error.message)
    return res.status(400).json({ error: error.message })
  }
  res.json({ message: 'Deleted' })
})

export default router
