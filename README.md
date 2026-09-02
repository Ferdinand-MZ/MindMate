
# 🧠 MindMate

**Teman AI untuk kesehatan mental remaja dan mahasiswa Indonesia**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-4-green?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.5_Flash-blue?logo=google)](https://deepmind.google/gemini)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)


## Tentang MindMate

MindMate adalah aplikasi web kesehatan mental yang dirancang khusus untuk remaja dan mahasiswa Indonesia. Dibangun dengan pendekatan empati-pertama : bukan platform terapi klinis, melainkan teman digital yang mendengarkan, membantu refleksi diri, dan mendorong kebiasaan positif secara konsisten.

**Prinsip utama:**
- Privasi adalah default, bukan opsi
- AI sebagai pendamping, bukan pengganti profesional
- Konten krisis ditangani dengan serius dan diarahkan ke sumber yang tepat

---

## Fitur

| Fitur | Deskripsi |
|---|---|
| 💬 **AI Chat** | Percakapan empatik dengan Gemini 2.5 Flash, analisa sentimen otomatis |
| 📓 **Jurnal Harian** | Prompt AI kontekstual, kalender entri, analisa mood opt-in |
| 📊 **Mood Tracker** | Log mood harian, visualisasi pola mingguan |
| 🏆 **Streak System** | Check-in harian, gamifikasi konsistensi |
| 👥 **Papan Komunitas** | Berbagi anonim, hanya reaksi (tanpa komentar), filter krisis otomatis |
| 🧘 **Wellness Hub** | Breathing games, mini-games kecemasan, aktivitas fisik |
| 💡 **CBT Insights** | Form refleksi berbasis Cognitive Behavioral Therapy |
| 🚨 **Crisis Modal** | Deteksi konten krisis real-time → redirect ke 119 ext 8 |
| 📈 **Progress Report** | Laporan bulanan otomatis dari data mood + aktivitas |

---

## System Architecture

<img width="800" alt="MindMate System Architecture" src="https://github.com/user-attachments/assets/ddff8755-8a22-4374-869b-049788b143d1" />

---

## Tech Stack

### Frontend (`/frontend`)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Animasi:** Framer Motion
- **State:** React Context (SessionContext)
- **Auth guard:** Next.js Edge Middleware + cookie sync

### Backend (`/backend`)
- **Runtime:** Node.js + Express 4
- **Language:** TypeScript
- **Database:** PostgreSQL (raw `pg`, no ORM)
- **AI:** Google Gemini 2.5 Flash (`@google/genai`)
- **Background jobs:** Inngest
- **Security:** Helmet, bcryptjs, JWT, CORS whitelist
- **Logging:** Custom Winston logger

---

## Struktur Proyek

```
mindmate/
├── frontend/                   # Next.js 15 App Router
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── dashboard/          # Main AI chat interface
│   │   ├── wellness/           # Wellness hub (protected)
│   │   ├── journal/            # Jurnal harian (protected)
│   │   ├── community/          # Papan komunitas (protected)
│   │   ├── therapy/[sessionId] # Sesi terapi
│   │   └── api/                # Next.js API proxy routes
│   ├── components/
│   │   ├── community/          # CommunityBoard widget + page
│   │   ├── crisis/             # CrisisModal + SOSWrapper
│   │   ├── games/              # Breathing, forest, ocean games
│   │   ├── insights/           # CBT form, insights card
│   │   ├── journal/            # GuidedJournalPrompt widget
│   │   ├── mood/               # MoodTracker, MoodPatternInsights
│   │   └── streak/             # StreakCounter
│   ├── lib/
│   │   ├── api/                # API client functions
│   │   ├── auth-cookie.ts      # Cookie sync helper (middleware ↔ client)
│   │   └── contexts/
│   │       └── session-context.tsx
│   └── middleware.ts            # Edge middleware : route protection
│
└── backend/                    # Express API server
    └── src/
        ├── controllers/        # Business logic
        │   ├── authController.ts
        │   ├── chat.ts
        │   ├── journalController.ts
        │   ├── communityController.ts
        │   ├── moodController.ts
        │   ├── moodPatternController.ts
        │   ├── progressController.ts
        │   └── streakController.ts
        ├── models/             # SQL query modules (parameterized pg queries)
        │   ├── User.ts
        │   ├── ChatSession.ts
        │   ├── Journal.ts
        │   ├── CommunityPost.ts
        │   ├── Mood.ts
        │   ├── Streak.ts
        │   └── Insight.ts
        ├── routes/             # Express routers
        ├── middleware/         # auth.ts, errorHandler.ts
        ├── inngest/            # Background AI jobs
        ├── config/             # env.ts : fail-closed env var validation
        ├── db/                 # migrate.ts : applies db/schema.sql
        └── utils/              # db.ts (pg Pool), logger.ts

    db/
    └── schema.sql              # Postgres schema (tables, indexes, triggers)
```

---

## Memulai

### Prasyarat

- Node.js ≥ 18
- pnpm ≥ 8
- Docker (untuk PostgreSQL lokal) : atau instance Postgres lain (Supabase/RDS/Neon)
- Google AI API key (Gemini)

### 1. Clone & Install

```bash
git clone https://github.com/username/mindmate.git
cd mindmate

# Install frontend dependencies
cd frontend && pnpm install

# Install backend dependencies
cd ../backend && pnpm install
```

### 2. Environment Variables

**Backend** : buat file `backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://mindmate:mindmate@localhost:5432/mindmate
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
ANON_SECRET=random-string-for-anon-hashing
ALLOWED_ORIGINS=http://localhost:3000
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

**Frontend** : buat file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start PostgreSQL

```bash
cd backend
docker compose up -d   # starts Postgres and auto-applies db/schema.sql
```

Sudah punya Postgres sendiri (Supabase/RDS/Neon)? Skip Docker dan jalankan migrasi manual:

```bash
pnpm db:migrate
```

### 4. Jalankan Development Server

```bash
# Terminal 1 : Backend
cd backend
pnpm dev

# Terminal 2 : Frontend
cd frontend
pnpm dev
```

Akses di `http://localhost:3000`

---

## Environment Variables Lengkap

### Backend

| Variable | Wajib | Deskripsi |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key untuk signing JWT |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `ANON_SECRET` | ✅ | Salt untuk hashing anonymous ID komunitas |
| `ALLOWED_ORIGINS` | ✅ | CORS whitelist, pisahkan dengan koma |
| `PORT` | ❌ | Default: `3001` |
| `INNGEST_EVENT_KEY` | ❌ | Untuk background AI jobs |
| `INNGEST_SIGNING_KEY` | ❌ | Untuk verifikasi Inngest webhook |

### Frontend

| Variable | Wajib | Deskripsi |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | URL backend API |

---

## Keamanan

### Proteksi Rute (Auth Guard)
Halaman `/wellness`, `/journal`, `/community`, dan `/dashboard` dilindungi dua lapis:

1. **Edge Middleware** (`middleware.ts`) : cek cookie `token` sebelum halaman dirender. Redirect ke `/login?redirect=<tujuan>` jika belum login.
2. **Client guard** : `useSession()` hook sebagai lapisan kedua di setiap halaman protected.

Token JWT disimpan di `localStorage` (untuk API calls) dan disinkronkan ke cookie `SameSite=Lax` (untuk middleware). Cookie di-clear saat logout.

### Komunitas : Anonimitas & Keamanan Konten
- Tidak ada `userId` yang tersimpan di dokumen post : hanya `anonId` (HMAC-SHA256 dari userId, satu arah)
- Filter regex untuk konten krisis/self-harm → return pesan redirect ke 119 ext 8
- Rate limit: maksimal 5 postingan per hari per user
- Tidak ada fitur komentar : hanya 5 tipe reaksi emoji

### AI Journal Analysis
- Opt-in: user harus klik tombol "Analisa dengan AI" secara eksplisit
- Hasil analisa di-cache di database : Gemini tidak dipanggil dua kali untuk entri yang sama
- Prompt dirancang untuk menghasilkan refleksi empatik, bukan diagnosis atau saran klinis

---

## API Endpoints

### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /api/auth/me
```

### Chat
```
GET    /chat/sessions
POST   /chat/sessions
GET    /chat/sessions/:id/history
POST   /chat/sessions/:id/messages
DELETE /chat/sessions/:id
```

### Journal
```
GET    /api/journal/prompt
POST   /api/journal/entry
GET    /api/journal/history
POST   /api/journal/analyze      ← opt-in AI analysis
```

### Community
```
GET    /api/community/posts
POST   /api/community/posts
POST   /api/community/posts/:id/react
DELETE /api/community/posts/:id
```

### Mood & Wellness
```
POST   /api/mood
GET    /api/mood-patterns/weekly
GET    /api/streak
POST   /api/streak/checkin
GET    /api/progress
GET    /api/activity
POST   /api/activity
GET    /api/insight
POST   /api/insight
```

---

## Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit dengan pesan yang jelas: `git commit -m "feat: tambah fitur X"`
4. Push dan buat Pull Request

---

## Lisensi

MIT License : lihat [LICENSE](./LICENSE) untuk detail.
