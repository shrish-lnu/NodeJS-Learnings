const { v4: uuidv4 } = require('uuid');

const tasks = new Map();

function createTask(data) {
  const now = new Date().toISOString();
  const task = { id: uuidv4(), ...data, createdAt: now, updatedAt: now };
  tasks.set(task.id, task);
  return task;
}

function getTaskById(id) {
  return tasks.get(id) || null;
}

function listTasks({ status, priority, search, sort, order, page, limit }) {
  let result = Array.from(tasks.values());

  if (status) result = result.filter((t) => t.status === status);
  if (priority) result = result.filter((t) => t.priority === priority);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => {
    const valA = a[sort];
    const valB = b[sort];
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return order === 'asc' ? cmp : -cmp;
  });

  const total = result.length;
  const totalPages = Math.ceil(total / limit);
  const data = result.slice((page - 1) * limit, page * limit);

  return { data, total, page, limit, totalPages };
}

function replaceTask(id, data) {
  const existing = tasks.get(id);
  if (!existing) return null;
  const updated = { id, createdAt: existing.createdAt, ...data, updatedAt: new Date().toISOString() };
  tasks.set(id, updated);
  return updated;
}

function updateTask(id, data) {
  const existing = tasks.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
  tasks.set(id, updated);
  return updated;
}

function deleteTask(id) {
  return tasks.delete(id);
}

module.exports = { createTask, getTaskById, listTasks, replaceTask, updateTask, deleteTask };
