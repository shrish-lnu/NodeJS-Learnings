const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

function appError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(appError('Missing or malformed Authorization header', 401));
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    return next(err);
  }

  const user = await User.findById(payload.sub).select('email role').lean();

  if (!user) {
    return next(appError('User account no longer exists', 401));
  }

  req.user = { id: user._id.toString(), email: user.email, role: user.role };
  next();
}

module.exports = authenticate;
