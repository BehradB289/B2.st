```js
/**
 * ─── Authentication Routes ───
 * POST /auth/register — Create new account
 * POST /auth/login    — Login and receive JWT
 * GET  /auth/me       — Get current user profile (protected)
 */

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');

const config = require('../config');
const { db } = require('../db');
const { users } = require('../db/schema');
const authGuard = require('../middleware/authGuard');
const { sendSuccess, sendError } = require('../utils/response');
const { validateEmail, validateUsername, validatePassword } = require('../utils/validators');

const router = Router();

// ─── Helper: Generate JWT ───
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, plan: user.plan },
    config.jwtSecret,
    { expiresIn: config.tokenExpiry }
  );
}

// ─── Helper: Sanitize user object (strip password_hash) ───
function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    createdAt: user.createdAt,
  };
}

// ═══════════════════════════════════════
// POST /auth/register
// ═══════════════════════════════════════
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, username, displayName } = req.body;

    // ── Validate inputs ──
    const emailErr = validateEmail(email);
    if (emailErr) return sendError(res, 400, 'VALIDATION_ERROR', emailErr);

    const usernameErr = validateUsername(username);
    if (usernameErr) return sendError(res, 400, 'VALIDATION_ERROR', usernameErr);

    const passwordErr = validatePassword(password);
    if (passwordErr) return sendError(res, 400, 'VALIDATION_ERROR', passwordErr);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // ── Check for existing email ──
    const existingEmail = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get();

    if (existingEmail) {
      return sendError(res, 409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    }

    // ── Check for existing username ──
    const existingUsername = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .get();

    if (existingUsername) {
      return sendError(res, 409, 'USERNAME_EXISTS', 'This username is already taken.');
    }

    // ── Hash password ──
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // ── Insert user ──
    const result = db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        username: normalizedUsername,
        displayName: displayName?.trim() || normalizedUsername,
        plan: 'free',
      })
      .returning()
      .get();

    // ── Generate token ──
    const token = generateToken(result);

    return sendSuccess(
      res,
      {
        token,
        user: sanitizeUser(result),
      },
      201
    );
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// POST /auth/login
// ═══════════════════════════════════════
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Validate inputs ──
    if (!email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Find user ──
    const user = db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .get();

    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // ── Compare password ──
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // ── Generate token ──
    const token = generateToken(user);

    return sendSuccess(res, {
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════
// GET /auth/me (Protected)
// ═══════════════════════════════════════
router.get('/me', authGuard, (req, res, next) => {
  try {
    const user = db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .get();

    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found.');
    }

    return sendSuccess(res, { user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```