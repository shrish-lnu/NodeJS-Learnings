const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

const store = new Map(); // ip -> { count, resetAt }

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again after ${Math.ceil((entry.resetAt - now) / 1000)}s.`,
    });
  }

  entry.count += 1;
  next();
}

module.exports = rateLimiter;
