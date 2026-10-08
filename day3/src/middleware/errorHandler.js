const { ZodError } = require('zod');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Zod validation errors get a 400 with field-level details
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const status = err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal Server Error';

  console.error(`[ERROR] ${req.requestId} ${err.stack || err.message}`);

  res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
