# Dynamic CRM Platform

A **metadata-driven, multi-tenant CRM** similar in architecture to Zoho CRM / HubSpot. End users configure modules, fields, pipelines, dashboards, and automations without coding.

## Architecture

- **Backend**: Node.js, Express, TypeScript, Prisma, MySQL
- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS, ShadCN-style UI, Zustand, React Hook Form
- **Data**: No hardcoded modules. All entities are defined in `Module` and `Field` metadata; record data is stored in EAV-style `Record` + `RecordValue` tables.
- **Redis**: Optional for caching and BullMQ job queues (background jobs, automations).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Prerequisites

- Node.js 20+
- MySQL 8+
- Redis (optional, for cache and background jobs)
- npm or pnpm

## Quick start (local)

### 1. Database

Create a MySQL database and set its URL:

```bash
# Example: local MySQL
mysql -u root -e "CREATE DATABASE crm_db; CREATE USER 'crm'@'localhost' IDENTIFIED BY 'your_password'; GRANT ALL ON crm_db.* TO 'crm'@'localhost';"
export DATABASE_URL="mysql://crm:your_password@localhost:3306/crm_db"
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET
npm install
npx prisma generate
npx prisma db push
npm run db:seed   # optional: creates tenant "Acme Corp", user admin@acme.com / password123
npm run dev
```

Backend runs at **http://localhost:4000**.

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**.

### 4. First login

- **Register**: Create a new organization (tenant) and user. After registration you’re logged in; note your **Tenant ID** in **Settings** for future logins.
- **Seed user**: If you ran `npm run db:seed`, get the tenant ID from the database (`SELECT id FROM Tenant WHERE name = 'Acme Corp';`) and sign in with email `admin@acme.com`, password `password123`, and that tenant ID.

## Project structure

```
crm-builder/
├── docs/
│   └── ARCHITECTURE.md       # System design
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Full schema (MySQL: tenants, users, modules, fields, records EAV, pipelines, tasks, automations, dashboards)
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── middleware/       # auth, tenant, errorHandler
│       ├── modules/         # auth, modules, fields, records, pipelines, tasks, automations, dashboards
│       ├── prisma/
│       └── index.ts
├── frontend/
│   └── src/
│       ├── app/              # App Router: login, dashboard, modules, records, pipelines, automations, settings
│       ├── components/      # layout (Sidebar, Header), ui, forms (DynamicField)
│       ├── lib/             # api client, utils
│       └── store/           # auth (Zustand)
└── README.md
```

## API overview

| Area        | Endpoints |
|------------|-----------|
| Auth       | `POST /auth/register`, `POST /auth/login` |
| Modules    | `GET/POST /modules`, `GET/PUT/DELETE /modules/:id` |
| Fields     | `GET/POST /modules/:moduleId/fields`, `PUT/DELETE /modules/fields/:id` |
| Records    | `POST /records`, `GET /records/:moduleId`, `GET /records/detail/:id`, `PUT/DELETE /records/:id`, `PATCH /records/:id/stage` |
| Pipelines  | `GET/POST /pipelines`, `POST /pipelines/pipeline-stages` |
| Tasks      | `GET/POST /tasks`, `PATCH /tasks/:id` |
| Automations| `GET/POST /automations`, `GET/PUT/DELETE /automations/:id` |
| Dashboards | `GET/POST /dashboards`, `GET /dashboards/:id`, `POST /dashboards/widgets`, `PATCH/DELETE /dashboards/widgets/:id` |

All protected routes require `Authorization: Bearer <token>` and are tenant-scoped.

## Automation engine

- **Triggers**: `record_created`, `record_updated`, `stage_changed`, `task_overdue`
- **Conditions**: JSON array of `{ field, operator, value }` (e.g. `eq`, `contains`, `gt`)
- **Actions**: `create_task`, `send_email`, `send_webhook`, `update_field`

Automations are evaluated when records are created/updated and when a record’s pipeline stage changes. Extend by adding trigger/action handlers in `backend/src/modules/automations/automation-engine.ts`.

## Security

- JWT authentication; tenant ID from token
- Tenant isolation on all queries
- Input validation with Zod
- Rate limiting on API
- Centralized error handling

## SaaS placeholders

The schema and docs include placeholders for:

- Subscription plans (`Tenant.plan`)
- Billing integration
- Usage limits
- API tokens
- Audit logs

## License

MIT.
