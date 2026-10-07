# Day 2 Checkpoint

## Microtasks vs Macrotasks

Node runs code in this order:

1. **Sync code** — whatever is running right now
2. **nextTick** — runs immediately after current code, before anything else
3. **Promise.then** — runs next (microtask)
4. **setTimeout / setImmediate** — runs last (macrotask)

Microtasks (nextTick, Promise.then) always finish before macrotasks (setTimeout, setImmediate) get a turn.

---

## Streams vs readFile

Use **readFile** when the file is small (a few MB at most) and you need everything in memory.

Use **streams** when the file is large (logs, CSVs, videos). Streams read the file a little chunk at a time so you never load it all into memory at once. If you do `readFile` on a 2GB file, Node might crash. A stream handles it fine.

---

## Files in this folder

1-file-reader.js — Callback, Promise, async/await
2-parallel-vs-sequential.js — Promise.all, allSettled, timing
3-stream-copy.js — pipeline, Transform stream, line counter
4-http-server.js — Raw http server, routing, JSON parsing
5-event-loop.js — setTimeout, nextTick, Promise order
