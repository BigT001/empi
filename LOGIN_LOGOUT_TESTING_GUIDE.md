# 🧪 Login/Logout Testing & Verification Guide

**Date:** November 27, 2025  
**Status:** TESTING PHASE - READY FOR VALIDATION  
**Application URL:** https://empi-mu.vercel.app/admin/dashboard

---

## 📋 Test Environment Setup

### Prerequisites
- Access to admin account credentials (email + password)
- Browser DevTools open (F12) for checking cookies and network requests
- Access to MongoDB (to manually verify sessions)

### Test Accounts
```
Email: admin@example.com
Password: [your_secure_password]
```

---

## 🧪 MANUAL TEST CASES

### TEST 1: Successful Login Flow
**Objective:** Verify successful login with valid credentials

**Steps:**
1. Navigate to https://empi-mu.vercel.app/admin/login
2. Enter valid email: `admin@example.com`
3. Enter valid password
4. Click "Login" button
5. Observe redirect to dashboard

**Expected Results:**
- ✅ Form validates without errors
- ✅ Loading spinner appears while submitting
- ✅ Redirected to `/admin/dashboard`
- ✅ Admin context shows logged-in user
- ✅ `admin_session` cookie is set (HttpOnly)
- ✅ Browser console shows `✅ Login successful` message

**Browser Console Check:**
```
[AdminContext] login() called for: admin@example.com
[AdminContext] login response status: 200
[AdminContext] ✅ Login successful for: admin@example.com
```

**Cookie Verification (DevTools → Application → Cookies):**
```
Name: admin_session
Value: [32-byte hex token]
HttpOnly: Yes
Secure: Yes (on production)
SameSite: Lax
```

---

### TEST 2: Invalid Email
**Objective:** Verify rejection of non-existent email

**Steps:**
1. Navigate to login page
2. Enter non-existent email: `nouser@example.com`
3. Enter any password
4. Click "Login"

**Expected Results:**
- ✅ Error message: "Invalid email or password"
- ✅ No session cookie created
- ✅ Remains on login page
- ✅ Rate limit counter shows 4 attempts remaining

**Console Check:**
```
[AdminContext] Login error: Error: Invalid email or password
[Admin Login] ❌ Admin not found: nouser@example.com
[RateLimit] Failed attempt 1/5 for IP: [IP]
```

---

### TEST 3: Invalid Password
**Objective:** Verify rejection of incorrect password

**Steps:**
1. Navigate to login page
2. Enter valid email: `admin@example.com`
3. Enter wrong password: `wrongpassword`
4. Click "Login"

**Expected Results:**
- ✅ Error message: "Invalid email or password (4 attempts remaining)"
- ✅ No session created
- ✅ Remains on login page
- ✅ Attempts counter decrements

**Console Check:**
```
[Admin Login] ❌ Invalid password for admin@example.com (4 attempts left)
[RateLimit] Failed attempt 1/5 for IP: [IP]
```

---

### TEST 4: Rate Limiting - Failed Attempts
**Objective:** Verify rate limiting after 5 failed attempts

**Steps:**
1. Make 5 failed login attempts in a row
2. On 6th attempt, observe error

**Expected Results:**
- ✅ After attempt 1: "4 attempts remaining"
- ✅ After attempt 2: "3 attempts remaining"
- ✅ After attempt 3: "2 attempts remaining"
- ✅ After attempt 4: "1 attempt remaining"
- ✅ After attempt 5: "0 attempts remaining"
- ✅ On attempt 6: "Too many failed login attempts. Please try again in 30 minutes."
- ✅ Status code: 429 (Too Many Requests)
- ✅ Login form disabled for 30 minutes

**Console Check:**
```
[RateLimit] 🔒 IP locked for 30 minutes: [IP]
```

**Verify Rate Limit Persistence:**
- [ ] Refresh page - still locked
- [ ] Close browser - still locked (stored in memory)
- [ ] Wait 30 minutes - lock expires
- [ ] Try login again - works

---

### TEST 5: Session Cookie Verification
**Objective:** Verify session cookie is secure and properly configured

**Steps:**
1. Successfully log in
2. Open DevTools (F12)
3. Go to Application → Cookies → admin_session
4. Inspect cookie properties

**Expected Results - Cookie Properties:**
```
Name: admin_session
Domain: [your-domain]
Path: /
Expires: [7 days from now]
HttpOnly: ✅ Yes (prevents XSS)
Secure: ✅ Yes (HTTPS only in production)
SameSite: Lax (prevents some CSRF)
```

**Verify Token Format:**
- ✅ 64-character hexadecimal string (32 bytes = 64 hex chars)
- ✅ Example: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2`

---

### TEST 6: Logout Flow
**Objective:** Verify complete logout and session clearance

**Steps:**
1. Log in successfully
2. Note the `admin_session` cookie value
3. Open sidebar → Click "Logout" button
4. Verify redirect to login page
5. Check DevTools cookies

**Expected Results:**
- ✅ Loading indicator appears
- ✅ Sidebar closes
- ✅ Context state clears (admin = null)
- ✅ Redirected to `/admin/login`
- ✅ `admin_session` cookie is deleted (maxAge=0)
- ✅ Server session token cleared in database
- ✅ No error messages

**Browser Console Check:**
```
[AdminContext] logout() called
[AdminContext] ✅ Admin state cleared to null
[AdminContext] Logout attempt 1/3...
[Logout API] POST /api/admin/logout called from IP: [IP]
[Logout API] ✅ Session cleared for admin: admin@example.com
[AdminContext] ✅ Logout API successful - session cleared on server
```

**Verify Cookie Deletion:**
- ✅ `admin_session` cookie no longer appears in DevTools
- ✅ Try to access `/admin/dashboard` → redirected to login

---

### TEST 7: Session Expiry (7 Days)
**Objective:** Verify session expires after 7 days

**Automated Test (for development/staging):**
```javascript
// In browser console:
// 1. Get current session token
let token = document.cookie.split('; ')
  .find(row => row.startsWith('admin_session='))
  .split('=')[1];

// 2. In MongoDB, manually set sessionExpiry to past date
// db.admins.updateOne(
//   { sessionToken: 'token' },
//   { $set: { sessionExpiry: new Date(Date.now() - 1000) } }
// )

// 3. Refresh browser → should redirect to login
// OR click any action → 401 response → redirect to login
```

**Manual Testing (for production validation):**
1. After successful login, note the login timestamp
2. Wait 7 days
3. Try to access any admin page
4. Observe automatic redirect to login page
5. See error message: "Session expired. Please log in again."

**Expected Results:**
- ✅ Automatic session expiry after exactly 7 days
- ✅ No manual action required
- ✅ Graceful redirect to login
- ✅ Clear error message about expiry
- ✅ Can log in again immediately

**Console Check:**
```
[AdminContext] ❌ Admin session expired or invalid (401)
[AdminContext] Session expired. Please log in again.
```

---

### TEST 8: Session Auto-Validation (Every 5 Minutes)
**Objective:** Verify periodic session validation

**Steps:**
1. Log in successfully
2. Leave page open and monitor console
3. Wait approximately 5 minutes
4. Check console for validation logs

**Expected Results:**
- ✅ Console shows `[AdminContext] Running periodic session validation...` every 5 minutes
- ✅ If session valid: `[AdminContext] ✅ Admin authenticated: admin@example.com`
- ✅ If session expired: redirects to login
- ✅ User stays logged in if session is valid

**Console Pattern (after 5 minutes):**
```
[AdminContext] Running periodic session validation...
[AdminContext] checkAuth response status: 200
[AdminContext] ✅ Admin authenticated: admin@example.com
```

---

### TEST 9: Session Validation on Page Reload
**Objective:** Verify session persists across page reloads

**Steps:**
1. Log in successfully
2. Refresh the page (F5 or Ctrl+R)
3. Monitor console and UI

**Expected Results:**
- ✅ Shows loading state while checking auth
- ✅ Dashboard loads without asking to log in
- ✅ Admin info persists in sidebar
- ✅ No login redirect

**Console Check:**
```
[AdminContext] Mounting - checking auth on load
[AdminContext] checkAuth() called
[AdminContext] ✅ Admin authenticated: admin@example.com
```

---

### TEST 10: Logout Network Failure with Retry
**Objective:** Verify logout retry logic when network fails

**Steps:**
1. Log in successfully
2. Simulate network failure:
   - Open DevTools → Network tab
   - Offline mode: Tick "Offline" checkbox
3. Click "Logout"
4. Turn online again (uncheck Offline)
5. Monitor retry attempts

**Expected Results:**
- ✅ First attempt fails (no network)
- ✅ Automatically retries after 1 second
- ✅ Second attempt succeeds (network restored)
- ✅ Redirects to login page
- ✅ Session cleared on server

**Console Check:**
```
[AdminContext] Logout attempt 1/3...
[AdminContext] Logout error on attempt 1: ...
[AdminContext] Retrying logout in 1 second...
[AdminContext] Logout attempt 2/3...
[AdminContext] ✅ Logout API successful
[AdminContext] logout() completed successfully
```

---

### TEST 11: Protected Route Access
**Objective:** Verify unauthenticated users cannot access admin pages

**Steps:**
1. Log out (or start fresh)
2. Try to access `/admin/dashboard` directly via URL
3. Try to access other protected routes:
   - `/admin/products`
   - `/admin/upload`
   - `/admin/finance`

**Expected Results:**
- ✅ Middleware redirects to `/admin/login`
- ✅ Shows login page
- ✅ Cannot bypass by manual URL entry
- ✅ Cookies are checked server-side

**Middleware Check (Console):**
```
// If session invalid, redirect happens server-side
```

---

### TEST 12: Concurrent Login from Multiple Devices
**Objective:** Verify behavior when logged in from multiple places

**Scenario 1: Same Session Token**
1. Open `https://empi-mu.vercel.app/admin` in Browser 1
2. Open same URL in Browser 2 (fresh tab/incognito)
3. Log in from Browser 1
4. Log in from Browser 2 with same account

**Expected Results:**
- ✅ Both browsers have valid sessions
- ✅ Each has their own `admin_session` cookie
- ✅ Both can access dashboard independently

**Scenario 2: Logout from One Device**
1. Logged in from Browser 1 and Browser 2
2. Click logout from Browser 1
3. Try to use Browser 2

**Expected Results:**
- ✅ Browser 1: Logged out, redirected to login
- ✅ Browser 2: Still logged in (separate session)
- ✅ Each session managed independently

---

## 🔍 VERIFICATION CHECKLIST

### Security Checks
- [ ] Passwords are never logged or exposed
- [ ] Session tokens are cryptographically secure (32 bytes)
- [ ] Cookies are HttpOnly (cannot be accessed by JavaScript)
- [ ] Cookies are Secure (HTTPS only in production)
- [ ] No session data in localStorage
- [ ] Rate limiting active and working
- [ ] Account lockout after 5 failed attempts
- [ ] IP address tracking for failed attempts

### Functionality Checks
- [ ] Valid login works
- [ ] Invalid email rejected
- [ ] Invalid password rejected
- [ ] Session persists across page reloads
- [ ] Session auto-validates every 5 minutes
- [ ] Session expires after 7 days
- [ ] Logout clears session on server and client
- [ ] Protected routes redirect to login when no session
- [ ] Error messages are clear and helpful

### Performance Checks
- [ ] Login takes < 500ms
- [ ] Logout takes < 500ms
- [ ] Session validation takes < 100ms
- [ ] No memory leaks on logout/login cycles
- [ ] Rate limit cleanup runs periodically
- [ ] No console errors or warnings

### Production Readiness
- [ ] All tests pass in staging
- [ ] Error tracking enabled
- [ ] Monitoring dashboards set up
- [ ] Backup and recovery procedures documented
- [ ] Support documentation complete
- [ ] Staff trained on procedures

---

## 📊 Performance Testing

### Response Time Measurement
```javascript
// In browser console:
console.time('login');
// [click login button]
console.timeEnd('login'); // Should show < 500ms
```

### Load Testing Recommendations
- [ ] 100 concurrent login attempts per minute
- [ ] Sustained load for 1 hour
- [ ] Rate limiting verified under load
- [ ] Session validation doesn't block requests
- [ ] Database connection pooling adequate

---

## 🐛 Debugging Guide

### Enable Detailed Logs
```javascript
// All login/logout logs are already prefixed with [AdminContext], [Admin Login], [RateLimit], [Logout API]
// Check browser console (F12) for detailed logs
```

### Check Session in Database
```javascript
// MongoDB query to verify session
db.admins.findOne({ email: 'admin@example.com' }, {
  sessionToken: 1,
  sessionExpiry: 1,
  lastLogin: 1,
  lastLogout: 1
});
```

### Clear Test Data
```javascript
// Clear all admin sessions (use carefully!)
db.admins.updateMany({}, { 
  $set: { sessionToken: null, sessionExpiry: null }
});

// Soft delete a test admin
db.admins.updateOne(
  { email: 'testadmin@example.com' },
  { $set: { isActive: false } }
);
```

---

## 📝 Test Report Template

```markdown
## Test Run Report - [DATE]

**Tester:** [Name]  
**Environment:** [Staging/Production]  
**Duration:** [Start Time] - [End Time]  

### Results Summary
- Total Tests: 12
- Passed: __
- Failed: __
- Skipped: __

### Issues Found
1. [Issue] - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...
   - Fix: ...

### Recommendations
- ...

### Sign-off
- [ ] Ready for production deployment
- [ ] Needs fixes before deployment
- [ ] Needs more testing

Tester Signature: ________________  Date: __________
```

---

## 🚀 Deployment Verification

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Staging fully tested

### Post-Deployment
- [ ] Monitor error logs for 24 hours
- [ ] Monitor login success rate
- [ ] Monitor API response times
- [ ] Verify rate limiting active
- [ ] Confirm no security incidents

---

**Status:** READY FOR TESTING  
**Last Updated:** November 27, 2025
