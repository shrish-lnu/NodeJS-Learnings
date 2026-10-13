const Task = require('../models/Task');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listTasks(userId, { status, priority, search, page, limit, sort, order }, isAdmin = false) {
  const filter = {
    ...(isAdmin ? {} : { userId }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && {
      $or: [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { description: { $regex: escapeRegex(search), $options: 'i' } },
      ],
    }),
  };

  const sortDir = order === 'asc' ? 1 : -1;

  const [total, data] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter)
      .populate(isAdmin ? { path: 'userId', select: 'email' } : '')
      .sort({ [sort]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getTaskById(id, userId, isAdmin = false) {
  const task = await Task.findById(id);
  if (!task) return null;
  if (!isAdmin && task.userId.toString() !== userId) return null;
  return task;
}

async function createTask(userId, data) {
  return Task.create({ ...data, userId });
}

async function updateTask(id, userId, data, isAdmin = false) {
  const task = await getTaskById(id, userId, isAdmin);
  if (!task) return null;
  Object.assign(task, data);
  return task.save();
}

async function deleteTask(id, userId, isAdmin = false) {
  const task = await getTaskById(id, userId, isAdmin);
  if (!task) return false;
  await task.deleteOne();
  return true;
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask };
