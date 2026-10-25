# Huza Admin Panel

Next.js 16 admin panel for managing the Huza marketplace.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local: API URL, and ADMIN_JWT_SECRET (must match the backend's JWT_SECRET)
npm run dev
```

**Admin panel runs on:** `http://localhost:3002`

Sign in with an admin account. Running the backend seed creates one (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, see `HWA_Backend/prisma/seed.ts`).

## Also See

- **[../HWA_Backend/DEVELOPER_GUIDE.md](../HWA_Backend/DEVELOPER_GUIDE.md)** — Backend setup and environment
- **[../HWA_Frontend/DEVELOPER_GUIDE.md](../HWA_Frontend/DEVELOPER_GUIDE.md)** — Frontend setup guide
