# Day 4 — Databases, Authentication & Security

A secured, persistent multi-user Task API built with Express, MongoDB (Mongoose), and JWT authentication.

---

## What's covered

- MongoDB with Mongoose — schema design, relations, indexes
- Password hashing with bcrypt
- JWT access + refresh token flow
- Role-based authorization (USER / ADMIN)
- Security — helmet, CORS, rate limiting, input sanitization
- Edge case handling across all routes

---

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**
```bash
cp .env.example .env
# Fill in MONGODB_URI and JWT secrets
```

**3. Start MongoDB**

Option A — MongoDB Atlas (free cloud):
Create a free cluster at https://cloud.mongodb.com and paste the connection string as `MONGODB_URI` in `.env`.

Option B — Docker (local):
```bash
docker compose up -d
```

**4. Seed the database**
```bash
npm run db:seed
# Creates admin@example.com (Admin@1234) and user@example.com (User@1234)
```

**5. Start the server**
```bash
npm run dev
```

---

## API Endpoints

### Auth

- `POST /auth/register` — create a new account
- `POST /auth/login` — login, returns accessToken + refreshToken
- `POST /auth/refresh` — get a new access token using refresh token
- `POST /auth/logout` — invalidate a refresh token
- `GET  /auth/me` — get current logged-in user (requires token)

### Tasks (all require Authorization header)

- `GET    /tasks` — list your tasks (supports filter, search, pagination)
- `POST   /tasks` — create a task
- `GET    /tasks/:id` — get one task
- `PATCH  /tasks/:id` — update a task
- `DELETE /tasks/:id` — delete a task

Query params for `GET /tasks`: `status`, `priority`, `search`, `page`, `limit`, `sort`, `order`

### Admin (ADMIN role only)

- `GET  /admin/users` — list all users with task counts
- `GET  /admin/tasks` — list all tasks across all users
- `POST /admin/cleanup-tokens` — manually delete expired refresh tokens

### Health

- `GET /health` — returns server status and DB connection state

---

## How to send authenticated requests

After login, copy the `accessToken` from the response and send it in every request:

```
Authorization: Bearer <your-accessToken-here>
```

---

## Edge Cases Covered

- Duplicate email on register → 409
- Duplicate task title for the same user → 409
- Wrong password or unknown email → same 401 message (no user enumeration)
- Expired access token → 401
- Invalid or malformed token → 401
- User deleted but token still valid → 401
- Expired refresh token → 401
- Regular user hitting admin route → 403
- User trying to access another user's task → 404 (doesn't reveal it exists)
- Invalid MongoDB ID in URL → 400
- Body larger than 10kb → 413
- Malformed JSON body → 400
- Too many login attempts (over 10 in 15min) → 429
- Missing env variables on startup → process exits with a clear message
- Search string with special regex characters → escaped before use (prevents ReDoS)

---

## Security Measures

- `helmet` adds secure HTTP headers on every response
- CORS is open in development, origin-restricted in production via `ALLOWED_ORIGINS`
- Rate limiting — 10 attempts per 15 min on auth routes, 100 per min globally
- Request body capped at 10kb to prevent large payload attacks
- Passwords are never returned in any response (`select: false` on the field)
- bcrypt with cost factor 10 makes brute force attacks impractical
- Refresh tokens are stored in the database so they can be revoked
- MongoDB TTL index automatically deletes expired refresh tokens
- Zod validates and rejects unexpected input types at the HTTP layer
- Search input is regex-escaped before hitting MongoDB

---

## Checkpoint

### Why hash passwords instead of encrypting them?

Encryption is reversible — if your database or encryption key leaks, every password is immediately recoverable. Hashing is a one-way operation with no reverse. Even with the full database, an attacker cannot get the original passwords back.

How it works in practice:

```
Register:  "Test@1234"  →  bcrypt.hash()  →  "$2a$10$xyz..."  (this is what gets stored)
Login:     "Test@1234"  →  bcrypt.compare("Test@1234", "$2a$10$xyz...")  →  true or false
```

The plain password never touches the database. On login you compare, not decrypt.

bcrypt is used specifically because it is slow by design. The cost factor (`BCRYPT_ROUNDS=10`) means each hash takes noticeable time. This makes brute force attacks impractical — billions of guesses per second becomes thousands. Each hash also contains a random salt, so two users with the same password produce completely different hashes.

**Where in code:** `src/services/authService.js`

---

### Where should JWTs be stored on the client?

There is no perfect option — it is a tradeoff between two attack types:

`localStorage` — JavaScript can read it, so an XSS attack on your page steals the token instantly.

`httpOnly cookie` — JavaScript cannot read it, so XSS is not a concern. But it is automatically sent on every request including cross-origin ones, which opens CSRF risks unless you add `sameSite: strict`.

The recommended approach:
- Store the **access token in memory** (a JS variable). It is short-lived (15min), never written to disk, and disappears on page refresh.
- Store the **refresh token in an httpOnly, sameSite strict cookie**. JS cannot touch it, it survives page refresh, and the strict same-site policy blocks CSRF.

When the page loads and the access token is gone, the app silently calls `POST /auth/refresh` with the cookie to get a new one.

**In our API:** both tokens are returned in the response body and the client decides where to store them.

---

### What does SQL injection look like?

SQL injection happens when user input is concatenated directly into a query string instead of being passed safely as a parameter.

**Classic example — login bypass:**
```sql
-- Intended query:
SELECT * FROM users WHERE email = 'input' AND password = 'input'

-- Attacker enters as email:  admin@example.com'--
-- Query becomes:
SELECT * FROM users WHERE email = 'admin@example.com' --' AND password = ''
-- Everything after -- is a comment. Password check is skipped. Attacker is logged in.
```

**MongoDB equivalent — NoSQL injection:**
```js
// Attacker sends:  { "email": { "$gt": "" }, "password": "anything" }
// Without validation, Mongoose runs:
db.users.findOne({ email: { $gt: "" } })
// $gt: "" matches every document — attacker logs in as the first user in the database
```

**How our app prevents both:**

Zod's `z.string().email()` only accepts a plain string. An object like `{ "$gt": "" }` fails validation and is rejected before it ever reaches MongoDB. Mongoose also uses parameterized queries internally so values are always treated as data, never as operators.

For search queries specifically, user input is passed through `escapeRegex()` in `taskService.js` before being used in a `$regex` query, which prevents a regex-based denial of service attack (ReDoS) where a crafted string causes the regex engine to hang.
