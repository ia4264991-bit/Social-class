import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/friends/:userId  — get friends and pending requests
router.get('/:userId', async (req, res) => {
  const { userId } = req.params
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      requester:profiles!friendships_requester_id_fkey(id, full_name, avatar_url, hall, level, is_online),
      receiver:profiles!friendships_receiver_id_fkey(id, full_name, avatar_url, hall, level, is_online)
    `)
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json(data || [])
})

// POST /api/friends/request  — send friend request
router.post('/request', async (req, res) => {
  const { requester_id, receiver_id } = req.body
  if (!requester_id || !receiver_id) return res.status(400).json({ error: 'requester_id and receiver_id required' })
  if (requester_id === receiver_id) return res.status(400).json({ error: 'Cannot friend yourself' })

  // Check existing
  const { data: existing } = await supabase.from('friendships')
    .select('id, status')
    .or(`and(requester_id.eq.${requester_id},receiver_id.eq.${receiver_id}),and(requester_id.eq.${receiver_id},receiver_id.eq.${requester_id})`)
    .maybeSingle()

  if (existing) return res.status(409).json({ error: 'Request already exists', status: existing.status })

  const { data, error } = await supabase.from('friendships')
    .insert({ requester_id, receiver_id, status: 'pending' })
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// PATCH /api/friends/:id/accept
router.patch('/:id/accept', async (req, res) => {
  const { data, error } = await supabase.from('friendships')
    .update({ status: 'accepted' })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// DELETE /api/friends/:id  — decline or unfriend
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('friendships').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Removed' })
})

export default router
