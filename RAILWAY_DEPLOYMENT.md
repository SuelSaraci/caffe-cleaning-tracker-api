# Railway Deployment Guide - Caffe Tracker API

Deploy the Node.js API and PostgreSQL to Railway (same pattern as code-interview-app).

## Prerequisites

1. Railway account: https://railway.app
2. GitHub repository connected to Railway

## Step 1: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **New Project**
3. Select **Deploy from GitHub repo** → choose your caffe-tracker-app repo
4. Set **Root Directory** to `api` (so Railway builds from the `api` folder)

## Step 2: Add PostgreSQL

1. In the same project, click **+ New**
2. Select **Database** → **PostgreSQL**
3. Railway creates a PostgreSQL instance and provides `DATABASE_URL` automatically

## Step 3: Configure API Service

1. Select your API service (the one from GitHub)
2. Go to **Variables**
3. Add environment variables:

| Variable       | Value                              | Required |
|----------------|------------------------------------|----------|
| `DATABASE_URL` | (auto from PostgreSQL service)     | Yes      |
| `NODE_ENV`     | `production`                       | Yes      |
| `CORS_ORIGIN`  | Your frontend URL(s), comma-separated | Recommended |
| `PORT`         | (Railway sets this automatically)  | No       |

**Link PostgreSQL to API:** In Variables, click **+ Add Variable Reference** and select `DATABASE_URL` from the PostgreSQL service.

## Step 4: Deploy

1. Railway auto-deploys on push to the main branch
2. Migrations and seed run on startup (if tables don't exist / DB is empty)
3. After deploy, copy the generated public URL (e.g. `https://caffe-tracker-api-xxx.up.railway.app`)

## Step 5: Frontend Configuration

In your **client** Railway service (or `.env` for local dev), set:

```bash
VITE_API_URL=https://your-api-url.up.railway.app
```

Rebuild the frontend so it picks up the new `VITE_API_URL`.

## Environment Variables Summary

### API (this service)

```bash
DATABASE_URL=postgresql://...   # From Railway PostgreSQL
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.railway.app
```

### Client (frontend)

```bash
VITE_API_URL=https://your-api.up.railway.app
```

## Health Check

- `GET /health` → `{ "status": "ok", "timestamp": "..." }`

## API Endpoints

- `GET /api/locations` - List all locations
- `GET /api/locations/:id` - Get one location
- `POST /api/locations` - Create location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location
- `POST /api/locations/reset` - Reset to seed data

## Troubleshooting

- **502 Bad Gateway**: Check API logs; often DB connection or missing `DATABASE_URL`
- **CORS errors**: Ensure `CORS_ORIGIN` includes your frontend URL
- **No locations**: Seeding runs only when the table is empty; use `POST /api/locations/reset` to re-seed
