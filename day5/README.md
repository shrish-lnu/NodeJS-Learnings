# Day 5 – Advanced Features, Performance & Deployment

Builds on the Day 4 secured Task API by adding file uploads, real-time WebSocket updates, background email reminders, in-memory caching, worker threads, structured logging, and graceful shutdown.

---

## What's new in Day 5

| Feature | Package | Where |
|---|---|---|
| File uploads | multer | `POST /tasks/:id/attachments` |
| Real-time events | socket.io | Broadcast on task create/update/delete |
| Background email job | node-cron + nodemailer | Runs daily at 08:00 UTC |
| In-memory cache | built-in Map | `GET /tasks` — invalidated on mutations |
| Worker thread | worker_threads | `GET /tasks/report` CSV generation |
| Structured logging | pino + pino-http | All logs in JSON (pretty in dev) |
| Graceful shutdown | Node signals | SIGTERM/SIGINT closes server → socket → job → DB |
| CI | GitHub Actions | Syntax check on push/PR |

---

## Project structure

```
day5/
├── src/
│   ├── config/        env.js, database.js, logger.js
│   ├── controllers/   authController, taskController, adminController
│   ├── jobs/          reminderJob.js  (node-cron)
│   ├── middleware/    asyncHandler, authenticate, authorize, errorHandler, rateLimiter, upload
│   ├── models/        Task.js (+ dueDate, attachments), User.js, RefreshToken.js
│   ├── routes/        auth.js, tasks.js, admin.js
│   ├── services/      authService, taskService (with cache), cacheService, emailService
│   ├── sockets/       taskSocket.js  (Socket.IO)
│   ├── validators/    authValidator.js, taskValidator.js
│   ├── workers/       reportWorker.js  (worker_threads)
│   └── app.js         entry point
├── public/
│   ├── realtime.html  live-update demo page
│   └── realtime.js
├── uploads/           multer file storage (git-ignored)
├── .env.example
└── README.md
```

---

## Getting started

```bash
cd day5
cp .env.example .env   # fill in MONGODB_URI and JWT secrets
npm install
npm run dev
```

---

## API endpoints

All task and admin routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, get access + refresh token |
| POST | `/auth/refresh` | Get a new access token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Get current user |

### Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | List tasks (cached, `X-Cache: HIT/MISS`) |
| POST | `/tasks` | Create task, emits `task:created` |
| GET | `/tasks/:id` | Get one task |
| PATCH | `/tasks/:id` | Update task, emits `task:updated` |
| DELETE | `/tasks/:id` | Delete task, emits `task:deleted` |
| POST | `/tasks/:id/attachments` | Upload file (`multipart/form-data`, field: `file`) |
| GET | `/tasks/:id/attachments/:filename` | Download file |
| GET | `/tasks/report` | Download CSV report (generated in worker thread) |

### Admin (ADMIN role only)
| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | All users with task counts |
| GET | `/admin/tasks` | All tasks across all users |
| POST | `/admin/cleanup-tokens` | Delete expired refresh tokens |
| POST | `/admin/trigger-reminders` | Run the reminder job immediately |

---

## Real-time demo

Open `http://localhost:3000/realtime.html` in your browser, then create/update/delete tasks via the API. Events appear live without refreshing.

---

## Key concepts

**WebSockets vs HTTP**
HTTP is request–response: the client always asks, the server replies once and closes. WebSockets keep a persistent two-way connection open, so the server can push events to clients at any time. Socket.IO wraps WebSockets and falls back to polling automatically.

**Caching and invalidation**
The `GET /tasks` response is stored in a Map for `CACHE_TTL_SECONDS`. A request that hits the cache gets `X-Cache: HIT` and skips the database. When a task is created, updated, or deleted, all cache entries for that user are deleted (by prefix) so the next list fetch is always fresh.

**Worker thread vs cluster**
- Use a **worker thread** for a single CPU-heavy operation (CSV/PDF generation, image resizing) that would block the event loop. The work runs in a separate thread; the main thread stays responsive.
- Use **cluster** to handle more concurrent HTTP requests by running one Node.js process per CPU core. It scales throughput, not individual task speed.

**Graceful shutdown**
On SIGTERM/SIGINT: stop accepting new HTTP connections → close Socket.IO connections → stop the cron job → disconnect from MongoDB → exit. This avoids dropping in-flight requests or corrupting the database. Test with `npm start` (not `npm run dev`) since nodemon intercepts Ctrl+C.

---

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `MONGODB_URI` | — | Required |
| `JWT_ACCESS_SECRET` | — | Required, min 32 chars |
| `JWT_REFRESH_SECRET` | — | Required, min 32 chars |
| `PORT` | `3000` | |
| `NODE_ENV` | `development` | |
| `UPLOAD_MAX_MB` | `5` | Max file size for uploads |
| `CACHE_TTL_SECONDS` | `30` | How long list results are cached |
| `EMAIL_HOST` | (Ethereal) | Leave empty in dev; prints preview URL |
| `EMAIL_PORT` | `587` | |
| `EMAIL_USER` | — | |
| `EMAIL_PASS` | — | |
| `EMAIL_FROM` | `noreply@tasks.local` | |
