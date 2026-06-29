# Todo App — Project Structure Guide

> This guide is for interns. Read it before writing your first line of code.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server framework | Express |
| Language | TypeScript (everywhere) |
| Database | PostgreSQL + Prisma |
| Frontend | Pure HTML + Tailwind CSS + TypeScript |
| Auth | Sessions + cookies (express-session) |
| Email | Nodemailer |
| i18n | Client-side JSON translation files |

---

## Complete Folder Structure

```
todo-app/
├── src/
│   ├── server/                        # Everything that runs on the server (Node.js)
│   │   ├── config/                    # App-wide settings and setup
│   │   │   ├── app.ts                 # Creates and configures the Express app
│   │   │   ├── session.ts             # Session (cookie) settings
│   │   │   └── env.ts                 # Reads and validates .env variables
│   │   │
│   │   ├── routes/                    # Maps URLs to the right controller function
│   │   │   ├── auth.routes.ts         # /api/auth/login, /api/auth/logout, etc.
│   │   │   ├── todos.routes.ts        # /api/todos  (GET, POST, PATCH, DELETE)
│   │   │   └── index.ts               # Combines all route files into one router
│   │   │
│   │   ├── controllers/               # Reads the request, calls a service, sends the response
│   │   │   ├── auth.controller.ts     # login(), logout(), register()
│   │   │   └── todos.controller.ts    # listTodos(), createTodo(), updateTodo(), deleteTodo()
│   │   │
│   │   ├── services/                  # Pure business logic — no Express objects here
│   │   │   ├── auth.service.ts        # validateCredentials(), createUser()
│   │   │   ├── todos.service.ts       # getTodosForUser(), addTodo(), toggleDone()
│   │   │   └── email.service.ts       # sendWelcomeEmail(), sendPasswordResetEmail()
│   │   │
│   │   ├── middlewares/               # Functions that run before a controller
│   │   │   ├── requireAuth.ts         # Blocks the request if the user is not logged in
│   │   │   └── validate.ts            # Checks that request body has the right shape
│   │   │
│   │   ├── database/                  # Everything related to talking to PostgreSQL
│   │   │   ├── client.ts              # Single shared Prisma client instance
│   │   │   └── queries/               # Functions that run SQL/Prisma queries
│   │   │       ├── users.queries.ts   # findUserByEmail(), createUser()
│   │   │       └── todos.queries.ts   # findTodosByUser(), insertTodo(), deleteTodo()
│   │   │
│   │   ├── emails/                    # Email templates and the sending utility
│   │   │   ├── templates/
│   │   │   │   ├── welcome.html       # HTML email body for new user registration
│   │   │   │   └── reset-password.html
│   │   │   └── mailer.ts              # Wraps Nodemailer — call sendMail(to, subject, html)
│   │   │
│   │   ├── utils/                     # Small helper functions with no business logic
│   │   │   ├── hash.ts                # hashPassword(), verifyPassword()
│   │   │   ├── errors.ts              # AppError class for consistent error responses
│   │   │   └── logger.ts              # Simple wrapper around console for log levels
│   │   │
│   │   └── index.ts                   # Entry point — imports app.ts and starts the server
│   │
│   └── client/                        # Everything that runs in the browser
│       ├── pages/                     # One HTML file per page (the "screens")
│       │   ├── login.html
│       │   ├── register.html
│       │   └── todos.html
│       │
│       ├── components/                # Reusable UI pieces (TypeScript functions → DOM elements)
│       │   ├── TodoItem.ts            # Returns an <li> element for one todo
│       │   ├── Navbar.ts              # Returns the top navigation bar element
│       │   └── Modal.ts              # Returns a reusable dialog/modal element
│       │
│       ├── scripts/                   # One TypeScript file per page — the page's "brain"
│       │   ├── login.ts               # Handles the login form submit, calls /api/auth/login
│       │   ├── register.ts            # Handles registration form
│       │   └── todos.ts               # Loads todos, renders them, handles add/edit/delete
│       │
│       ├── lib/                       # Shared frontend utilities (used by scripts + components)
│       │   ├── api.ts                 # fetch() wrapper — adds credentials, handles errors
│       │   ├── i18n.ts                # t('key') translation helper
│       │   └── session.ts             # redirectIfGuest(), redirectIfLoggedIn()
│       │
│       ├── locales/                   # Translation files (one JSON file per language)
│       │   ├── en.json
│       │   └── fr.json
│       │
│       └── styles/
│           └── main.css               # Tailwind directives: @tailwind base/components/utilities
│
├── public/                            # AUTO-GENERATED build output — never edit by hand
│   ├── pages/                         # Copied HTML files
│   ├── scripts/                       # Compiled + bundled JS (one bundle per page)
│   ├── styles/                        # Compiled Tailwind CSS
│   └── assets/                        # Images, icons, fonts (placed here manually)
│
├── prisma/                            # Prisma ORM
│   ├── schema.prisma                  # Defines User and Todo database tables
│   └── migrations/                    # Auto-generated SQL migration history
│
├── tests/                             # Automated tests (mirrors src/server/)
│   └── server/
│       ├── auth.test.ts
│       └── todos.test.ts
│
├── scripts/
│   └── build-client.mjs               # esbuild script that compiles src/client → public/
│
├── docs/
│   └── project-structure.md           # This file
│
├── .env                               # Real secrets — NEVER commit this file
├── .env.example                       # Template showing which variables are needed
├── package.json
├── tsconfig.json                      # TypeScript config for the backend (src/server/)
├── tsconfig.client.json               # TypeScript config for the frontend (src/client/)
└── tailwind.config.js
```

---

## Folder-by-Folder Explanation

### `src/server/` — The Backend

| Folder | What lives here | Why it exists |
|---|---|---|
| `config/` | App setup, session config, env variables | One place to change global settings without hunting through files |
| `routes/` | URL definitions — which function handles which URL | Separates "routing" from "logic" so you can see all endpoints at a glance |
| `controllers/` | Functions that receive `req`, call a service, send `res` | Thin layer — no business logic, just "glue" between HTTP and services |
| `services/` | Business logic — the real rules of the app | No Express objects here, so services are easy to test and reuse |
| `middlewares/` | Functions that run before controllers (auth checks, validation) | Avoids copy-pasting the same check at the top of every controller |
| `database/queries/` | Prisma/SQL query functions | Keeps database calls out of services so swapping ORMs only changes one folder |
| `emails/` | Email HTML templates + Nodemailer wrapper | Groups templates with the code that sends them |
| `utils/` | Small, generic helpers (hashing, logging, error class) | Prevents repeated utility code scattered across the codebase |

### `src/client/` — The Frontend

| Folder | What lives here | Why it exists |
|---|---|---|
| `pages/` | One `.html` file per screen | Makes it obvious how many screens the app has |
| `components/` | TypeScript functions that create and return DOM elements | Reusable UI without a framework — `TodoItem.ts` is used in `todos.ts` |
| `scripts/` | One `.ts` file per page — event listeners, API calls, rendering | Each page has exactly one entry point, easy to find |
| `lib/` | Shared utilities used across multiple scripts | Prevents duplicating fetch logic or translation calls in every script |
| `locales/` | `en.json`, `fr.json`, etc. | Adding a new language = adding one JSON file |
| `styles/` | Tailwind directives | Single CSS source — Tailwind generates the rest |

### `public/` — The Build Output
Everything here is **auto-generated** by build scripts. Interns should **never edit files here directly**. Express serves this folder as static files.

---

## How a Request Flows Through the Application

Using **"user submits a new todo"** as the example:

```
1. BROWSER
   └── todos.html is open. User types "Buy milk" and clicks Add.
       todos.ts → calls api.ts → sends POST /api/todos  { title: "Buy milk" }
       (Cookie with session ID is sent automatically by the browser)

2. EXPRESS — middlewares/requireAuth.ts
   └── Checks: does req.session.userId exist?
       YES → continues to the route handler
       NO  → returns 401 Unauthorized

3. EXPRESS — routes/todos.routes.ts
   └── Matches POST /api/todos
       → calls todos.controller.ts → createTodo()

4. CONTROLLER — controllers/todos.controller.ts → createTodo()
   └── Reads req.body.title and req.session.userId
       → calls todos.service.ts → addTodo(userId, title)
       (No business logic here — just reads input and sends output)

5. SERVICE — services/todos.service.ts → addTodo()
   └── Validates: title must not be empty
       → calls todos.queries.ts → insertTodo(userId, title)
       (No Express objects here — pure logic, easy to unit-test)

6. DATABASE — database/queries/todos.queries.ts → insertTodo()
   └── Calls Prisma: prisma.todo.create({ data: { userId, title } })
       → PostgreSQL stores the row
       → Returns the new todo object

7. BACK UP THE CHAIN
   └── queries returns todo → service returns todo → controller receives todo
       controller sends: res.status(201).json({ todo })

8. BROWSER
   └── api.ts receives the JSON response
       todos.ts calls TodoItem.ts component → creates a new <li> element
       Appends it to the list on the page — no page reload needed
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client (run after changing schema.prisma)
npm run db:generate

# Create database tables
npm run db:migrate

# Start everything (server + CSS watcher + JS watcher)
npm run dev

# Type-check all TypeScript (backend + frontend)
npm run typecheck

# Run tests
npm test
```

---

## Best Practices for Interns

1. **One file, one responsibility.** A controller only reads request data and sends responses. A service only contains business logic. A query file only talks to the database. If a file is doing two jobs, split it.

2. **Never put secrets in code.** All API keys, database URLs, and session secrets go in `.env`. The `.env.example` file shows which variables exist, with placeholder values — commit that, never `.env`.

3. **`public/` is build output — never edit it by hand.** If you change a file in `public/` manually, the next build will overwrite your change. Always edit in `src/client/`, then rebuild.

4. **Adding a new API endpoint always follows the same path:**
   ```
   routes/ → controllers/ → services/ → database/queries/
   ```
   Never skip a layer.

5. **The `requireAuth` middleware is your friend.** Any route that needs a logged-in user gets `requireAuth` as its middleware. Auth logic is written once, not copy-pasted into every controller.

6. **Keep components small and focused.** `TodoItem.ts` creates one `<li>`. `Navbar.ts` creates the nav bar. If a component file grows long, it probably needs to be split.

7. **Adding a new language is one file.** Copy `src/client/locales/en.json`, rename it (e.g. `es.json`), translate the values, and add the option to the language selector in `Navbar.ts`.
