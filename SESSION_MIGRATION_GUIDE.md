# Migration: From localStorage to Secure Database Sessions

## Summary of Changes

This document explains the security upgrade from client-side localStorage to server-side HTTP-Only Cookie sessions.

## What Changed

### Before (Insecure localStorage):
```javascript
// Stored in localStorage (accessible via JavaScript)
localStorage.setItem('empi_buyer_profile', JSON.stringify(buyer));

// Problems:
// - XSS attacks can steal the data
// - User can manually modify it
// - Synchronized across browser tabs unpredictably
```

### After (Secure HTTP-Only Cookies + Database):
```typescript
// Secure HTTP-only cookie (NOT accessible via JavaScript)
response.cookies.set({
  name: 'empi_session',
  value: sessionToken,
  httpOnly: true,    // ← Can't be stolen by JavaScript
  secure: true,      // ← Only sent over HTTPS
  sameSite: 'lax',   // ← CSRF protection
});

// Session stored in MongoDB (server validates everything)
// Browser only holds a cryptographic token
```

## New API Endpoints

### 1. Login - `/api/auth/login` (POST)
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "buyer": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+234812345678"
  }
}
```

**Sets HTTP-only cookie:** `empi_session`

### 2. Logout - `/api/auth/logout` (POST)
**Request:** (No body needed - uses cookie)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Clears the session cookie**

### 3. Verify Session - `/api/auth/me` (GET)
**Request:** (No body needed - uses cookie)

**Response:**
```json
{
  "success": true,
  "buyer": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Status:** 
- 200 if session is valid
- 401 if session expired or invalid

## Security Benefits

| Feature | localStorage | HTTP-Only Cookies |
|---------|--------------|------------------|
| JavaScript Access | ❌ Vulnerable to XSS | ✅ Not accessible (httpOnly=true) |
| Manual Modification | ❌ User can edit | ✅ Browser prevents access |
| Server Validation | ❌ None | ✅ Server validates every request |
| HTTPS Only | ❌ No | ✅ Yes (secure flag) |
| CSRF Protection | ❌ No | ✅ Yes (sameSite=lax) |
| Expiration | ❌ Manual | ✅ Automatic (maxAge) |
| Cross-tab Sync | ❌ Inconsistent | ✅ Consistent (server source of truth) |

## Session Lifecycle

1. **User Logs In:**
   - POST `/api/auth/login` with credentials
   - Server validates password
   - Creates cryptographic session token
   - Stores session data in MongoDB
   - Returns token in HTTP-only cookie

2. **User Makes Requests:**
   - Browser automatically includes `empi_session` cookie
   - Server validates token against MongoDB
   - Checks if session is not expired
   - Proceeds with request

3. **Session Expires (7 days):**
   - Server detects expired `sessionExpiry`
   - Returns 401 Unauthorized
   - Browser clears cookie
   - User redirected to login

4. **User Logs Out:**
   - POST `/api/auth/logout`
   - Server clears `sessionToken` in MongoDB
   - Server clears cookie
   - User redirected to login

## Migration Steps for Frontend

### Old Way (localStorage):
```typescript
const { buyer, login, logout } = useBuyer();

const handleLogin = async (email, password) => {
  const buyerData = await response.json();
  login(buyerData); // Stored in localStorage
};

const handleLogout = () => {
  logout(); // Cleared localStorage
};
```

### New Way (HTTP-only + API):
```typescript
const handleLogin = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const { buyer } = await response.json();
  // Cookie is set automatically by browser
  // No need to store anything in localStorage
};

const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  // Cookie is cleared automatically by browser
};
```

## Current Implementation Status

✅ **Complete:**
- `/api/auth/login` - Creates secure session
- `/api/auth/logout` - Destroys session
- `/api/auth/me` - Validates session
- Buyer schema updated with session fields

📋 **Next Steps (Phase 2):**
- Update BuyerContext to use new API endpoints
- Remove localStorage completely
- Add middleware for automatic session validation
- Update AuthForm to use new login endpoint

## Testing

### Test Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Session:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: empi_session=<token>"
```

### Test Logout:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: empi_session=<token>"
```

## FAQ

**Q: Will this break my existing app?**
A: Currently, the old localStorage system is still in place. The new endpoints are ready, but the frontend still uses localStorage. We'll migrate the BuyerContext next.

**Q: What about mobile?**
A: HTTP-only cookies work on mobile browsers and mobile apps (with proper cookie handling).

**Q: What if someone steals my session token from the database?**
A: The token is generated using `crypto.randomBytes(32)` - cryptographically secure and 256-bit. Additionally, the session is tied to the specific user and can only be used once (validated on every request).

**Q: Can I see my session token?**
A: No - it's stored in an HTTP-only cookie that JavaScript cannot access. This is the security feature!

