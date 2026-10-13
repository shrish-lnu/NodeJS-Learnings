const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet());

const corsOptions = {
  origin:
    env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
      : true,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing — 10 kb limit guards against large-payload DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(apiLimiter);

app.get('/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ status: 'ok', env: env.NODE_ENV, db: states[mongoose.connection.readyState] });
});

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Server running at http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});

module.exports = app;
