# Chat "Connecting (not responding)" - Troubleshooting Guide

## Quick Fixes (Try These First)

### 1. **Backend Not Running**
The WebSocket needs the backend to be running with ASGI support, not WSGI.

```bash
cd backend

# Run with Daphne (ASGI server) - REQUIRED for WebSockets
pip install daphne
daphne -b 0.0.0.0 -p 8000 backend.asgi:application

# NOT with: python manage.py runserver (uses WSGI - won't work)
```

### 2. **Check Environment Variables**
Verify your `.env` files are configured:

**Frontend** (`.env`):
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_BASE_URL=ws://localhost:8000
REACT_APP_ENVIRONMENT=development
```

**Backend** (`.env` in backend folder):
- Ensure `DEBUG=True` for development
- Ensure `SECRET_KEY` is set

### 3. **Clear Browser Cache & Hard Reload**
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache and restart

### 4. **Check Console for Errors**
Open Browser DevTools (F12) → Console tab:
- Look for WebSocket connection errors
- Check the exact WebSocket URL being used
- Verify it shows `ws://localhost:8000/ws/chat/{room_key}/`

---

## Detailed Troubleshooting

### Issue: "WebSocket is closed with code 1000"
✅ **Solution**: This often means connection was accepted but then immediately closed.

Check backend logs for errors. Likely causes:
- Chat room not loading properly
- API `/api/chat/support-room/` endpoint failing

**Debug**:
```bash
# Check if API endpoint works
curl http://localhost:8000/api/chat/support-room/

# Should return JSON with room_key, messages, etc.
```

### Issue: "WebSocket connection refused" or "net::ERR_CONNECTION_REFUSED"
✅ **Solution**: Backend is not running or listening on the port.

```bash
# Verify backend is running
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Mac/Linux

# If not running, start with ASGI server (see above)
```

### Issue: "403 Forbidden" or authentication issue
✅ **Solution**: CORS or authentication middleware issue.

Check `backend/settings.py`:
- `ALLOWED_HOSTS` includes your domain
- `CORS_ALLOWED_ORIGINS` includes frontend URL
- `MIDDLEWARE` order is correct (AuthMiddlewareStack in ASGI)

### Issue: Works locally but not in production
✅ **Solution**: WebSocket URL configuration needed in production.

Update your production `frontend/.env`:
```env
REACT_APP_API_BASE_URL=https://your-backend.onrender.com
REACT_APP_WS_BASE_URL=wss://your-backend.onrender.com
```

For **Netlify + Render** setup:
- Frontend: Netlify
- Backend: Render
- Netlify `_redirects` should NOT intercept WebSocket requests

Update `frontend/public/_redirects`:
```
# Allow WebSocket upgrades
/ws/*  :status=200

# Other redirects
/*    /index.html   200
```

### Issue: Channel Layers Not Working (Production)
If using production settings without Redis:

**Option 1**: Use in-memory channels (development only):
```python
# backend/settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}
```

**Option 2**: Set up Redis and configure:
```env
# backend/.env
REDIS_URL=redis://localhost:6379/0
```

Update `settings.py`:
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [env('REDIS_URL', default='127.0.0.1:6379')]},
    }
}
```

---

## Full Development Setup

```bash
# 1. Terminal 1: Start Backend with ASGI
cd backend
pip install daphne  # Install ASGI server
daphne -b 0.0.0.0 -p 8000 backend.asgi:application

# 2. Terminal 2: Start Frontend
cd frontend
npm install
npm start
```

---

## Testing the Connection

### Browser Console Test
```javascript
// Open DevTools Console and run:
const ws = new WebSocket('ws://localhost:8000/ws/chat/spe-support/');
ws.onopen = () => console.log('✅ WebSocket Connected!');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Backend Test
```bash
# Check the API endpoint
curl -X GET http://localhost:8000/api/chat/support-room/
```

---

## Key Changes Made

1. **ChatWidget.js** - Fixed WebSocket URL construction with proper URL parsing
2. **.env files** - Added `REACT_APP_WS_BASE_URL` variable for explicit WebSocket configuration
3. **Added error logging** - Better console messages for debugging

---

## Production Checklist

- [ ] Backend running on ASGI server (Gunicorn + Daphne, or uvicorn)
- [ ] `REACT_APP_WS_BASE_URL` configured in frontend `.env`
- [ ] Redis running (or using InMemoryChannelLayer for small deployments)
- [ ] SSL/TLS certificates valid (for `wss://` connections)
- [ ] CORS configured for WebSocket origin
- [ ] Nginx/reverse proxy configured to upgrade WebSocket connections
- [ ] Backend and frontend URLs match (no HTTPS/HTTP mismatch)

