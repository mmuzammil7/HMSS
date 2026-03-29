# Workspace

## Overview

Hostel Mess Attendance & Billing Management System — pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TanStack React Query, Tailwind CSS, shadcn/ui, Recharts, Framer Motion

## Authentication

Role-based JWT auth with 30-day tokens stored in `localStorage` under `messmate_token`.

| Role | Default Login | Access |
|------|--------------|--------|
| Admin | `admin` / `admin123` | Full access — all pages, user management, settings |
| Manager | Set in Settings → Managers | Attendance, Residents, Billing, Rates (no user management) |
| Resident | `resident` / `123456` (PIN) | Read-only attendance view — separate layout |

- **Admin** can create/edit/delete managers (Settings → Managers section)
- **Admin** can change the shared resident username + PIN (Settings → Resident Login)
- **Admin** can change their own password (Settings → Change Admin Password)
- **Resident view** is a mobile-friendly single-screen with date navigator showing daily attendance

## Application Features

### Hostel Mess Manager (`artifacts/mess-attendance`)
- **Login Page**: Role selector (Admin / Manager / Resident) with animated form. JWT auth, token persisted in localStorage.
- **Dashboard**: Live overview — active residents, today's attendance stats, veg/non-veg billing rates
- **Attendance Page**: Mark daily attendance for all residents — Present, P/2 (half day), Absent, Breakfast Only. Atomic upsert (ON CONFLICT DO UPDATE) prevents race conditions.
- **Residents Page**: Add/edit/delete residents with room number, diet type (veg/non-veg), and unpaid bill flag
- **Billing Page**: Monthly bill calculation per resident. Veg and non-veg residents billed at separate rates. Toggle unpaid bill status per resident. Print as PDF (opens print dialog).
- **Settings Page**: Configure mess name, separate veg/non-veg diet rates, breakfast rate, and currency. Admin-only sections for manager CRUD, resident login credentials, and admin password change.

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── mess-attendance/    # React + Vite frontend (served at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `residents` — hostel residents (name, roomNumber, whatsappNumber, isActive)
- `attendance` — daily attendance (residentId, date, status: present|half|absent|breakfast)
- `mess_settings` — mess configuration (name, dietRatePerDay, breakfastRate, currency, residentUsername, residentPin)
- `users` — admin/manager accounts (username, passwordHash, role)

## WhatsApp Setup

To enable WhatsApp messaging, set:
- `WHATSAPP_API_KEY` — Your CallMeBot API key
- `WHATSAPP_SENDER` — Your WhatsApp number registered with CallMeBot

CallMeBot is a free WhatsApp messaging service. Users must register at https://www.callmebot.com/

## API Routes

All routes prefixed with `/api`:

| Method | Path | Description |
|--------|------|-------------|
| GET | /residents | List all residents |
| POST | /residents | Add resident |
| PUT | /residents/:id | Update resident |
| DELETE | /residents/:id | Delete resident |
| GET | /attendance | Get attendance (filterable by date/month/year/residentId) |
| POST | /attendance | Mark attendance for one resident |
| POST | /attendance/bulk | Mark attendance for all residents on a date |
| GET | /settings | Get mess settings |
| PUT | /settings | Update settings |
| GET | /billing/summary | Monthly billing summary |
| POST | /whatsapp/send-bills | Send bills to all residents via WhatsApp |
| POST | /whatsapp/send-reminder | Send reminder to specific resident |

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

- `pnpm run build` — runs typecheck, then builds all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client + Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
