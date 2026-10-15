const { Server } = require('socket.io');
const logger = require('../config/logger');

let io;

// Call once with the http.Server instance to set up Socket.IO
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' }, // tighten in production
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket client connected');

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket client disconnected');
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

// Broadcast a task event to all connected clients
function emitTaskEvent(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

// Gracefully close all socket connections
function closeSocket() {
  return new Promise((resolve) => {
    if (io) {
      io.close(resolve);
    } else {
      resolve();
    }
  });
}

module.exports = { initSocket, emitTaskEvent, closeSocket };
