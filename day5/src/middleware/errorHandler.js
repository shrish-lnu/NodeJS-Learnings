const { ZodError } = require('zod');
const mongoose = require('mongoose');
const logger = require('../config/logger');

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Maximum size is ${process.env.UPLOAD_MAX_MB || 5} MB` });
  }
  if (err.message && err.message.startsWith('File type')) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ error: 'Validation failed', details });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    if (keys.includes('title') && keys.includes('userId')) {
      return res.status(409).json({ error: 'You already have a task with this title' });
    }
    return res.status(409).json({ error: `${keys[0] || 'field'} already exists` });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
