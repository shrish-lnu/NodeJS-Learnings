const Task = require('../models/Task');
const cache = require('./cacheService');
const env = require('../config/env');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cacheKeyPrefix(userId) {
  return `tasks:${userId}:`;
}

async function listTasks(userId, query, isAdmin = false) {
  const { status, priority, search, page, limit, sort, order } = query;
  const cacheKey = `${cacheKeyPrefix(userId)}${JSON.stringify(query)}`;

  // Return cached result if available (skip cache for admin queries)
  if (!isAdmin) {
    const cached = cache.get(cacheKey);
    if (cached) return { ...cached, fromCache: true };
  }

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

  const result = { data, total, page, limit, totalPages: Math.ceil(total / limit) };

  if (!isAdmin) {
    cache.set(cacheKey, result, env.CACHE_TTL_SECONDS);
  }

  return result;
}

async function getTaskById(id, userId, isAdmin = false) {
  const task = await Task.findById(id);
  if (!task) return null;
  if (!isAdmin && task.userId.toString() !== userId) return null;
  return task;
}

async function createTask(userId, data) {
  const task = await Task.create({ ...data, userId });
  cache.delByPrefix(cacheKeyPrefix(userId)); // invalidate list cache
  return task;
}

async function updateTask(id, userId, data, isAdmin = false) {
  const task = await getTaskById(id, userId, isAdmin);
  if (!task) return null;
  Object.assign(task, data);
  const updated = await task.save();
  cache.delByPrefix(cacheKeyPrefix(userId));
  return updated;
}

async function deleteTask(id, userId, isAdmin = false) {
  const task = await getTaskById(id, userId, isAdmin);
  if (!task) return false;
  await task.deleteOne();
  cache.delByPrefix(cacheKeyPrefix(userId));
  return true;
}

async function addAttachment(id, userId, attachment) {
  const task = await getTaskById(id, userId);
  if (!task) return null;
  task.attachments.push(attachment);
  const updated = await task.save();
  cache.delByPrefix(cacheKeyPrefix(userId));
  return updated;
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask, addAttachment };
