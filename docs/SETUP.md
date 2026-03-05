# Step-by-step setup

## 1. Clone and install

```bash
cd crm-builder
```

## 2. Database

Create a MySQL database and set the connection URL:

```bash
mysql -u root -e "CREATE DATABASE crm_db; CREATE USER 'crm'@'localhost' IDENTIFIED BY 'your_password'; GRANT ALL ON crm_db.* TO 'crm'@'localhost';"
# Use: mysql://crm:your_password@localhost:3306/crm_db
```

Set `DATABASE_URL` in `backend/.env` (copy from `backend/.env.example`).

## 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET (e.g. a long random string)
npm install
npx prisma generate
npx prisma db push
npm run db:seed    # optional: Acme Corp + admin@acme.com / password123
npm run dev
```

Server runs at **http://localhost:4000**. Health check: `GET http://localhost:4000/health`.

## 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

App runs at **http://localhost:3000**.

## 5. First use

1. Open **http://localhost:3000**. You’ll be redirected to **/dashboard** (then to **/login** if not authenticated).
2. **Register**: Click “Need an account? Register”. Enter organization name, your name, email, password. After submit you’re logged in.
3. **Tenant ID**: Go to **Settings**. Copy the “Tenant ID” — you’ll need it to sign in again from another device or browser.
4. **Login** (later): Enter Tenant ID, email, password.

If you ran the seed:

- Tenant ID: from DB `SELECT id FROM Tenant WHERE name = 'Acme Corp';`
- Email: `admin@acme.com`, Password: `password123`

## 6. Create a module and records

1. **Modules** → **New module** → e.g. name “Leads”, slug “leads” → Create.
2. Open the new module → **Add field** (e.g. “Name”, key `name`, type text, required).
3. **View records** → **New record** → fill fields → Create.
4. **Pipelines** → create a pipeline for the “Leads” module, add stages, then open the pipeline to see the Kanban view and move records between stages.

