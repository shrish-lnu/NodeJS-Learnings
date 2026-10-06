# File Organizer (Node.js Day 1)

A small CLI tool that sorts the files in a folder into subfolders by file extension.

## Setup

```
npm install
```

Create a `.env` file:

```
LOG_FILE=app.log
```

## Usage

```
node index.js <folder>
```

Example: `report.pdf` and `notes.txt` become `pdf/report.pdf` and `txt/notes.txt`.
Files with no extension go into `other/`.

Every action is logged to the console and to the file set in `LOG_FILE`.

## Files

- `index.js` - the organizer (uses `fs`, `path`, `process.argv`, `dotenv`)
- `logger.js` - custom EventEmitter logger with `info`, `warn` and `error` events
- `esm-demo.mjs` - same idea using `import` (run with `node esm-demo.mjs`)

## Checkpoint

**What does `require` do?**
It loads another file or module and gives back what that file exports (`module.exports`). Node reads the file, runs it once, and caches the result, so requiring it again returns the same thing.

**What is `process.nextTick`?**
It schedules a function to run as soon as the current code finishes, before the event loop continues to timers or I/O. It runs even before promise callbacks.

**Why is Node "non-blocking"?**
Node runs your JavaScript on one thread, but slow work (reading files, network calls) is handed off to the system. Node keeps running other code, and when the work is done, a callback is added to the event loop. So one slow task doesn't freeze everything else.
