# Day 3 - Express & REST API Design

A Task Manager REST API built with Express, Zod validation, custom middleware, and in-memory storage.

---

## Folder Structure

```
day3/
  src/
    app.js                   - Express app entry point
    routes/tasks.js          - Route definitions for /tasks
    controllers/taskController.js  - Request handlers
    services/taskService.js  - Business logic + in-memory store
    middleware/
      requestId.js           - Attaches X-Request-ID to every request
      logger.js              - Custom request logger
      rateLimiter.js         - 60 req/min per IP
      asyncHandler.js        - Wraps async handlers to forward errors
      errorHandler.js        - Global error handler + 404 handler
    validators/taskValidator.js    - Zod schemas
  package.json
```

---

## Setup

```bash
cd day3
npm install
npm run dev
```

Server runs on http://localhost:3000

---

## API Endpoints

GET    /health         - Health check
GET    /tasks          - List tasks (supports filtering, sorting, pagination)
POST   /tasks          - Create a task
GET    /tasks/:id      - Get a single task
PUT    /tasks/:id      - Replace a task (all fields required)
PATCH  /tasks/:id      - Update specific fields only
DELETE /tasks/:id      - Delete a task

---

## Task Shape

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "todo | in-progress | done",
  "priority": "low | medium | high",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

---

## Query Params for GET /tasks

status    - filter by status (todo, in-progress, done)
priority  - filter by priority (low, medium, high)
search    - search in title and description
sort      - field to sort by (default: createdAt)
order     - asc or desc (default: desc)
page      - page number (default: 1)
limit     - results per page, max 100 (default: 10)

Example: GET /tasks?status=todo&priority=high&sort=title&order=asc&page=1&limit=5

---

## Error Responses

All errors return a consistent shape:

```json
{ "error": "message" }
```

Validation errors also include field details:

```json
{
  "error": "Validation Error",
  "details": [{ "field": "title", "message": "Title is required" }]
}
```

Status codes used:
- 400 - Validation error
- 404 - Task or route not found
- 429 - Rate limit exceeded
- 500 - Unexpected server error

---

## Middleware Order

requestId -> requestLogger -> rateLimiter -> morgan -> routes -> 404 -> errorHandler

Order matters because:
- requestId runs first so every subsequent middleware can read req.requestId
- rateLimiter runs before routes so blocked requests never reach business logic
- notFoundHandler is after all routes so Express only falls through to it when no route matched
- errorHandler is last and has four params (err, req, res, next) — Express uses the param count to identify error middleware

---

## PUT vs PATCH

PUT replaces the entire resource. All fields are required. Missing fields reset to defaults.
PATCH applies a partial update. Only provided fields are changed. Others stay as-is.

Example: a task has title, description, status, priority.
- PUT without description resets description to ""
- PATCH without description leaves description unchanged
