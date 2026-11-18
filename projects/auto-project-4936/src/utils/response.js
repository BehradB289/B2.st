```js
/**
 * ─── Standardized API Response Helpers ───
 * Every response follows: { success: bool, data?: any, error?: { code, message } }
 */

/**
 * Send a success response
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error response
 */
function sendError(res, statusCode, code, message) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

module.exports = { sendSuccess, sendError };
```