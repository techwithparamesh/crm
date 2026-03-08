# Code overview & how to run locally (Node.js, MySQL, Redis)

## Code analysis

### What this app is
- **Metadata-driven, multi-tenant CRM** (like Zoho/HubSpot). No hardcoded “Leads” or “Deals”; you define modules, fields, pipelines, and automations in the UI.
- **Backend**: Express + TypeScript, Prisma (MySQL), optional Redis (cache + BullMQ jobs).
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind, ShadCN-style UI, Zustand, React Hook Form.

### Structure
- **`backend/`**  
  - Entry: `src/index.ts` — Express app, CORS, rate limit, routes (auth, modules, fields, records, pipelines, tasks, automations, dashboards, etc.).  
  - Uses `backend/prisma/schema.prisma` (MySQL).  
  - Optional worker: `src/workers/worker.ts` (BullMQ; needs Redis).
- **`frontend/`**  
  - Next.js App Router under `src/app/`: login, dashboard, modules, records, pipelines, automations, settings, etc.  
  - Calls backend at `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000`).

### Config
- **Backend**: `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` (optional), `PORT=4000`.
- **Frontend**: `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:4000`.

---

## How to run locally (Node.js + MySQL + Redis)

### 1. MySQL
- Service **MySQL80** (or your instance) must be **running** (e.g. via `services.msc`).
- DB and user already created: `crm_db`, user `crm`, password in `backend/.env` (`DATABASE_URL`).

### 2. Redis (optional but recommended)
- Start Redis (e.g. Windows service or `redis-server`).  
- `backend/.env` should have: `REDIS_URL=redis://localhost:6379`.

### 3. Backend (first terminal)
```powershell
cd C:\Users\varra\OneDrive\Desktop\crm-builder\backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```
- Backend: **http://localhost:4000**  
- Health: **http://localhost:4000/health**

### 4. Frontend (second terminal)
```powershell
cd C:\Users\varra\OneDrive\Desktop\crm-builder\frontend
npm install
npm run dev
```
- Frontend: **http://localhost:3000**

### 5. Optional: background job worker (third terminal, only if using Redis)
```powershell
cd C:\Users\varra\OneDrive\Desktop\crm-builder\backend
npm run dev:worker
```

### 6. Use the app
- Open **http://localhost:3000**.
- **Seed login**: Tenant ID from DB `SELECT id FROM Tenant WHERE name = 'Acme Corp';` → email `admin@acme.com`, password `password123`.
- Or **Register** and create a new organization.

---

## Scripts reference

| Where      | Script           | Purpose                          |
|-----------|------------------|----------------------------------|
| backend   | `npm run dev`    | Start API (tsx watch)            |
| backend   | `npm run dev:worker` | Start BullMQ worker (needs Redis) |
| backend   | `npm run build`  | Compile to `dist/`               |
| backend   | `npm run start`  | Run production `dist/index.js`  |
| backend   | `npx prisma db push` | Apply schema to MySQL        |
| backend   | `npm run db:seed`| Seed Acme Corp + admin user      |
| frontend  | `npm run dev`    | Next.js dev server               |
| frontend  | `npm run build`  | Production build                 |
| frontend  | `npm run start`  | Run production build             |
