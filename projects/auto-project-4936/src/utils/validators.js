```js
/**
 * ─── Input Validation Helpers ───
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required.';
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) return 'Invalid email format.';
  return null; // no error
}

function validateUsername(username) {
  if (!username || typeof username !== 'string') return 'Username is required.';
  const trimmed = username.trim();
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.';
  }
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

function validateUrl(url) {
  if (!url || typeof url !== 'string') return 'URL is required.';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must start with http:// or https://';
    }
    return null;
  } catch {
    return 'Invalid URL format.';
  }
}

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  validateUrl,
};
```