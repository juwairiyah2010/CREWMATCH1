# CrewMatch — Local API server (Node + Express + MySQL)

This is a minimal demo API for the CrewMatch front-end. It stores user `profile` records in MySQL and provides a simple `/api/matches` endpoint.

## Quick start (local)

1. Create a MySQL database (or use the provided schema):

   - Run `mysql -u root -p` and paste the contents of `db/schema.sql`.

2. Copy `.env.example` to `.env` and fill in values (DB credentials, PORT)

3. Install dependencies and start server

```bash
cd server
npm install
npm start
```

4. Server will run at `http://localhost:3000` (or PORT from `.env`).

## Endpoints

- POST /api/profile — create or update profile (body JSON)
- GET /api/profile?email=someone@example.com — fetch profile by email
- GET /api/matches?email=someone@example.com — quick matches for a profile based on local profiles

## Notes
- This is intentionally lightweight (no auth). For production you'll want authentication and stricter validation.
- The DB schema stores `skills` and `traits` as JSON columns.
