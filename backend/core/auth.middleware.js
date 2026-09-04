const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'inst-sons-secret-jwt-key-2026';

/**
 * Middleware untuk memverifikasi JWT dari header Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token autentikasi tidak disediakan.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Format token tidak valid.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau telah kedaluwarsa.',
    });
  }
}

module.exports = authMiddleware;
