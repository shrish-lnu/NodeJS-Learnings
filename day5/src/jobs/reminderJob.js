const cron = require('node-cron');
const Task = require('../models/Task');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');

let job;

function startReminderJob() {
  // Run every day at 8:00 AM
  // Cron format: minute hour day month weekday
  job = cron.schedule('0 8 * * *', runReminders, { timezone: 'UTC' });
  logger.info('Reminder job scheduled (daily at 08:00 UTC)');
}

async function runReminders() {
  logger.info('Reminder job: checking for due tasks');

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find tasks due within the next 24 hours that are not yet completed
  const tasks = await Task.find({
    dueDate: { $gte: now, $lte: in24h },
    status: { $ne: 'DONE' },
  }).populate('userId', 'email');

  let sent = 0;
  for (const task of tasks) {
    if (!task.userId?.email) continue;

    try {
      await sendEmail({
        to: task.userId.email,
        subject: `Reminder: "${task.title}" is due soon`,
        html: `
          <h2>Task Due Soon</h2>
          <p>Your task <strong>${task.title}</strong> is due on
             <strong>${task.dueDate.toDateString()}</strong>.</p>
          <p>Status: ${task.status} | Priority: ${task.priority}</p>
        `,
      });
      sent++;
      logger.info({ taskId: task._id, to: task.userId.email }, 'Reminder sent');
    } catch (err) {
      logger.warn({ taskId: task._id, err: err.message }, 'Failed to send reminder, skipping');
    }
  }

  logger.info({ sent, checked: tasks.length }, 'Reminder job done');
}

function stopReminderJob() {
  if (job) {
    job.stop();
    logger.info('Reminder job stopped');
  }
}

// Export runReminders so it can be triggered manually (e.g. for testing via a route)
module.exports = { startReminderJob, stopReminderJob, runReminders };
