const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const mongoose = require('mongoose');

const env = require('./config/env');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { initSocket, closeSocket } = require('./sockets/taskSocket');
const { startReminderJob, stopReminderJob } = require('./jobs/reminderJob');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');

const app = express();

// Security headers
app.use(helmet());

// Structured HTTP request logging (pino-http)
if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }));
}

const corsOptions = {
  origin:
    env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
      : true,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing — 10 kb limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Rate limiting
app.use(apiLimiter);

// Serve the Socket.IO realtime demo page
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ status: 'ok', env: env.NODE_ENV, db: states[mongoose.connection.readyState] });
});

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────

async function start() {
  await connectDB();

  const server = http.createServer(app);

  // Attach Socket.IO to the same HTTP server so /socket.io/* requests are handled
  initSocket(server);

  // Start daily email reminder cron job
  startReminderJob();

  server.listen(env.PORT, () => {
    logger.info(`Server running at http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    logger.info('Real-time demo: http://localhost:' + env.PORT + '/realtime.html');
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  // Order: stop accepting requests → close sockets → stop cron → disconnect DB
  async function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      await closeSocket();
      stopReminderJob();
      await disconnectDB();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Startup failed');
  process.exit(1);
});

module.exports = app;
