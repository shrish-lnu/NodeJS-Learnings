const User = require('../models/User');
const taskService = require('../services/taskService');
const authService = require('../services/authService');
const { listQuerySchema } = require('../validators/taskValidator');

async function getAllUsers(req, res) {
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'userId',
        as: 'tasks',
      },
    },
    {
      $addFields: { taskCount: { $size: '$tasks' } },
    },
    {
      $project: { password: 0, __v: 0, tasks: 0 },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const data = users.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
  res.json({ data, total: data.length });
}

async function getAllTasks(req, res) {
  const query = listQuerySchema.parse(req.query);
  const result = await taskService.listTasks(null, query, true);
  res.json(result);
}

async function cleanupTokens(req, res) {
  const count = await authService.cleanupExpiredTokens();
  res.json({ message: `Cleaned up ${count} expired refresh token(s)` });
}

module.exports = { getAllUsers, getAllTasks, cleanupTokens };
