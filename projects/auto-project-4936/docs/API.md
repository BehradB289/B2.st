```markdown
# 📡 LinkBox API Documentation

## Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "myusername",
  "displayName": "My Name"    // optional
}
```

**Success (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "myusername",
      "displayName": "My Name",
      "plan": "free",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success (200):** Same structure as register.

### Get Current User (Protected)
```
GET /auth/me
Authorization: Bearer <token>
```

**Success (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

## ❌ Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INVALID_JSON` | 400 | Malformed JSON body |
| `AUTH_MISSING` | 401 | No Authorization header |
| `AUTH_MALFORMED` | 401 | Bad header format |
| `TOKEN_EXPIRED` | 401 | JWT has expired |
| `TOKEN_INVALID` | 401 | Invalid JWT |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `USERNAME_EXISTS` | 409 | Username already taken |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🏥 Health Check
```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "LinkBox",
    "version": "1.0.0",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```
```