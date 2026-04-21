import { Router } from 'express'
import { supabase } from '../supabase.js'

const router = Router()

// GET /api/messages/conversations/:userId
// MUST be before /:conversationId to avoid conflict
router.get('/conversations/:userId', async (req, res) => {
  const { userId } = req.params
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_one_profile:profiles!conversations_participant_one_fkey(id, full_name, avatar_url, hall, room_number, level, is_online),
      participant_two_profile:profiles!conversations_participant_two_fkey(id, full_name, avatar_url, hall, room_number, level, is_online)
    `)
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('GET /messages/conversations', error.message)
    return res.status(400).json({ error: error.message })
  }
  res.json(data || [])
})

// PATCH /api/messages/read/:conversationId
// MUST be before /:conversationId to avoid conflict
router.patch('/read/:conversationId', async (req, res) => {
  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'user_id required' })

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', req.params.conversationId)
    .eq('receiver_id', user_id)
    .eq('is_read', false)

  if (error) {
    console.error('PATCH /messages/read', error.message)
    return res.status(400).json({ error: error.message })
  }
  res.json({ message: 'Marked as read' })
})

// GET /api/messages/:conversationId
router.get('/:conversationId', async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, hall)')
    .eq('conversation_id', req.params.conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('GET /messages/:id', error.message)
    return res.status(400).json({ error: error.message })
  }
  res.json(data || [])
})

// POST /api/messages
router.post('/', async (req, res) => {
  const { conversation_id, sender_id, receiver_id, content, image_url, video_url } = req.body

  if (!sender_id || !receiver_id) {
    return res.status(400).json({ error: 'sender_id and receiver_id are required' })
  }
  if (!content && !image_url && !video_url) {
    return res.status(400).json({ error: 'Message must have content, image, or video' })
  }

  // Find or create conversation
  let convId = conversation_id
  if (!convId) {
    const p1 = sender_id < receiver_id ? sender_id : receiver_id
    const p2 = sender_id < receiver_id ? receiver_id : sender_id

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_one', p1)
      .eq('participant_two', p2)
      .maybeSingle()   // use maybeSingle — no error if not found

    if (existing) {
      convId = existing.id
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ participant_one: p1, participant_two: p2 })
        .select('id')
        .single()
      if (convErr) {
        console.error('Create conversation error:', convErr.message)
        return res.status(400).json({ error: convErr.message })
      }
      convId = newConv.id
    }
  }

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: convId,
      sender_id,
      receiver_id,
      content: content || null,
      image_url: image_url || null,
      video_url: video_url || null,
    })
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, hall)')
    .single()

  if (msgErr) {
    console.error('Insert message error:', msgErr.message)
    return res.status(400).json({ error: msgErr.message })
  }

  // Update conversation last message (fire and forget)
  supabase.from('conversations').update({
    last_message: content || (image_url ? '📷 Photo' : '🎬 Video'),
    last_message_at: new Date().toISOString(),
  }).eq('id', convId).then(({ error }) => { if (error) console.error('Update conv error:', error.message) })

  res.json({ ...msg, conversation_id: convId })
})

export default router
