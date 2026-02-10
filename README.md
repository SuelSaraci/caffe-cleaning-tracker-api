# Caffe Tracker API

Node.js API for Coffee Work Tracker with PostgreSQL. Deployable to Railway.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` (or DB_* vars for local PostgreSQL)
3. Run migrations: `npm run migrate`
4. Seed: `npm run seed`
5. Start: `npm run dev` (dev) or `npm start` (prod)

## Railway Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/locations | List all locations |
| GET | /api/locations/:id | Get one location |
| POST | /api/locations | Create location |
| PUT | /api/locations/:id | Update location |
| DELETE | /api/locations/:id | Delete location |
| POST | /api/locations/reset | Reset to seed data |
