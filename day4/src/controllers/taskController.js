const taskService = require('../services/taskService');
const { createTaskSchema, updateTaskSchema, listQuerySchema } = require('../validators/taskValidator');

async function list(req, res) {
  const query = listQuerySchema.parse(req.query);
  const result = await taskService.listTasks(req.user.id, query);
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
  res.status(201).json(task);
}

async function update(req, res) {
  const data = updateTaskSchema.parse(req.body);
  const task = await taskService.updateTask(req.params.id, req.user.id, data);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

async function remove(req, res) {
  const deleted = await taskService.deleteTask(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };
