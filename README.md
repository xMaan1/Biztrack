# BizTrack — Setup & Run Guide

BizTrack is a multi-tenant business management platform with a **Next.js** frontend and a **FastAPI (Python)** backend backed by **PostgreSQL** (run via Docker).

---

## 1. Prerequisites

| Tool      | Version          | Notes                                      |
| --------- | ---------------- | ------------------------------------------ |
| Node.js   | 18+              | Required for the Next.js frontend          |
| npm       | 9+               | Ships with Node.js                         |
| Python    | 3.11+            | Required for the FastAPI backend           |
| Docker    | Desktop installed | Used to run PostgreSQL locally             |
| Git       | any              | To clone the repository                    |

> **Important:** The backend uses PostgreSQL-specific SQL features (JSONB etc.). SQLite is **not** supported.

---

## 2. Clone the repository

```bash
git clone https://github.com/sameerwork243-droid/biztrack.git
cd biztrack
```

The repository has two main folders:

```
biztrack/
├── backend/    # FastAPI application
└── frontend/   # Next.js application
```

---

## 3. Start PostgreSQL with Docker

1. Open **Docker Desktop** and wait until it is running.
2. Start the database container:

```bash
docker run --name biztrack-pg -d \
  -p 5434:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=biztrack \
  -v biztrack_pgdata:/var/lib/postgresql/data \
  postgres:15
```

> **Why port 5434?** The project is configured to use host port **5434** to avoid conflicts with any local PostgreSQL already running on 5432.

To stop / start the container later:

```bash
docker stop biztrack-pg
docker start biztrack-pg
```

To verify the container is running:

```bash
docker ps
```

---

## 4. Set up the backend (FastAPI)

### 4.1 Create a virtual environment

```bash
cd backend
python -m venv .venv
```

Activate it:

- **Windows (PowerShell):**
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **Windows (CMD):**
  ```cmd
  .venv\Scripts\activate.bat
  ```
- **macOS / Linux:**
  ```bash
  source .venv/bin/activate
  ```

### 4.2 Install dependencies

```bash
pip install -r requirements.txt
```

### 4.3 Configure environment variables

Copy the sample and fill in the values:

```bash
cp .env.example .env
```

Required variables:

```env
# Database (must match the Docker container from step 3)
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/biztrack

# Auth
JWT_SECRET_KEY=change-me-to-a-long-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# URLs
FRONTEND_URL=http://localhost:3000
INVOICE_SHARE_BASE_URL=http://localhost:8000
INVOICE_SHARE_EXPIRE_DAYS=30

# Payments (optional – used only for payment features)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_CURRENCY=USD
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

> Optional: file uploads to S3 require `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_ACCESS_KEY_ID`, and `S3_ENDPOINT_URL`. Without them, document uploads still work (saved locally under `backend/uploads/`) but customer photo uploads return 503.

### 4.4 Create tables & seed the database

With the Docker container running and `.env` set, seed the database:

```bash
python scripts/seed.py
```

This creates the tables (if missing) and seeds:

- **Plans:** Agency Plan, Starter, Professional, Enterprise, Workshop Master
- **Super admin:** `superadmin@system.com` / `SuperAdmin@123`

Useful flags:

```bash
python scripts/seed.py --force      # reset existing seed data
python scripts/seed.py --plans-only # only seed the plans
python scripts/seed.py --admin-only # only create the super admin
```

> **Note:** The local dev tenant (**Agency Workspace**, id `33ab5253-3bf1-4d50-a758-0304ad9b65bb`), its owner role (all modules) and the `agency@test.com` account were provisioned manually on the dev database, so they are not re-created by the seed script. If you need them on a fresh database, ask the maintainer for the provisioning script.

### 4.5 Start the backend

```bash
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

The API is now available at: **http://localhost:8000**

- Interactive docs (Swagger UI): http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 5. Set up the frontend (Next.js)

### 5.1 Install dependencies

```bash
cd frontend
npm install
```

### 5.2 Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5.3 Start the frontend

```bash
npm run dev
```

The app is now available at: **http://localhost:3000**

---

## 6. Login

Use the seeded credentials:

| Field    | Value            |
| -------- | ---------------- |
| Email    | `agency@test.com` |
| Password | `Test@123`        |

> The auth endpoints are rate limited — too many failed logins will return **429**.

---

## 7. Running everything at a glance

```powershell
# Terminal 1 – Database
docker start biztrack-pg

# Terminal 2 – Backend (from backend/)
.venv\Scripts\Activate.ps1
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000

# Terminal 3 – Frontend (from frontend/)
npm run dev
```

---

## 8. Troubleshooting

| Problem                          | Solution                                                              |
| -------------------------------- | --------------------------------------------------------------------- |
| `Connection refused` on DB       | Docker Desktop not running / container stopped → `docker start biztrack-pg` |
| Login returns 500                | You are on SQLite — must use PostgreSQL (see `DATABASE_URL`)          |
| 429 on login                     | Rate limited — wait a bit before retrying                             |
| `File upload service is not configured` (503) | S3 env vars missing — either configure S3 or use local document upload only |
| Port 8000/3000 already in use    | Change port with `--port` / edit frontend `NEXT_PUBLIC_API_URL`       |
| 403 on a module                  | Your role lacks permissions — the seeded **owner** role has all modules |

---

## 9. Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI, SQLAlchemy, Pydantic, JWT auth, role-based access control
- **Database:** PostgreSQL 15 (Docker)
- **Other:** PayPal/Stripe (optional), S3 (optional)
