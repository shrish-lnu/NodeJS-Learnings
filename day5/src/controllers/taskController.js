const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

const taskService = require('../services/taskService');
const { emitTaskEvent } = require('../sockets/taskSocket');
const { createTaskSchema, updateTaskSchema, listQuerySchema } = require('../validators/taskValidator');

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function list(req, res) {
  const query = listQuerySchema.parse(req.query);
  const result = await taskService.listTasks(req.user.id, query);

  // Tell the client whether data came from cache
  res.setHeader('X-Cache', result.fromCache ? 'HIT' : 'MISS');
  res.json(result);
}

async function getOne(req, res) {
  const task = await taskService.getTaskById(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

async function create(req, res) {
  const data = createTaskSchema.parse(req.body);
  const task = await taskService.createTask(req.user.id, data);

  // Broadcast real-time event to all connected Socket.IO clients
  emitTaskEvent('task:created', { task: task.toJSON(), userId: req.user.id });

  res.status(201).json(task);
}

async function update(req, res) {
  const data = updateTaskSchema.parse(req.body);
  const task = await taskService.updateTask(req.params.id, req.user.id, data);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  emitTaskEvent('task:updated', { task: task.toJSON(), userId: req.user.id });

  res.json(task);
}

async function remove(req, res) {
  const deleted = await taskService.deleteTask(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });

  emitTaskEvent('task:deleted', { taskId: req.params.id, userId: req.user.id });

  res.status(204).send();
}

// ── FILE UPLOAD / DOWNLOAD ────────────────────────────────────────────────────

// POST /tasks/:id/attachments  (multer middleware applied in the router)
async function uploadAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const attachment = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  };

  const task = await taskService.addAttachment(req.params.id, req.user.id, attachment);
  if (!task) {
    // Task not found — delete the orphaned file
    fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: 'Task not found' });
  }

  res.status(201).json({ message: 'File uploaded', attachment, taskId: task.id });
}

// GET /tasks/:id/attachments/:filename
async function downloadAttachment(req, res) {
  const task = await taskService.getTaskById(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const attachment = task.attachments.find((a) => a.filename === req.params.filename);
  if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

  const filePath = path.join(process.cwd(), 'uploads', attachment.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File no longer exists on disk' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalname}"`);
  res.setHeader('Content-Type', attachment.mimetype);
  res.sendFile(filePath);
}

// ── CSV REPORT (worker thread) ────────────────────────────────────────────────

// GET /tasks/report
// Generates a CSV of the user's tasks in a worker thread so the main thread is not blocked.
async function downloadReport(req, res) {
  const { data: tasks } = await taskService.listTasks(
    req.user.id,
    { page: 1, limit: 1000, sort: 'createdAt', order: 'desc' },
  );

  // Convert Mongoose docs to plain objects for the worker
  const plainTasks = tasks.map((t) => t.toJSON());

  const workerPath = path.join(__dirname, '../workers/reportWorker.js');

  const csv = await new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { workerData: { tasks: plainTasks } });
    worker.on('message', ({ csv }) => resolve(csv));
    worker.on('error', reject);
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tasks-report.csv"');
  res.send(csv);
}

module.exports = { list, getOne, create, update, remove, uploadAttachment, downloadAttachment, downloadReport };
