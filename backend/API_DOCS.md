# Manochitta Sathi API

Base URL: `/api/v1/`

Core modules:
- `auth/`: registration, login, logout, email verification, password reset
- `profiles/`: user profile management
- `therapists/`: therapist listing, profile management, approval, availability
- `appointments/`: booking and lifecycle actions
- `mood/`: daily mood tracking
- `resources/`: categories and mental health resources
- `notifications/`: in-app notification inbox
- `feedback/`: post-session feedback and ratings
- `admin-actions/`: admin audit trail
- `communications/`: conversation and message scaffold

Machine-readable schema:
- `GET /api/schema/`

Important actions:
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/verify-email/`
- `POST /api/v1/auth/forgot-password/`
- `POST /api/v1/auth/reset-password/`
- `GET|PATCH /api/v1/auth/admin/users/{id}/`
- `POST /api/v1/auth/admin/users/{id}/activate/`
- `POST /api/v1/auth/admin/users/{id}/deactivate/`
- `GET|PATCH /api/v1/profiles/me/`
- `GET /api/v1/therapists/profiles/`
- `POST /api/v1/therapists/profiles/{id}/approve/`
- `GET|POST /api/v1/therapists/availability/`
- `GET|POST /api/v1/appointments/`
- `POST /api/v1/appointments/{id}/accept/`
- `POST /api/v1/appointments/{id}/reject/`
- `POST /api/v1/appointments/{id}/cancel/`
- `POST /api/v1/appointments/{id}/reschedule/`
- `POST /api/v1/appointments/{id}/complete/`

Authentication:
- Bearer JWT via `Authorization: Bearer <access_token>`
- Refresh token rotation and blacklisting are enabled.

Response convention:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```
