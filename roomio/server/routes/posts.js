import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

router.get('/', async (req, res) => {
  const { hall, post_type, author_id, limit = 30, offset = 0 } = req.query
  let q = supabase
    .from('posts')
    .select(`*, author:profiles(id,full_name,username,avatar_url,hall,room_number,level,is_online), reactions(id,type,user_id), comments(id)`)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (hall)      q = q.eq('hall_tag', hall)
  if (post_type) q = q.eq('post_type', post_type)
  if (author_id) q = q.eq('author_id', author_id)

  const { data, error } = await q
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { author_id, content, image_url, video_url, post_type, hall_tag } = req.body
  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id, content, image_url, video_url, post_type: post_type || 'general', hall_tag })
    .select(`*, author:profiles(id,full_name,username,avatar_url,hall,room_number,level,is_online)`)
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('posts').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Deleted' })
})

export default router
