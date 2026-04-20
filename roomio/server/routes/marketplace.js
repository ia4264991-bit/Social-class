import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/marketplace
router.get('/', async (req, res) => {
  const { category, hall, search, limit = 20, offset = 0 } = req.query
  let query = supabase
    .from('marketplace_items')
    .select('*, seller:profiles(id, full_name, avatar_url, hall, room_number, is_online)')
    .eq('is_sold', false)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (category) query = query.eq('category', category)
  const seller_id = req.query.seller_id
  if (seller_id) query = query.eq("seller_id", seller_id)
  if (hall) query = query.eq('hall', hall)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// POST /api/marketplace
router.post('/', async (req, res) => {
  const { seller_id, title, description, price, image_url, category, hall } = req.body
  const { data, error } = await supabase
    .from('marketplace_items')
    .insert({ seller_id, title, description, price, image_url, category, hall })
    .select('*, seller:profiles(id, full_name, avatar_url, hall)')
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// PUT /api/marketplace/:id  — update or mark as sold
router.put('/:id', async (req, res) => {
  const { title, description, price, image_url, category, is_sold } = req.body
  const { data, error } = await supabase
    .from('marketplace_items')
    .update({ title, description, price, image_url, category, is_sold })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// DELETE /api/marketplace/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('marketplace_items').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Item deleted' })
})

export default router
