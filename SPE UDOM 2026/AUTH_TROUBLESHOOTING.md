# Authentication Troubleshooting Guide

## Issue: "Authentication credentials were not provided"

This error occurs when:
1. The JWT token isn't being sent in the request header
2. The token has expired
3. There's a CORS issue
4. The backend isn't configured to accept the token

---

## Quick Fix Checklist

### 1. **Backend Must Be Running**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### 2. **Check Backend Configuration**
- [ ] Ensure `.env` file exists in `backend/` directory
- [ ] Set `DEBUG=True` for development
- [ ] Set `ALLOWED_HOSTS=localhost,127.0.0.1`
- [ ] Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL

### 3. **Frontend Environment**
```bash
cd frontend
# Check .env file
grep REACT_APP_API_BASE_URL .env
# Should output: REACT_APP_API_BASE_URL=http://localhost:8000
```

### 4. **Clear Browser Cache**
- Clear browser localStorage: Open DevTools → Application → Local Storage → Delete all
- Clear browser cache: `Ctrl+Shift+Delete`
- Restart browser

---

## Debugging Steps

### Step 1: Check Token Storage

Open browser DevTools (F12) and run in console:

```javascript
import('./utils/debugAuth.js').then(() => window.debugAuth.storage());
```

You should see:
```
Access Token: ✓ eyJhbGc...
Refresh Token: ✓ eyJhbGc...
User Data: ✓ admin@speudom.ac.tz
```

### Step 2: Test Login

```javascript
window.debugAuth.login('admin@speudom.ac.tz', 'AdminPass@123456');
```

Expected output:
```
✓ Login successful
Access Token: ✓ Received
Refresh Token: ✓ Received
```

### Step 3: Test Authenticated Request

After login, run:

```javascript
window.debugAuth.authenticated();
```

Expected output:
```
Response Status: 200
✓ Authenticated request successful
```

### Step 4: Test Secure API Helper

```javascript
window.debugAuth.secureApi();
```

Expected output:
```
✓ Secure API request successful
```

### Step 5: Check CORS

```javascript
window.debugAuth.cors();
```

Look for:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## Common Issues & Solutions

### Issue: "CORS error - No 'Access-Control-Allow-Origin' header"

**Solution:**
1. Check backend `.env`:
   ```
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   TRUSTED_ORIGINS=http://localhost:3000
   ```

2. Restart backend server:
   ```bash
   # Stop (Ctrl+C) and restart
   python manage.py runserver 0.0.0.0:8000
   ```

### Issue: "401 Unauthorized" after login

**Solution:**
1. Check if token is being stored:
   ```javascript
   localStorage.getItem('spe_access')
   ```

2. Decode token to check expiration:
   ```javascript
   window.debugAuth.decode(localStorage.getItem('spe_access'))
   ```

3. If token is expired, try refreshing:
   ```javascript
   // The api.js should handle this automatically
   window.debugAuth.authenticated();
   ```

### Issue: "Credentials were not provided" on authenticated endpoints

**Solution:**
Make sure you're using the `api` helper from `utils/api.js`:

```javascript
// ✗ WRONG - Direct fetch
fetch('http://localhost:8000/api/profile/', {
  headers: { 'Content-Type': 'application/json' }
});

// ✓ CORRECT - Use api helper
import { api } from './utils/api.js';
api('/auth/profile/');  // Token automatically added
```

### Issue: "Invalid token" or "Token is blacklisted"

**Solution:**
1. The token might be expired. Log out and log in again:
   ```javascript
   localStorage.clear();
   window.location.reload();
   ```

2. Check if token rotation is working:
   ```javascript
   window.debugAuth.decode(localStorage.getItem('spe_refresh'));
   ```

---

## Backend Verification

### Check if auth endpoints are accessible

```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@speudom.ac.tz","password":"AdminPass@123456"}'

# You should get a response with tokens
```

### Check if profile endpoint requires auth

```bash
# Without token (should fail with 401 or 403)
curl http://localhost:8000/api/auth/profile/

# With token (should work)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/auth/profile/
```

---

## Full Debug Run

To run all diagnostic tests at once:

```javascript
import('./utils/debugAuth.js').then(() => window.debugAuth.runAll());
```

This will:
- ✓ Check token storage
- ✓ Test CORS settings
- ✓ Check authenticated requests
- ✓ Verify secure API helper

---

## Enable Debug Logging

Add this to `frontend/src/index.js` after imports:

```javascript
// Debug authentication
if (process.env.REACT_APP_ENVIRONMENT === 'development') {
  import('./utils/debugAuth.js');
}
```

Now you'll have `window.debugAuth` available in development.

---

## Reset Everything

If all else fails, start fresh:

**Backend:**
```bash
cd backend

# Delete database
rm db.sqlite3

# Recreate
python manage.py migrate

# Create superuser
python create_superuser.py

# Restart server
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**
```bash
cd frontend

# Clear cache
npm cache clean --force

# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart
npm start
```

---

## Still Not Working?

Check the backend logs for error messages:

```bash
# Terminal 1: Start backend with verbose logging
cd backend
python manage.py runserver 0.0.0.0:8000 --verbosity 2

# Terminal 2: Watch security logs
tail -f logs/security.log
```

Look for errors like:
- `Invalid token`
- `Token is blacklisted`
- `Authentication failed`
- `CORS policy error`

---

## Key Endpoints to Test

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register/` | POST | No | Create new account |
| `/api/auth/login/` | POST | No | Get tokens |
| `/api/auth/profile/` | GET | Yes | Get current user |
| `/api/auth/token/refresh/` | POST | No | Refresh access token |
| `/api/auth/change-password/` | POST | Yes | Change password |

---

## Help! I'm Still Stuck

1. **Restart both servers** (backend and frontend)
2. **Clear all browser storage** (localStorage, cookies, cache)
3. **Check both console errors** (browser DevTools & terminal)
4. **Verify the superuser exists**:
   ```bash
   cd backend
   python manage.py shell
   >>> from core.models import Student
   >>> Student.objects.filter(email='admin@speudom.ac.tz').exists()
   True  # Should be True
   ```

5. **Check if ports are in use**:
   ```bash
   # Backend on 8000?
   netstat -ano | findstr :8000
   
   # Frontend on 3000?
   netstat -ano | findstr :3000
   ```

---

For more help, see:
- `SECURITY.md` - Security configuration details
- `QUICKSTART.md` - Development setup guide
