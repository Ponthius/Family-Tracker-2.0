# BWAT.md

This file provides guidance to Bwat when working with code in this repository.

## Tech Stack

- **Runtime**: Node.js 22
- **Server framework**: Express 4 (ESM, `"type": "module"`)
- **Language**: TypeScript 5 (strict mode, on both server and client)
- **ORM**: Prisma 5 with PostgreSQL
- **Auth**: express-session (cookie-based, server-side, no JWT)
- **Password hashing**: bcryptjs, 12 salt rounds
- **Validation**: Zod (request body validation middleware)
- **Email**: Nodemailer via SMTP
- **Frontend**: Pure HTML + Tailwind CSS 3 + TypeScript compiled by esbuild
- **Dev runner**: tsx (runs TypeScript server without compilation)
- **Dev parallelism**: concurrently
- **Test runner**: Node.js built-in (`node:test`)

## Brand Identity

**Colors** (Tailwind utility classes — no CSS custom properties defined):
- Primary / brand: `indigo-600`, `indigo-700` (Navbar background, checkbox accent)
- Destructive: `red-600`, `red-700` (delete buttons, modal confirm)
- Background / surface: `white`, `bg-black/50` (modal overlay)
- Foreground / text: `text-gray-800` (body), `text-gray-900` (headings), `text-white` (on brand surfaces)
- Muted text: `text-gray-400`, `text-gray-600`
- Borders: `border-gray-200`, `border-gray-300`

**Typography**:
- Tailwind defaults (system font stack — no custom fonts configured)
- Heading weight: `font-semibold`, `font-bold`
- Body size: `text-sm` (Navbar items, metadata), default (body copy)

**Geometry**:
- Border radius: Tailwind defaults — `rounded` (0.25rem), `rounded-lg` (0.5rem), `rounded-xl` (0.75rem)
- Spacing scale: Tailwind default scale (`px-6`, `py-3`, `gap-3`, `p-3`, `p-6`, etc.)
- Shadows: `shadow` (Navbar), `shadow-xl` (modal)

**Visual language**: Functional and minimal — utility-first Tailwind with indigo brand accent, flat surfaces, subtle borders, and restrained interactive feedback via `transition-colors`.

## Coding Conventions

- **ES modules**: All server imports use `.js` extension (`import { x } from "./foo.js"`) even though the source is `.ts`. This is required by Node's ESM resolver with `tsx`.
- **`type` keyword for type-only imports**: Use `import type { ... }` for types (e.g. `import type { Request, Response, NextFunction } from "express"`).
- **Strict layering**: Never skip a layer. Data flows one direction only: `routes/` -> `controllers/` -> `services/` -> `database/queries/` -> Prisma -> PostgreSQL.
  - Controllers read `req` and call one service function, then send `res`. No business logic.
  - Services hold business rules. No Express objects (`req`/`res`) ever enter a service.
  - Query files contain one function per database operation.
- **Error handling**: Controllers wrap logic in `try/catch` and call `next(err)`. Services throw `AppError(statusCode, message)` for expected failures. The global `errorHandler` middleware (registered last in `app.ts`) catches everything and returns `{ error: "..." }` JSON.
- **Auth guards**: `requireAuth` middleware (checks `req.session.userId`) on protected routes. `requireGuest` middleware on login/register to prevent double-login.
- **No frontend framework**: Client-side code is plain TypeScript that creates DOM elements directly. Components are functions returning `HTMLElement`. The page script (`src/client/scripts/*.ts`) appends them to the DOM.
- **Validation middleware**: `validate(schema)` returns an Express middleware that runs `ZodSchema.safeParse(req.body)` and returns `400 { error: "Validation failed", errors: [...] }` on failure. The validated data replaces `req.body`.
- **Comments**: Every module file has a JSDoc comment describing its purpose. Keep them current.

## Architecture Notes

**Backend structure** follows strict layers: `routes/` defines URL-to-controller mappings, `controllers/` are thin HTTP adapters (read input, call service, send response), `services/` hold pure business logic with no Express dependencies, and `database/queries/` isolate all Prisma calls. Middleware (`requireAuth`, `validate`) sits between the route and controller for cross-cutting concerns. The `AppError` class (with `statusCode`) is thrown in services and caught by the global `errorHandler` — every response is JSON.

**Frontend** has no framework. Each page has an HTML shell in `src/client/pages/` and a corresponding TypeScript entry point in `src/client/scripts/`. esbuild bundles each entry point (plus its imports from `components/` and `lib/`) into a single `.js` file in `public/scripts/`. Pages import shared utilities from `lib/` (`api.ts`, `i18n.ts`, `session.ts`) and components from `components/` (`TodoItem.ts`, `Navbar.ts`, `Modal.ts`). Components are functions that create and return DOM elements — the page script appends them to the document.

**Auth flow**: Session-based. On login/register, `req.session.userId` is set to the user's ID. The browser sends the `connect.sid` cookie automatically. Every protected route goes through `requireAuth` which checks `req.session.userId` — 401 if missing. Session expires after 7 days of inactivity. Session store is in-memory (dev only — for production, use `connect-pg-simple` or similar).

**i18n**: Simple client-side JSON translation files in `src/client/locales/`. `loadLanguage()` fetches the file matching `localStorage.getItem("lang")` (default `"en"`). `t("key", { vars })` does string lookup with `{{var}}` substitution. Adding a language = adding one JSON file and adding it to the Navbar language selector.

**Build pipeline** (`npm run dev`): runs three concurrent watchers — `tsx watch` for the server, `tailwindcss --watch` for CSS, and `scripts/build-client.mjs --watch` (esbuild) for client JS. `npm run build` produces minified output in `public/`. The `public/` folder is served as static files by Express — never edit files in `public/` by hand.

## Commands

- `npm run dev` — Start all dev watchers in parallel (server + CSS + JS)
- `npm run build` — Build CSS (minified) and client JS (minified) for production
- `npm run typecheck` — Type-check both server (`tsconfig.json`) and client (`tsconfig.client.json`)
- `npm test` — Run tests with Node's built-in test runner (`node:test`)
- `npm run db:migrate` — Apply Prisma migrations (run after changing `prisma/schema.prisma`)
- `npm run db:generate` — Regenerate Prisma client (run after schema changes if not auto-migrating)
- `npm run db:studio` — Open Prisma Studio for visual database browsing

## Gotchas

- **`.env` is required**: Copy `.env.example` to `.env` and fill in real values (PostgreSQL DATABASE_URL, SESSION_SECRET, SMTP credentials) before the server will start. `env.ts` fails hard on any missing required variable — no silent defaults.
- **PostgreSQL is required**: This project does NOT use SQLite. Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` points to an accessible database.
- **Never edit `public/`**: The entire `public/` directory is auto-generated by `npm run dev` and `npm run build`. Edits there will be overwritten. Always edit in `src/client/` and rebuild.
- **`.js` extensions in `.ts` files**: All module imports use the `.js` extension convention (e.g. `from "../config/env.js"`) because Node's ESM resolver requires it when running via `tsx`. TypeScript accepts this — the `.js` extension maps to the `.ts` source at compile time. Do NOT use extensionless imports or `.ts` extensions.
- **Two tsconfig files**: `tsconfig.json` covers `src/server/` (Node16 module resolution), `tsconfig.client.json` covers `src/client/` (ESNext/bundler resolution, includes DOM lib). `npm run typecheck` runs both.
- **Email is fire-and-forget**: `sendWelcomeEmail()` is called with `.catch()` in `auth.service.ts` — it never blocks registration. If SMTP is misconfigured, the app still works but welcome emails silently fail (logged to console). No retry logic.
- **Session store is in-memory**: Do NOT deploy to production without swapping to a database-backed session store (e.g. `connect-pg-simple`). In-memory sessions are lost on server restart and don't scale.
- **`todosRouter.use(requireAuth)` applies to ALL routes** registered on that router — individual todo route handlers don't need the middleware repeated.
- **Auth routes use `requireGuest`**: The login and register endpoints check that no active session exists, returning 400 if the user is already logged in.
- **Ownership checks**: Every todo mutation in `todos.service.ts` verifies `todo.userId === userId` before acting. Touching a todo that belongs to another user returns 404 (not 403 — deliberately hides existence).
