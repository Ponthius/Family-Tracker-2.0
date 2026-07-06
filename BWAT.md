# BWAT.md

This file provides guidance to Bwat when working with code in this repository.
**This is Family Tracker 2.0** — rebuilt from a Todo App scaffold into a full-featured family schedule management system.

## Tech Stack

- **Runtime**: Node.js 22
- **Server framework**: Express 4 (ESM, `"type": "module"`)
- **Language**: TypeScript 5 (strict mode, on both server and client)
- **ORM**: Prisma 5 with PostgreSQL
- **Auth**: express-session (cookie-based, server-side, no JWT)
- **Password hashing**: bcryptjs, 12 salt rounds
- **Validation**: Zod (request body validation middleware)
- **Email**: Nodemailer via SMTP (fire-and-forget, never blocks)
- **Frontend**: Pure HTML + Tailwind CSS 3 + TypeScript compiled by esbuild
- **Dev runner**: tsx (runs TypeScript server without compilation)
- **Dev parallelism**: concurrently
- **Test runner**: Node.js built-in (`node:test`)

## Brand Identity

**Colors** (warm, earthy palette — use these hex values directly):
- Page background: `#e8e2d9`
- Card / surface: `#f5f1ec`
- Primary / dark: `#3d3530` (buttons, nav active, headings)
- Button hover: `#2c2420`
- Text primary: `#2c2420`
- Text subdued: `#5a4e46` (labels), `#7a6e66` (secondary), `#9b8a7a` (muted)
- Accent warm brown: `#8b7355` (icons, focus borders, logo icon)
- Border light: `#c8bfb5`, `#e0d6ce`
- Success bg: `#e7efe2`, text `#3c5a3c`, border `#b9cdb0`
- Error text: `#a13d3d`

**Typography**:
- Display / headings: `Georgia, serif`
- Body: `Arial, sans-serif` (or `Arial, Helvetica, sans-serif`)

**Geometry**:
- Border radius: `6px` (inputs, buttons), `12px` (cards, panels, modals), `24px` (KPI cards, table wrappers)
- Card shadows: `0 2px 12px rgba(0,0,0,0.08)` (cards), `0 4px 20px rgba(0,0,0,0.18)` (modals)

**Visual language**: Warm, earthy minimalism — beige/cream palette, flat surfaces with gentle shadows, serif headings for warmth, sans-serif body text, generous whitespace, subtle hover transitions.

## Current Schema (Prisma)

```
model Family {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   User[]
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String
  role      String   @default("Member")  // "Admin" or "Member"
  language  String   @default("en")
  createdAt DateTime @default(now())
  familyId  String?
  family    Family?  @relation(fields: [familyId], references: [id], onDelete: SetNull)
  todos     Todo[]
}

model Todo {
  id        String   @id @default(cuid())
  title     String
  done      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Target Features (MVP)

Build toward these:

1. **Family as a tenant** — Registration creates a `Family` + `User` (Admin role). All members scoped to `familyId`.
2. **Auth** — Register with username + email + password (bcryptjs, 12 rounds). Login by username or email. Session-based (express-session). `requireGuest` middleware on auth pages.
3. **Roles** — Admin can invite/manage members. Members can view schedules and manage their own tasks. Super admin exists above all tenants.
4. **Schedules** — Every user has a schedule. Family members can see each others' schedules (today, tomorrow, this week, last week, next month, last month, next year, last year). Schedule conflicts flagged when creating tasks.
5. **Tasks / Events** — CRUD for tasks and events. Tasks belong to a user and are visible to the family. Completed tasks go to a done/recent list. Ownership checks on every mutation.
6. **Dashboard** — KPI cards (pending tasks count, members count, upcoming events), recent tasks list, upcoming tasks list. Greeting with family name.
7. **White labelling** — Family can upload a logo, set a family name displayed in the dashboard header. Tenant-scoped.
8. **Multi-language** — Client-side i18n (JSON files). Five languages: EN, SW (Kiswahili), LG (Luganda), FR (Français), ES (Español). Language stored in `localStorage` and `families.language` column.
9. **Account deletion with 7-day grace** — Soft-delete with `DeletedAccounts` table. Admin deletion cascades to all family members. Regular deletion only removes own data.
10. **Invitations** — Admin invites members via email. Token-based invitation links with expiry.
11. **Super admin** — Seeded account (`superadmin@gmail.com`). Manages all tenants. Excluded from all regular queries (`WHERE is_super_admin = FALSE`).
12. **Audit logging** — Every significant action writes to `audit_logs`. Family admin can view logs with filters.
13. **Cron jobs** — Automated tasks via `node-cron`: clean up expired `DeletedAccounts`, send task reminders.
14. **Confirmation modals** — Every destructive action has a confirmation modal. For permanent actions, require typing a confirmation phrase.
15. **Inline messages** — No `alert()` calls. Error/success messages are inline or use a toast/notification component.
16. **Breadcrumbs + Sidebar** — Navigation breadcrumbs on every page. Sidebar with main navigation. Header with family name + user info + language selector + logout.

## Coding Conventions

- **ES modules**: All server imports use `.js` extension (`import { x } from "./foo.js"`) even though the source is `.ts`. Required by Node's ESM resolver with `tsx`.
- **`type` keyword for type-only imports**: Use `import type { ... }` for types (e.g. `import type { Request, Response, NextFunction } from "express"`).
- **Strict layering**: Never skip a layer. Data flows one direction only: `routes/` -> `controllers/` -> `services/` -> `database/queries/` -> Prisma -> PostgreSQL.
  - Controllers read `req` and call one service function, then send `res`. No business logic.
  - Services hold business rules. No Express objects (`req`/`res`) ever enter a service.
  - Query files contain one function per database operation.
- **Error handling**: Controllers wrap logic in `try/catch` and call `next(err)`. Services throw `AppError(statusCode, message)` for expected failures. The global `errorHandler` middleware (registered last in `app.ts`) catches everything and returns `{ error: "..." }` JSON.
- **Auth guards**: `requireAuth` middleware (checks `req.session.userId`) on protected routes. `requireGuest` middleware on login/register to prevent double-login.
- **No frontend framework**: Client-side code is plain TypeScript that creates DOM elements directly. Components are functions returning `HTMLElement`. The page script appends them to the DOM.
- **Validation middleware**: `validate(schema)` returns an Express middleware that runs `ZodSchema.safeParse(req.body)` and returns `400 { error: "Validation failed", errors: [...] }` on failure. Validated data replaces `req.body`.
- **Comments**: Every module file has a JSDoc comment describing its purpose. Keep them current.
- **Login accepts username or email**: The login controller/service try email first, then username lookup. The login page sends `{ username, password }`. Do NOT change this to email-only.

## Architecture Notes

**Backend structure** follows strict layers: `routes/` -> `controllers/` -> `services/` -> `database/queries/` -> Prisma -> PostgreSQL. Middleware (`requireAuth`, `validate`) sits between route and controller. The `AppError` class (with `statusCode`) is thrown in services and caught by the global `errorHandler` — every response is JSON. Each domain (auth, todos, dashboard, families, members, tasks, events, schedules) gets its own route/controller/service/query chain.

**Multi-tenancy** is implemented through `family_id` on every user. The admin creates a `families` row on registration. Invited members are linked to the same `family_id`. All tenant-scoped queries filter by `family_id`.

**Auth flow** — Session-based. On login/register, `req.session.userId` is set to the user's ID. The browser sends the `connect.sid` cookie automatically. Login accepts both username and email lookup. Session expires after 7 days of inactivity. Session store is in-memory in dev; production must use `connect-pg-simple`.

**Frontend** has no framework. Each page has an HTML shell in `src/client/pages/` and a corresponding TypeScript entry point in `src/client/scripts/`. esbuild bundles each entry point into a single `.js` file in `public/scripts/`. Components are functions that create and return DOM elements. The build script also copies `pages/` and `locales/` to `public/`.

**Build pipeline** (`npm run dev`): runs three concurrent watchers — `tsx watch` for the server, `tailwindcss --watch` for CSS (CDN version used on login/register/tasks pages), and `scripts/build-client.mjs --watch` (esbuild) for client JS.

## Commands

- `npm run dev` — Start all dev watchers in parallel (server + CSS + JS)
- `npm run build` — Build CSS (minified) and client JS (minified) for production
- `npm run typecheck` — Type-check both server and client
- `npm test` — Run tests with Node's built-in test runner
- `npm run db:migrate` — Apply Prisma migrations
- `npm run db:generate` — Regenerate Prisma client
- `npm run db:studio` — Open Prisma Studio
- `npx prisma db push` — Sync schema to DB (use `--force-reset` if schema has breaking changes)

## Gotchas

- **`.env` is required**: Copy `.env.example` to `.env` and fill in real values before the server starts. `env.ts` fails hard on missing variables.
- **PostgreSQL is required**: This project uses a Prisma Pooled DB URL. Ensure the connection works before running.
- **Never edit `public/`**: Auto-generated by `npm run dev` and `npm run build`. Edits there are overwritten.
- **`.js` extensions in `.ts` files**: All module imports use `.js` extension (e.g. `from "../config/env.js"`) because Node's ESM resolver requires it when running via `tsx`.
- **Two tsconfig files**: `tsconfig.json` for server (Node16), `tsconfig.client.json` for client (ESNext/bundler + DOM lib). `npm run typecheck` runs both.
- **Email is fire-and-forget**: Welcome/verification emails are called with `.catch()` — never block registration if SMTP fails.
- **Session store is in-memory**: Do NOT deploy to production without swapping to `connect-pg-simple` or similar.
- **Login accepts username OR email**: The login controller tries email first, falls back to username. The login page sends `{ username, password }`. Register page sends `{ username, email, password, familyName }`.
- **Registration creates a Family + Admin user**: The first user to register creates a family group and is assigned the Admin role automatically.
- **Ownership checks**: Every task/event mutation must verify ownership. Touching data belonging to another user returns 404 (not 403 — hides existence).
- **Some pages use Tailwind CDN**: login.html, register.html, tasks.html use `<script src="https://cdn.tailwindcss.com"></script>` instead of the compiled `public/styles/main.css`. Keep this consistent.
- **No `alert()` calls anywhere**: All user-facing messages must use inline error/success elements.
- **Warm earthy palette uses hardcoded hex values**: The `#e8e2d9` / `#f5f1ec` / `#3d3530` palette is applied via inline Tailwind classes or `style` attributes. Do not mix with indigo/gray Tailwind classes from the old Todo scaffold.
- **`family_id` scoping**: All data queries must filter by the user's `family_id`. A user should never see data from another family.
- **Delete orphan reschedule files**: `src/client/pages/reschedule/` is orphan code from an earlier branch. Do NOT recreate it if deleted. The build script will copy whatever is in `src/client/pages/` to `public/pages/`.
