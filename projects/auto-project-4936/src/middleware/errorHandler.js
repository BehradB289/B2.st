```js
/**
 * ─── Global Error Handler Middleware ───
 * Catches unhandled errors and returns a consistent JSON response.
 */

const { sendError } = require('../utils/response');

function errorHandler(err, req, res, _next) {
  console.error(`❌ [${new Date().toISOString()}] ${err.stack || err.message}`);

  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Request body contains invalid JSON.');
  }

  // Default 500
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message || 'Internal server error.';

  return sendError(res, 500, 'INTERNAL_ERROR', message);
}

module.exports = errorHandler;
```