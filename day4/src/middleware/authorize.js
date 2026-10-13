function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error('Not authenticated');
      err.status = 401;
      return next(err);
    }
    if (!roles.includes(req.user.role)) {
      const err = new Error('Forbidden: insufficient permissions');
      err.status = 403;
      return next(err);
    }
    next();
  };
}

module.exports = authorize;
