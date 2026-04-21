import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes        from './routes/auth.js'
import profileRoutes     from './routes/profiles.js'
import postRoutes        from './routes/posts.js'
import reactionRoutes    from './routes/reactions.js'
import commentRoutes     from './routes/comments.js'
import messageRoutes     from './routes/messages.js'
import marketplaceRoutes from './routes/marketplace.js'
import noticeRoutes      from './routes/notices.js'
import slideRoutes       from './routes/slides.js'
import friendRoutes      from './routes/friends.js'
import settingsRoutes    from './routes/settings.js'

const app = express()

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app')
    ) return callback(null, true)
    console.warn('CORS blocked:', origin)
    callback(new Error(`CORS: ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))
app.options('*', cors())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Health ───────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  ts: new Date().toISOString(),
  supabase: !!process.env.SUPABASE_URL,
  brevo: !!process.env.BREVO_SMTP_USER,
}))

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/profiles',    profileRoutes)
app.use('/api/posts',       postRoutes)
app.use('/api/reactions',   reactionRoutes)
app.use('/api/comments',    commentRoutes)
app.use('/api/messages',    messageRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/notices',     noticeRoutes)
app.use('/api/slides',      slideRoutes)
app.use('/api/friends',     friendRoutes)
app.use('/api/settings',    settingsRoutes)

// ── Error handler ────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[${req.method}] ${req.path} →`, err.message)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Roomio server on port ${PORT}`)
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? '✅' : '❌ MISSING'}`)
  console.log(`   Brevo:    ${process.env.BREVO_SMTP_USER ? '✅' : '⚠️  Not configured — OTP emails will fail'}`)
})
