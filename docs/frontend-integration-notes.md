# Frontend Integration Notes

Date: 2026-04-27

## Integrated Frontend Flows

- Added a frontend service layer for the existing FastAPI endpoints:
  - `GET /api/users/`
  - `GET|POST|PATCH|DELETE /api/workshops/`
  - `GET /api/students/`
  - `GET|PUT /api/enabled-weeks/`
  - `GET|PATCH /api/system-config/current`
  - `GET /api/marks/workshop/{workshop_id}/week/{week_number}`
  - `POST|PATCH /api/marks/`
- Hydrated frontend workshop/config state from backend data when the API is reachable.
- Kept local fallback behavior for offline development and incomplete backend contracts.
- Connected Settings save to enabled weeks and current system config endpoints.
- Connected Review & Submit to create or update participation marks against existing mark endpoints.
- Updated the user API helper to match the current backend `users` route shape.

## Current Compatibility Gaps

- Backend auth endpoints expected by the frontend are not currently registered:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- The frontend can still use dev-only test login, but real credential login is blocked until backend auth exists.
- There is no direct frontend-usable endpoint for "students currently in workshop".
  - Backend has membership CRUD logic, but no route that lists current memberships by workshop.
  - CSV-uploaded rosters therefore remain local frontend state for now.
- Mark submission requires a backend user id.
  - With dev login, the frontend tries to match the current email against `GET /api/users/`.
  - If no matching backend user exists, marks remain saved locally and backend submission is skipped with an error message.
- Workshop tutor assignment can only persist if the tutor email matches an existing backend user.

## Smoke Testing

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: blocked by local Windows filesystem permissions on generated `.next` artifacts:
  - initial failure: `EPERM` during rename in `.next/server`
  - retry failure: `EPERM` during unlink in `.next/build/chunks`
  - scoped `.next` cleanup also failed with permission denied, and escalated cleanup was declined.

## Suggested Next Integration Tickets

- Add backend auth routes matching the existing frontend contract.
- Add workshop roster endpoint, for example `GET /api/workshops/{workshop_id}/students`.
- Add CSV/import flow that creates students and memberships together.
- Add an upsert/batch endpoint for marks to replace create-then-patch frontend orchestration.
