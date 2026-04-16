# Frontend

Next.js frontend for Manochitta Sathi.

## Requirements

- Node.js 20+
- pnpm

## Setup

```powershell
cd frontend
copy .env.example .env.local
pnpm install
pnpm run dev
```

Required environment variable:

```env
BACKEND_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

The frontend now proxies browser API calls through Next.js at `/api/backend/...`.
Set `BACKEND_API_URL` to the Django API root that Next.js should forward to.
`NEXT_PUBLIC_API_URL` remains as a fallback and for client-side diagnostics, but `BACKEND_API_URL` is the preferred setting.
Google sign-in also requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Maps

- Therapist clinic management uses `react-leaflet` and `leaflet`.
- No extra map API key is required because the app uses OpenStreetMap tiles.
- Leaflet CSS is imported globally from [globals.css](/c:/Users/sahil/Downloads/manochitta-sathi/frontend/app/globals.css).
- After pulling this feature, run `pnpm install` again so the Leaflet packages are available.

## Khalti Payments

- Appointment payments use Khalti ePayment in sandbox mode first.
- The frontend never stores or sends the Khalti secret key.
- After booking, users can start payment from the appointments dashboard.
- Khalti returns the user to `/dashboard/payments/khalti/return`, and that page asks the backend to verify the payment before showing success.
- After successful backend verification, the backend creates the Google Meet session and both patient and therapist can see the join link in their appointment dashboards.
- Local testing depends on backend env values in `backend/.env`:
  - `KHALTI_SECRET_KEY`
  - `KHALTI_PUBLIC_KEY`
  - `KHALTI_BASE_URL`
  - `KHALTI_WEBSITE_URL`
  - `KHALTI_RETURN_URL`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REFRESH_TOKEN`
  - `GOOGLE_CALENDAR_ID`
  - `GOOGLE_MEET_ORGANIZER_EMAIL`

## Google Sign-In Setup

Create a Google OAuth client of type `Web application` and configure:

- Authorized JavaScript origins:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- Authorized redirect URIs:
  - not required for the popup callback flow used by this app

Use the same client ID in both:

- `frontend/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `backend/.env` as `GOOGLE_CLIENT_ID`

## Google Sign-In Troubleshooting

- Restart `pnpm run dev` after changing `.env.local`.
- Confirm `BACKEND_API_URL` points to the backend that is actually running.
- Restart the Django server after changing `backend/.env` or backend dependencies.
- If the button says Google sign-in is unavailable, confirm `NEXT_PUBLIC_GOOGLE_CLIENT_ID` exists in `.env.local`.
- If the backend says `GOOGLE_CLIENT_ID is not configured`, confirm `backend/.env` exists and the server has been restarted.
- If Google auth throws a server error after code changes, make sure backend migrations have been applied with `manage.py migrate`.

## Scripts

```powershell
pnpm run dev
pnpm run build
pnpm run start
pnpm run test
pnpm run test:watch
pnpm run test:e2e
pnpm run test:e2e:ui
```

## Architecture

- `app/` route-based UI
- `components/` reusable UI and providers
- `lib/api.ts` centralized HTTP client
- `services/` domain service layer over the API client
- `tests/` frontend integration tests

## Main Route Groups

- `(auth)` login, register, password reset, verification
- `(dashboard)` user dashboard
- `(therapist)` therapist portal
- `(admin)` admin portal

## Notes

- Protected-route and role-routing behavior is handled by [auth-provider.tsx](/c:/Users/sahil/Downloads/manochitta-sathi/frontend/components/providers/auth-provider.tsx).
- The therapist portal only exposes live backend-supported features in active navigation.
- Browser E2E coverage lives in `frontend/e2e/` and assumes the backend sample seed accounts exist.
