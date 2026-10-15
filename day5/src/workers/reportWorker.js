// This file runs in a separate worker thread.
// The main thread sends task data via workerData; we generate a CSV and post it back.
const { workerData, parentPort } = require('worker_threads');

const tasks = workerData.tasks;

// Build CSV
const headers = 'id,title,status,priority,dueDate,createdAt\n';

const rows = tasks
  .map((t) => {
    const dueDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
    const createdAt = new Date(t.createdAt).toISOString().split('T')[0];
    // Escape double-quotes in title to keep CSV valid
    const title = `"${String(t.title || '').replace(/"/g, '""')}"`;
    return `${t.id},${title},${t.status},${t.priority},${dueDate},${createdAt}`;
  })
  .join('\n');

const csv = headers + rows;

parentPort.postMessage({ csv });
