const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const env = require('../config/env');

// Pre-computed hash used for timing-safe login (prevents user enumeration)
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

function appError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function generateAccessToken(userId, role) {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

async function register({ email, password }) {
  const hashed = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await User.create({ email, password: hashed });
  return user;
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');

  const hashToCompare = user ? user.password : DUMMY_HASH;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !valid) {
    throw appError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRES_IN_DAYS);

  const { token: refreshToken } = await RefreshToken.create({
    token: randomUUID(),
    userId: user._id,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user._id.toString(), email: user.email, role: user.role },
  };
}

async function refreshAccessToken(token) {
  const stored = await RefreshToken.findOne({ token }).populate('userId', 'email role');

  if (!stored) throw appError('Invalid refresh token', 401);

  if (stored.expiresAt < new Date()) {
    await stored.deleteOne();
    throw appError('Refresh token expired. Please log in again.', 401);
  }

  const user = stored.userId;
  const accessToken = generateAccessToken(user._id.toString(), user.role);

  return {
    accessToken,
    user: { id: user._id.toString(), email: user.email, role: user.role },
  };
}

async function logout(token) {
  await RefreshToken.deleteOne({ token });
}

async function cleanupExpiredTokens() {
  const { deletedCount } = await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
  return deletedCount;
}

module.exports = { register, login, refreshAccessToken, logout, cleanupExpiredTokens };
