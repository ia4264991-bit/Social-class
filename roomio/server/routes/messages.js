import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/messages/conversations/:userId  — all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  const { userId } = req.params
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_one_profile:profiles!conversations_participant_one_fkey(id, full_name, avatar_url, hall, room_number, department, level, is_online),
      participant_two_profile:profiles!conversations_participant_two_fkey(id, full_name, avatar_url, hall, room_number, department, level, is_online)
    `)
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order('last_message_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// GET /api/messages/:conversationId  — messages in a conversation
router.get('/:conversationId', async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, hall)')
    .eq('conversation_id', req.params.conversationId)
    .order('created_at', { ascending: true })
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// POST /api/messages  — send a message
router.post('/', async (req, res) => {
  const { conversation_id, sender_id, receiver_id, content, marketplace_item_id } = req.body

  // Find or create conversation
  let convId = conversation_id
  if (!convId) {
    const p1 = sender_id < receiver_id ? sender_id : receiver_id
    const p2 = sender_id < receiver_id ? receiver_id : sender_id

    let { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_one', p1)
      .eq('participant_two', p2)
      .single()

    if (!existing) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ participant_one: p1, participant_two: p2 })
        .select('id')
        .single()
      convId = newConv.id
    } else {
      convId = existing.id
    }
  }

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({ conversation_id: convId, sender_id, receiver_id, content, marketplace_item_id })
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, hall)')
    .single()
  if (msgErr) return res.status(400).json({ error: msgErr.message })

  await supabase
    .from('conversations')
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq('id', convId)

  res.json({ ...msg, conversation_id: convId })
})

// PATCH /api/messages/read/:conversationId  — mark messages as read
router.patch('/read/:conversationId', async (req, res) => {
  const { user_id } = req.body
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', req.params.conversationId)
    .eq('receiver_id', user_id)
    .eq('is_read', false)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Marked as read' })
})

export default router
