# Manochitta Sathi

Manochitta Sathi is a full-stack mental wellbeing platform with a Django REST backend and a Next.js frontend.

## Repository Structure

- `backend/` Django REST API
- `frontend/` Next.js application

## Core Product Areas

- JWT authentication with `user`, `therapist`, and `admin` roles
- User profile and mood tracking
- Therapist directory, application flow, profile, availability, and appointments
- Resource library and admin content management
- Notifications and feedback
- Basic in-app communications between users and therapists

## Local Setup

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_sample_data
.\venv\Scripts\python.exe manage.py runserver
```

Backend defaults to SQLite when `DB_ENGINE` is not set. This project is configured for Oracle Database through `DB_ENGINE=oracle11_backend`; Oracle connection settings are documented in [backend/.env.example](/c:/Users/sahil/Downloads/manochitta-sathi/backend/.env.example).

### 2. Frontend

```powershell
cd frontend
copy .env.example .env.local
pnpm install
pnpm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local`. Example:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Set `GOOGLE_CLIENT_ID` in `backend/.env` to the same web client ID:

```env
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REFRESH_TOKEN=your-google-oauth-refresh-token
GOOGLE_CALENDAR_ID=primary
GOOGLE_MEET_ORGANIZER_EMAIL=your-google-workspace-or-calendar-owner@example.com
```

## Development URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://127.0.0.1:8000/api/v1`
- API schema: `http://127.0.0.1:8000/api/schema/`
- Health check: `http://127.0.0.1:8000/health/`

## Google Sign-In Troubleshooting

- The same Google Web client ID must be set in both `frontend/.env.local` and `backend/.env`.
- After changing env values or installing backend dependencies, restart both servers.
- The backend requires `google-auth`, so run `pip install -r requirements.txt` inside `backend/venv`.
- Google Meet links are created only after successful payment verification, not when therapists create availability slots.
- Ensure backend migrations are applied, including the `accounts` Google auth migration:

```powershell
cd backend
.\venv\Scripts\python.exe manage.py migrate
```
- In Google Cloud Console, configure the web client with these Authorized JavaScript origins:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`

## Testing

### Backend

```powershell
cd backend
.\venv\Scripts\python.exe manage.py test
```

### Frontend

```powershell
cd frontend
pnpm run test
```

### End-to-End

Start backend and frontend locally first, then run:

```powershell
cd frontend
pnpm run test:e2e
```

The Playwright suite assumes:
- frontend at `http://127.0.0.1:3000`
- backend API at `http://127.0.0.1:8000/api/v1`
- seeded sample accounts from `manage.py seed_sample_data`

Frontend tests are lightweight integration tests using Vitest and Testing Library. They cover:

- login flow
- protected-route guard behavior
- therapist booking flow
- mood submission flow
- admin therapist review flow
- feedback submission flow

## Deployment Notes

- Configure `NEXT_PUBLIC_API_URL` to the deployed backend API base URL.
- Configure Google sign-in with a Web application OAuth client.
- Local Google Identity Services settings:
  - Authorized JavaScript origins: `http://localhost:3000`, `http://127.0.0.1:3000`
  - Redirect URIs are not required for the frontend popup callback flow used here.
- Set Django security and host settings from [backend/.env.example](/c:/Users/sahil/Downloads/manochitta-sathi/backend/.env.example) for production.
- Replace console email backend with a real email provider before deployment.
- Review JWT, CORS, HTTPS, and cookie settings in [backend/config/settings.py](/c:/Users/sahil/Downloads/manochitta-sathi/backend/config/settings.py).

## Current Scope

The project is close to MVP. Some advanced therapist features such as earnings reporting and rich client management are intentionally disabled because the backend does not yet support them.
