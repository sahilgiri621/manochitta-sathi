# Manochitta Sathi Backend

Production-oriented Django REST backend for a Nepal-focused mental wellbeing platform.

## App structure

- `apps/accounts`: custom user model, JWT auth, email verification, password reset
- `apps/accounts`: also includes admin user-management endpoints
- `apps/profiles`: end-user profile data
- `apps/therapists`: therapist profile, approval, availability
- `apps/appointments`: booking lifecycle and session events
- `apps/mood`: daily mood tracking
- `apps/resources`: categories and educational resources
- `apps/notifications`: in-app notifications
- `apps/feedback`: post-session feedback and ratings
- `apps/payments`: Khalti payment initiation and verification
- `apps/auditlog`: admin audit trail
- `apps/communications`: secure chat-ready conversation scaffold
- `apps/common`: shared pagination, responses, permissions, seed command

## Requirements

- Python 3.12+
- Oracle Database / Oracle XE
- Oracle client libraries available to `oracledb` when using thick-client mode

## Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `.env` with your Oracle credentials. The default example uses `DB_ENGINE=oracle11_backend`, `DB_NAME=xe`, and Oracle network settings from `backend/oracle_network`.

For Google sign-in, also set:

```env
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

This must match `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the frontend.

For Google Calendar + Google Meet session creation after successful payment, also set:

```env
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REFRESH_TOKEN=your-google-oauth-refresh-token
GOOGLE_CALENDAR_ID=primary
GOOGLE_MEET_ORGANIZER_EMAIL=your-google-workspace-or-calendar-owner@example.com
```

These values are read in `backend/config/settings.py` and used by `backend/apps/payments/google_calendar_service.py`.

For the AI chat endpoint, also set:

```env
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-3.5-turbo
```

For Khalti sandbox payments, also set:

```env
KHALTI_SECRET_KEY=your-khalti-sandbox-secret-key
KHALTI_PUBLIC_KEY=your-khalti-sandbox-public-key
KHALTI_BASE_URL=https://dev.khalti.com/api/v2
KHALTI_WEBSITE_URL=http://localhost:3000
KHALTI_RETURN_URL=http://localhost:3000/dashboard/payments/khalti/return
```

Use Khalti's sandbox merchant keys only during local testing. Do not place the secret key in frontend code.

## Run locally

```powershell
cd backend
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_sample_data
.\venv\Scripts\python.exe manage.py runserver
```

Useful URLs:
- API root modules: `/api/v1/...`
- Schema: `/api/schema/`
- Health check: `/health/`
- Admin: `/admin/`

## Tests

```powershell
cd backend
.\venv\Scripts\python.exe manage.py test
```

## Khalti Sandbox Flow

1. Create or log in to a Khalti sandbox merchant account.
2. Add the sandbox keys to `backend/.env`.
3. Run backend migrations so the appointment payment fields exist.
4. Book an appointment as a normal user.
5. Open the user appointments dashboard and choose `Pay with Khalti`.
6. The backend initiates the payment, stores the `pidx`, and redirects the user to Khalti.
7. After Khalti redirects back to `KHALTI_RETURN_URL`, the frontend calls the backend verify endpoint.
8. The backend uses Khalti lookup and only then marks the appointment as `paid`.
9. After payment is verified, the backend creates a Google Calendar event with Google Meet conference data, saves the event id and Meet link on the appointment, and notifies both sides.

The endpoint that flips the appointment to paid is `/api/v1/payments/khalti/verify/` after a successful Khalti lookup result.

## Google Sign-In Troubleshooting

- Confirm `GOOGLE_CLIENT_ID` is set in `backend/.env` and matches the frontend client ID.
- Install dependencies into the backend virtualenv after pulling auth changes:

```powershell
cd backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```
- Apply migrations before testing Google sign-in:

```powershell
cd backend
.\venv\Scripts\python.exe manage.py migrate
```
- Restart the Django server after changing env values or installing packages.

## Sample accounts after seeding

- Admin: `admin@manochittasathi.com` / `Admin@12345`
- Therapist: `therapist@manochittasathi.com` / `Therapist@123`
- User: `user@manochittasathi.com` / `User@12345`

## Notes

- Local development falls back to SQLite if `DB_ENGINE` is not set. This project is configured to use Oracle Database through the custom `oracle11_backend` engine.
- Email verification and password reset emails use the configured Django email backend.
- JWT refresh token blacklisting is enabled for logout flows.
- Password set/reset flows use Django password validators.
- Appointment acceptance creates a conversation scaffold for future chat integration.
- Google sign-in verifies Google ID tokens server-side and then returns the same app JWT pair used by password login.

## Recommended commit plan

1. `chore: set up production-ready Django API foundation`
2. `feat: add domain models and migrations for mental wellbeing workflows`
3. `feat: implement auth, therapist, appointment, mood, resource, feedback and notification APIs`
4. `test: cover critical auth, appointment and mood flows`
5. `docs: add setup guide, env template and API documentation`
