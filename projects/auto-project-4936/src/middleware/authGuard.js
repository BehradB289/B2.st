```js
/**
 * ─── JWT Authentication Middleware ───
 * Reads Authorization: Bearer <token>
 * Verifies token and attaches req.user = { userId, plan }
 * Returns 401 on failure.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendError } = require('../utils/response');

function authGuard(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, 401, 'AUTH_MISSING', 'Authorization header is required.');
  }

  // Expect format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return sendError(res, 401, 'AUTH_MALFORMED', 'Authorization header must be: Bearer <token>');
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      plan: decoded.plan,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'TOKEN_EXPIRED', 'Token has expired. Please login again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'TOKEN_INVALID', 'Invalid token.');
    }
    return sendError(res, 401, 'AUTH_FAILED', 'Authentication failed.');
  }
}

module.exports = authGuard;
```