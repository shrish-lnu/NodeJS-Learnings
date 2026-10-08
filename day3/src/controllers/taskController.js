const taskService = require('../services/taskService');
const {
  createTaskSchema,
  replaceTaskSchema,
  updateTaskSchema,
  listQuerySchema,
} = require('../validators/taskValidator');

function list(req, res) {
  const query = listQuerySchema.parse(req.query);
  const result = taskService.listTasks(query);
  res.json(result);
}

function getOne(req, res) {
  const task = taskService.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

function create(req, res) {
  const data = createTaskSchema.parse(req.body);
  const task = taskService.createTask(data);
  res.status(201).json(task);
}

function replace(req, res) {
  const data = replaceTaskSchema.parse(req.body);
  const task = taskService.replaceTask(req.params.id, data);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

function update(req, res) {
  const data = updateTaskSchema.parse(req.body);
  const task = taskService.updateTask(req.params.id, data);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

function remove(req, res) {
  const deleted = taskService.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
}

module.exports = { list, getOne, create, replace, update, remove };
