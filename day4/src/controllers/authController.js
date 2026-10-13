const authService = require('../services/authService');
const { registerSchema, loginSchema, tokenSchema } = require('../validators/authValidator');

async function register(req, res) {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);
  res.status(201).json({ message: 'User registered successfully', user });
}

async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.json(result);
}

async function refresh(req, res) {
  const { refreshToken } = tokenSchema.parse(req.body);
  const result = await authService.refreshAccessToken(refreshToken);
  res.json(result);
}

async function logout(req, res) {
  const { refreshToken } = tokenSchema.parse(req.body);
  await authService.logout(refreshToken);
  res.json({ message: 'Logged out successfully' });
}

async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, refresh, logout, getMe };
