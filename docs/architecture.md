# Todo App — Architecture & Design

> A complete technical reference for how this application is designed,
> how its pieces fit together, and how data moves through it.

---

## 1. System Overview

The application follows a classic **client–server** architecture. The browser
never talks directly to the database — it always goes through the Express API.

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  ┌──────────────┐   ┌────────────┐   ┌──────────────────┐  │
│  │  login.html  │   │ todos.html │   │  register.html   │  │
│  └──────┬───────┘   └─────┬──────┘   └────────┬─────────┘  │
│         │                 │                   │             │
│  ┌──────▼─────────────────▼───────────────────▼─────────┐  │
│  │            Compiled JavaScript (public/scripts/)      │  │
│  │  login.js      todos.js      register.js             │  │
│  │       │            │              │                   │  │
│  │  ┌────▼────────────▼──────────────▼────────────────┐ │  │
│  │  │          Shared Client Libraries                 │ │  │
│  │  │   api.ts     i18n.ts     session.ts             │ │  │
│  │  └────────────────────┬─────────────────────────── ┘ │  │
│  └───────────────────────┼────────────────────────────── ┘  │
│                          │  HTTP + Cookie                    │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────▼───────┐
                    │   INTERNET   │
                    └──────┬───────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                   NODE.JS SERVER                            │
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐ │
│  │                   Express App                          │ │
│  │                                                        │ │
│  │  Static Files   │  Session   │  /api  Router          │ │
│  │  (public/)      │  Middleware│  ┌──────────────────┐   │ │
│  │                 │            │  │ Auth Routes      │   │ │
│  │                 │            │  │ Todos Routes     │   │ │
│  │                 │            │  └────────┬─────────┘   │ │
│  │                 │            │           │             │ │
│  │                 │            │  ┌────────▼─────────┐   │ │
│  │                 │            │  │  Controllers     │   │ │
│  │                 │            │  └────────┬─────────┘   │ │
│  │                 │            │           │             │ │
│  │                 │            │  ┌────────▼─────────┐   │ │
│  │                 │            │  │    Services      │   │ │
│  │                 │            │  └────────┬─────────┘   │ │
│  └─────────────────────────────┼────────────┼─────────────┘ │
│                                │            │               │
│                          ┌─────▼────────────▼──────────┐   │
│                          │     Database Queries         │   │
│                          │        (Prisma)              │   │
│                          └─────────────┬────────────────┘   │
└────────────────────────────────────────┼────────────────────┘
                                         │
                                 ┌───────▼────────┐
                                 │   PostgreSQL   │
                                 │   Database     │
                                 └────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js v22 | Executes JavaScript on the server |
| Server framework | Express 4 | Handles HTTP routing and middleware |
| Language | TypeScript 5 | Type safety on both server and browser |
| ORM | Prisma 5 | Talks to PostgreSQL with type-safe queries |
| Database | PostgreSQL | Stores users and todos persistently |
| Auth | express-session | Cookie-based sessions — no JWT |
| Password hashing | bcryptjs | One-way hashes with salt (12 rounds) |
| Email | Nodemailer | Sends transactional emails via SMTP |
| Validation | Zod | Schema validation of request bodies |
| Frontend styling | Tailwind CSS | Utility-first CSS, compiled at build time |
| Frontend bundler | esbuild | Compiles TypeScript → browser JavaScript |
| Dev runner | tsx | Runs TypeScript server without compiling |
| Env loading | dotenv | Loads `.env` file into `process.env` |
| Dev parallelism | concurrently | Runs server + CSS + JS watchers at once |

---

## 3. Backend Architecture

The backend is organised into strict layers. **Data flows downward only** —
each layer only talks to the one directly below it.

```
  HTTP Request
       │
       ▼
┌─────────────┐
│  Middleware │  requireAuth, validate — runs before the controller
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Controller │  Reads req, calls one service, sends res
└──────┬──────┘  (no business logic here)
       │
       ▼
┌─────────────┐
│   Service   │  Business rules and validation (no Express objects)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Queries   │  Prisma calls — one function per DB operation
└──────┬──────┘
       │
       ▼
  PostgreSQL
```

### Why these layers?

- **Middleware** — cross-cutting concerns (auth, validation) written once,
  applied to many routes without copy-pasting.
- **Controller** — thin adapter between HTTP and business logic. No `if` chains.
  If a controller is long, it means business logic leaked in.
- **Service** — the real rules of the app. Has no idea it's inside Express.
  Easy to test in isolation.
- **Queries** — all SQL in one place. Swapping from Prisma to raw SQL only
  touches this folder.

### Dependency Graph (server)

```
index.ts
  └── config/app.ts
        ├── config/session.ts
        │     └── config/env.ts
        ├── routes/index.ts
        │     ├── routes/auth.routes.ts
        │     │     ├── middlewares/requireAuth.ts
        │     │     └── controllers/auth.controller.ts
        │     │           ├── services/auth.service.ts
        │     │           │     ├── database/queries/users.queries.ts
        │     │           │     │     └── database/client.ts
        │     │           │     ├── utils/hash.ts
        │     │           │     └── services/email.service.ts
        │     │           │           └── emails/mailer.ts
        │     │           └── database/queries/users.queries.ts
        │     └── routes/todos.routes.ts
        │           ├── middlewares/requireAuth.ts
        │           └── controllers/todos.controller.ts
        │                 └── services/todos.service.ts
        │                       └── database/queries/todos.queries.ts
        │                             └── database/client.ts
        └── utils/errors.ts  (errorHandler — registered last)
```

---

## 4. Frontend Architecture

There is no frontend framework. The browser receives plain HTML, loads a
compiled JavaScript bundle per page, and the bundle manipulates the DOM directly.

```
src/client/
│
├── pages/          ← One HTML file per screen (the shell)
│     login.html
│     register.html
│     todos.html
│
├── scripts/        ← One .ts file per page (the brain)
│     login.ts      ← Handles login form, calls API, redirects
│     register.ts   ← Handles registration form
│     todos.ts      ← Loads todos, renders list, handles events
│
├── components/     ← Reusable pieces (TS functions → DOM elements)
│     TodoItem.ts   ← Returns one <li> for a todo
│     Navbar.ts     ← Returns the <nav> bar with user info + logout
│     Modal.ts      ← Returns a reusable confirm dialog
│
└── lib/            ← Shared utilities used across scripts and components
      api.ts        ← fetch() wrapper (JSON, cookies, error handling)
      i18n.ts       ← t("key") translation helper
      session.ts    ← Page redirect helpers (guest/logged-in guards)
```

### How a component works (example: TodoItem)

Components are plain functions that create and return DOM elements.
The page script is responsible for appending them to the document.

```
todos.ts                     TodoItem.ts
    │                             │
    │  TodoItem({ todo,           │
    │    onToggle,   ────────────►│  Creates <li>
    │    onDelete }) │            │  Adds checkbox, label, delete button
    │                │            │  Wires event listeners
    │◄───────────────┘            │  Returns the element
    │
    │  list.appendChild(element)
    │
    ▼
  DOM updated — user sees new todo
```

### Module bundling

Each page script is compiled into its own bundle by esbuild.
Imports from `components/` and `lib/` are bundled inline — no separate request.

```
src/client/scripts/todos.ts
  imports TodoItem.ts
  imports Navbar.ts
  imports Modal.ts
  imports api.ts
  imports i18n.ts
  imports session.ts
         │
         │  esbuild --bundle
         ▼
public/scripts/todos.js   ← one file, ~30 KB, all code included
```

---

## 5. Authentication Flow

### 5a. Registration

```
Browser                       Express                      PostgreSQL
   │                             │                              │
   │  POST /api/auth/register    │                              │
   │  { name, email, password }  │                              │
   │────────────────────────────►│                              │
   │                             │  requireGuest middleware      │
   │                             │  (checks no active session)  │
   │                             │                              │
   │                             │  registerUser()              │
   │                             │  findUserByEmail(email) ────►│
   │                             │◄──────────────── null ───────│
   │                             │                              │
   │                             │  hashPassword(password)      │
   │                             │  [bcrypt, 12 rounds]         │
   │                             │                              │
   │                             │  createUser(name,email,hash)►│
   │                             │◄──────────── user row ───────│
   │                             │                              │
   │                             │  sendWelcomeEmail()          │
   │                             │  [fire-and-forget, non-blocking]
   │                             │                              │
   │                             │  req.session.userId = user.id│
   │                             │  [session stored server-side]│
   │                             │                              │
   │◄────────────────────────────│                              │
   │  201 { user }               │                              │
   │  Set-Cookie: connect.sid    │                              │
   │                             │                              │
   │  location.replace(          │                              │
   │    "/pages/todos.html")     │                              │
```

### 5b. Login

```
Browser                       Express                      PostgreSQL
   │                             │                              │
   │  POST /api/auth/login       │                              │
   │  { email, password }        │                              │
   │────────────────────────────►│                              │
   │                             │  requireGuest middleware      │
   │                             │                              │
   │                             │  loginUser(email, password)  │
   │                             │  findUserByEmail(email) ────►│
   │                             │◄──────────── user row ───────│
   │                             │                              │
   │                             │  verifyPassword(plain, hash) │
   │                             │  [bcrypt.compare]            │
   │                             │                              │
   │                             │  req.session.userId = user.id│
   │                             │                              │
   │◄────────────────────────────│                              │
   │  200 { user }               │                              │
   │  Set-Cookie: connect.sid    │                              │
   │                             │                              │
   │  location.replace(          │                              │
   │    "/pages/todos.html")     │                              │
```

### 5c. Protected request (session check)

Every request to `/api/todos/*` and `GET /api/auth/me` passes through
`requireAuth` before reaching the controller.

```
Browser                         requireAuth              Controller
   │                                │                        │
   │  GET /api/todos                │                        │
   │  Cookie: connect.sid=abc123    │                        │
   │───────────────────────────────►│                        │
   │                                │  req.session.userId?   │
   │                                │                        │
   │                         ───────┤                        │
   │                        │ exists│  next() ──────────────►│
   │                         ───────┤                        │
   │                                │                        │  runs
   │                         ───────┤                        │  and
   │                        │missing│  res.401 ──────────────►  responds
   │◄────────────────────────────── ┤                        │
   │  401 { error }                 │                        │
```

### 5d. Logout

```
Browser                       Express
   │                             │
   │  POST /api/auth/logout      │
   │  Cookie: connect.sid=abc123 │
   │────────────────────────────►│
   │                             │  requireAuth (verify session exists)
   │                             │
   │                             │  req.session.destroy()
   │                             │  [session deleted from store]
   │                             │
   │◄────────────────────────────│
   │  200 { message }            │
   │  Set-Cookie: connect.sid=;  │
   │  Expires=past               │
   │                             │
   │  location.replace(          │
   │    "/pages/login.html")     │
   │  [try/finally — always      │
   │   redirects even if error]  │
```

---

## 6. Todo CRUD Flows

### Create

```
Browser ──POST /api/todos { title }──► requireAuth ──► createTodo()
  │                                                        │
  │                                              addTodo(userId, title)
  │                                                        │
  │                                           title.trim() — empty check
  │                                                        │
  │                                        insertTodo(userId, title)
  │                                                        │
  │                                        prisma.todo.create(...)
  │                                                        │
  │◄─────────────201 { todo }─────────────────────────────┘
  │
  │  list.appendChild(TodoItem({ todo }))
  │  [no page reload — DOM updated directly]
```

### Read (list)

```
Browser ──GET /api/todos──► requireAuth ──► listTodos()
  │                                              │
  │                               getTodosForUser(userId)
  │                                              │
  │                          findTodosByUser(userId)
  │                                              │
  │                   prisma.todo.findMany({ where: { userId },
  │                                          orderBy: { createdAt: "desc" } })
  │                                              │
  │◄──────────────200 { todos: [...] }───────────┘
  │
  │  list.innerHTML = ""
  │  todos.forEach → TodoItem → list.appendChild
```

### Update (toggle done / rename)

```
Browser ──PATCH /api/todos/:id { done: true }──► requireAuth ──► updateTodo()
  │                                                                    │
  │                                                      editTodo(todoId, userId, data)
  │                                                                    │
  │                                                    findTodoById(id)
  │                                                                    │
  │                                              ownership check: todo.userId === userId
  │                                                                    │
  │                                                  updateTodoById(id, data)
  │                                                                    │
  │◄──────────────────────200 { todo }─────────────────────────────────┘
  │
  │  loadTodos() — re-renders the full list
```

### Delete

```
Browser clicks Delete ──► Modal opens (confirm dialog)
  │
  │  User clicks "Delete" in modal
  │
  │──DELETE /api/todos/:id──► requireAuth ──► deleteTodo()
  │                                               │
  │                               removeTodo(todoId, userId)
  │                                               │
  │                             findTodoById(id) — ownership check
  │                                               │
  │                             deleteTodoById(id)
  │                                               │
  │◄──────────200 { message }─────────────────────┘
  │
  │  loadTodos() — re-renders the list without deleted item
```

---

## 7. Full Page Load Flow (todos page)

When a user navigates to `todos.html`, the browser runs `todos.js`.
Here is the full sequence from page open to rendered list:

```
1  Browser loads /pages/todos.html
        │
2  Browser fetches /scripts/todos.js (the bundle)
        │
3  redirectIfGuest() — registers unhandledrejection listener
        │
4  await loadLanguage()
        │  fetch /locales/en.json
        │  populate translations{}
        │
5  await api.get("/api/auth/me")
        │  → requireAuth → me() → findUserById → prisma
        │  ← { user: { id, name, email } }
        │
6  document.body.prepend(Navbar({ userName }))
        │  Creates <nav> with brand, greeting, lang picker, logout
        │
7  await loadTodos()
        │  fetch GET /api/todos
        │  ← { todos: [...] }
        │  list.innerHTML = ""
        │  for each todo → TodoItem() → list.appendChild()
        │
8  Page is ready for interaction
```

---

## 8. Error Flow

All server errors follow the same path so the browser always gets JSON.

```
Any route handler
       │
       │  throw new AppError(404, "Todo not found.")
       │         OR
       │  prisma call throws
       │
       ▼
  next(err) called
       │
       ▼
  errorHandler (registered last in app.ts)
       │
       ├── err instanceof AppError?
       │      YES ──► res.status(err.statusCode).json({ error: err.message })
       │
       └── NO (unexpected) ──► console.error(err)
                               res.status(500).json({ error: "Something went wrong." })
```

On the browser, `api.ts` checks `res.ok`:
```
fetch response
       │
       ├── res.ok (2xx) ──► return data
       │
       └── not ok ──── throw new Error(data.error)
                              │
                       caught in try/catch in each script
                              │
                       errorBox.textContent = err.message
```

---

## 9. i18n (Multi-language) Flow

```
Page loads
    │
    │  await loadLanguage()
    │      │
    │      │  lang = localStorage.getItem("lang") ?? "en"
    │      │
    │      │  fetch /locales/en.json  (or fr.json etc.)
    │      │  ← { "add_todo": "Add todo", "logout": "Log out", ... }
    │      │
    │      │  translations = parsed JSON
    │
    │  t("add_todo")  ──► returns "Add todo"
    │  t("greeting", { name: "Ali" })  ──► returns "Hello, Ali"
    │
    │  User changes language via Navbar dropdown
    │      │
    │      │  setLanguage("fr")
    │      │      localStorage.setItem("lang", "fr")
    │      │      location.reload()
    │      │
    │  Page reloads → loadLanguage() picks "fr" → all text in French
```

Adding a new language = one file: `src/client/locales/es.json`

---

## 10. Build Pipeline

```
npm run dev
    │
    ├── [0] tsx watch src/server/index.ts
    │         Runs TypeScript server directly (no compile step)
    │         Restarts on any .ts file change in src/server/
    │
    ├── [1] tailwindcss --watch
    │         Scans src/client/pages/**/*.html and src/client/**/*.ts
    │         for Tailwind class names
    │         Compiles → public/styles/main.css
    │         Rebuilds on any HTML/TS change
    │
    └── [2] node scripts/build-client.mjs --watch
              Copies src/client/pages/ → public/pages/
              Copies src/client/locales/ → public/locales/
              Bundles each .ts in src/client/scripts/ with esbuild:
                login.ts    → public/scripts/login.js
                register.ts → public/scripts/register.js
                todos.ts    → public/scripts/todos.js
              Rebuilds on any client .ts change
```

What `public/` looks like after the build:

```
public/
├── pages/
│     ├── login.html       ← copied from src/client/pages/
│     ├── register.html
│     └── todos.html
├── scripts/
│     ├── login.js         ← bundled by esbuild
│     ├── register.js
│     └── todos.js
├── styles/
│     └── main.css         ← compiled by Tailwind
├── locales/
│     ├── en.json          ← copied from src/client/locales/
│     └── fr.json
└── assets/                ← place images/fonts here manually
```

Express serves this entire `public/` folder as static files.

---

## 11. Database Schema

```
┌────────────────────────────────┐
│            User                │
├────────────────────────────────┤
│ id        String  PK  cuid()   │
│ name      String               │
│ email     String  UNIQUE       │
│ password  String  (bcrypt hash)│
│ language  String  default "en" │
│ createdAt DateTime             │
└────────────────┬───────────────┘
                 │ 1
                 │
                 │ has many
                 │
                 │ N
┌────────────────▼───────────────┐
│             Todo               │
├────────────────────────────────┤
│ id        String  PK  cuid()   │
│ title     String               │
│ done      Boolean default false│
│ createdAt DateTime             │
│ updatedAt DateTime (auto)      │
│ userId    String  FK → User.id │
└────────────────────────────────┘
                 onDelete: Cascade
                 (deleting a user deletes their todos)
```

---

## 12. API Reference

All API routes are prefixed with `/api`.

### Auth

| Method | Path | Guard | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | requireGuest | `{ name, email, password }` | `201 { user }` |
| `POST` | `/api/auth/login` | requireGuest | `{ email, password }` | `200 { user }` |
| `GET` | `/api/auth/me` | requireAuth | — | `200 { user }` |
| `POST` | `/api/auth/logout` | requireAuth | — | `200 { message }` |

### Todos

All todo routes require `requireAuth`.

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/api/todos` | — | `200 { todos: Todo[] }` |
| `POST` | `/api/todos` | `{ title }` | `201 { todo }` |
| `PATCH` | `/api/todos/:id` | `{ title?, done? }` | `200 { todo }` |
| `DELETE` | `/api/todos/:id` | — | `200 { message }` |

### Error responses

All errors return JSON in this shape:

```json
{ "error": "Human-readable message" }
```

Common status codes:

| Code | Meaning |
|---|---|
| `400` | Bad request (validation failed, already logged in) |
| `401` | Not authenticated (missing or expired session) |
| `404` | Resource not found (wrong id, or belongs to another user) |
| `409` | Conflict (email already registered) |
| `500` | Unexpected server error |

---

## 13. Session & Cookie Design

- Sessions are stored **server-side** (in memory in development; should be
  moved to a database store in production using `connect-pg-simple`).
- The browser only holds a **session ID** in the `connect.sid` cookie.
- Cookie flags: `httpOnly` (JS cannot read it), `secure` in production (HTTPS only).
- Session expires after **7 days** of inactivity.
- `req.session.userId` is the only value stored in the session.
  All other user data is fetched from the database by the `me` endpoint.

```
Browser cookie jar         Server session store
┌──────────────────┐       ┌──────────────────────────────┐
│ connect.sid      │       │ session id → { userId: "x1" }│
│ = "abc123"       │──────►│ session id → { userId: "x2" }│
└──────────────────┘       │ session id → { userId: "x3" }│
                           └──────────────────────────────┘
```

---

## 14. Security Notes

| Concern | How it is handled |
|---|---|
| Password storage | bcrypt hash with 12 salt rounds — plaintext is never stored |
| Session fixation | `express-session` regenerates the session ID on login |
| CSRF | Same-origin fetch requests with `credentials: "include"` — no cross-origin form attacks |
| Cookie theft | `httpOnly` prevents JS from reading the cookie |
| Ownership checks | Every todo mutation verifies `todo.userId === req.session.userId` before acting |
| Missing env vars | `env.ts` fails at startup rather than silently running without secrets |
| Error leakage | `errorHandler` only exposes the message for `AppError`; unexpected errors return a generic string |
