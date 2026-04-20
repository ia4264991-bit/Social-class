import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })

import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profiles.js'
import postRoutes from './routes/posts.js'
import reactionRoutes from './routes/reactions.js'
import commentRoutes from './routes/comments.js'
import messageRoutes from './routes/messages.js'
import marketplaceRoutes from './routes/marketplace.js'
import noticeRoutes from './routes/notices.js'
import slideRoutes from './routes/slides.js'

const app = express()

const allowedOrigins = [
  "http://localhost:5173",
  "https://social-class-rkuk.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: " + origin));
  },
  credentials: true
}));
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/reactions', reactionRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/notices', noticeRoutes)
app.use('/api/slides', slideRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Server error' })
})
console.log("POSTS ROUTE FILE LOADED");

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Roomio server running on port ${PORT}`))
