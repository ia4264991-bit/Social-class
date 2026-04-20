import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// POST /api/reactions
router.post('/', async (req, res) => {
  const { post_id, user_id, type } = req.body
  const { data, error } = await supabase
    .from('reactions')
    .upsert({ post_id, user_id, type }, { onConflict: 'post_id,user_id' })
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// DELETE /api/reactions/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('reactions').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Reaction removed' })
})

export default router
