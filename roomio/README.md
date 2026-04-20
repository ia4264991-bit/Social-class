# 🏠 Roomio UCC — Setup Guide

A Facebook-style social platform for University of Cape Coast students.
Built with React.js, Express.js, and Supabase.

---

## 🗂️ Project Structure

```
roomio/
├── client/          → React frontend (Vite + Tailwind)
├── server/          → Express backend
├── supabase_schema.sql  → Run this in Supabase SQL editor
├── .env             → Server environment variables (YOU FILL THIS)
└── client/.env      → Client environment variables (YOU FILL THIS)
```

---

## 🔧 Step 1 — Create Your Supabase Project

1. Go to **https://supabase.com** and sign in
2. Click **"New Project"**
3. Name it `roomio-ucc`, choose a strong database password, select a region close to Ghana (e.g. Europe West)
4. Wait for the project to be ready (~1 minute)

---

## 🔑 Step 2 — Fill In Your .env Files

### Server `.env` (root of project)
Go to: **Supabase Dashboard → Settings → API**

```
SUPABASE_URL=         ← paste "Project URL" here
SUPABASE_ANON_KEY=    ← paste "anon public" key here
SUPABASE_SERVICE_KEY= ← paste "service_role" key here (keep secret!)
PORT=4000
```

### Client `client/.env`
Same Supabase keys, different variable names:

```
VITE_SUPABASE_URL=        ← same Project URL
VITE_SUPABASE_ANON_KEY=   ← same anon public key
VITE_API_URL=http://localhost:4000
```

---

## 🗄️ Step 3 — Set Up the Database

1. In Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase_schema.sql` from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **"Run"** (green button)
6. You should see "Success" — all tables are created with security policies

---

## 🪣 Step 4 — Create Storage Bucket

1. In Supabase Dashboard, click **"Storage"** in the left sidebar
2. Click **"New bucket"**
3. Name it exactly: `roomio`
4. Check **"Public bucket"** ✅
5. Click **"Create bucket"**

This bucket stores profile photos, post images, and marketplace listing photos.

---

## 📦 Step 5 — Install Dependencies

Open your terminal:

```bash
# Install server dependencies
cd roomio/server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## 🚀 Step 6 — Run the App

Open **two terminal tabs**:

**Terminal 1 — Start the server:**
```bash
cd roomio/server
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 — Start the client:**
```bash
cd roomio/client
npm run dev
# App opens at http://localhost:5173
```

---

## 👤 Step 7 — Create Your First Account

1. Open **http://localhost:5173** in your browser
2. Click **"Create an account"**
3. Fill in:
   - Your full name
   - Your UCC email (e.g. `kofi@st.ucc.edu.gh`)
   - A password (min 6 characters)
   - Your hall (e.g. Adehye Hall)
   - Your room number (e.g. 14B)
   - Your department and level
4. Click **"Create Account"**
5. You're in! 🎉

---

## 🛠️ Supabase Auth Settings (Important!)

Go to **Supabase → Authentication → Settings**:

1. Under **"Email"**, disable **"Confirm email"** for development
   (so users don't need to verify email to log in during testing)
2. Under **"URL Configuration"**, set:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`

---

## 📱 Features Available

| Feature | Route | Description |
|---------|-------|-------------|
| 🏠 Feed | `/feed` | Posts from all UCC students or your hall |
| 💬 Chat | `/chat` | Real-time DMs with hallmates |
| 🛍️ Store | `/marketplace` | Buy & sell within campus |
| 📣 Notices | `/notices` | Hall and SRC announcements |
| 🏘️ Hall Page | `/hall/Adehye Hall` | Hall-specific feed, members, notices |
| 👤 Profile | `/profile/:id` | Student profile with posts and store |

---

## 🚀 Deploy to Production

### Deploy Server (Railway or Render)
1. Push code to GitHub
2. Connect to **Railway** (https://railway.app) or **Render** (https://render.com)
3. Add environment variables (same as your `.env` file)
4. Deploy the `server/` folder

### Deploy Client (Vercel)
1. Push code to GitHub
2. Connect to **Vercel** (https://vercel.com)
3. Set root directory to `client/`
4. Add environment variables from `client/.env`
5. Set `VITE_API_URL` to your deployed server URL
6. Deploy!

---

## ❓ Common Issues

**"Invalid API key"** → Double-check your `.env` files. No extra spaces around the `=` sign.

**"relation does not exist"** → The SQL schema hasn't been run yet. Go to Step 3.

**Messages not updating in real time** → Make sure you ran the `alter publication supabase_realtime` lines in the SQL editor.

**Images not uploading** → Make sure the `roomio` storage bucket exists and is set to Public (Step 4).

**Login works but profile doesn't load** → The profile insert might have failed during registration. Check Supabase → Table Editor → profiles to see if your row is there.

---

Built with 💚 for UCC students by Roomio.
