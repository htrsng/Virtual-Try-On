const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { JWT_SECRET } = require("./config/env");

const requireDbReady = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database is not ready",
      code: "DB_NOT_READY",
    });
  }

  next();
};

const authenticateToken = async (req, res, next) => {
  if (req.user) return next();
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: 'Không có token xác thực', code: 'UNAUTHORIZED' });
  let payload;
  try {
    payload = jwt.verify(match[1], JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload.id !== 'string' || !/^[a-f\d]{24}$/i.test(payload.id)) throw new Error('Invalid subject');
  } catch (_) {
    return res.status(401).json({ message: 'Token không hợp lệ', code: 'UNAUTHORIZED' });
  }
  if (mongoose.connection.readyState !== 1) return requireDbReady(req, res, next);
  try {
    const user = await require('./models').UserModel.findById(payload.id).select('email role');
    if (!user) return res.status(401).json({ message: 'Token không hợp lệ', code: 'UNAUTHORIZED' });
    // Current stored role is authoritative, including after demotion/deletion.
    req.user = { id: String(user._id), email: user.email, role: user.role };
    next();
  } catch (error) { next(error); }
};

// Optional authentication: if token provided, verify and set req.user, otherwise continue as anonymous
const optionalAuthenticate = (req, res, next) => req.headers.authorization
  ? authenticateToken(req, res, next) : next();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền truy cập" });
  }

  next();
};

module.exports = {
  requireDbReady,
  authenticateToken,
  optionalAuthenticate,
  requireAdmin,
};
