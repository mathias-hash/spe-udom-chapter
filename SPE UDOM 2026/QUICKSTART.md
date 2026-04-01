# SPE UDOM 2026 - Quick Start Guide

## Development Setup

### Backend

1. **Install dependencies** (already done)
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Create superuser**
   ```bash
   python manage.py createsuperuser
   # Follow prompts to create admin account
   ```

3. **Start development server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   # Server will run at http://localhost:8000
   # Admin panel: http://localhost:8000/admin
   ```

### Frontend

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   # App will open at http://localhost:3000
   ```

---

## Production Deployment

### Pre-Deployment Checklist

#### Backend (`backend/`)

1. **Update `.env` for production**
   ```bash
   # Copy and update the template
   cp .env.example .env
   
   # CRITICAL - Generate a new SECRET_KEY:
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   
   # Update in .env:
   DEBUG=False
   SECRET_KEY=<your-generated-key>
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   ```

2. **Database**
   ```bash
   # Switch to PostgreSQL in production
   # Update DATABASE_URL in .env to PostgreSQL connection string
   
   # Then run migrations
   python manage.py migrate
   ```

3. **Collect static files**
   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Create superuser (if new database)**
   ```bash
   python manage.py createsuperuser
   ```

#### Frontend (`frontend/`)

1. **Update `.env` for production**
   ```bash
   # Copy and update the template
   cp .env.example .env
   
   # Update in .env:
   REACT_APP_API_BASE_URL=https://yourdomain.com
   REACT_APP_ENVIRONMENT=production
   ```

2. **Build for production**
   ```bash
   npm run build
   # Creates optimized build in ./build directory
   ```

### Deployment Options

#### Option 1: Render (Recommended for Easy Setup)

**Backend:**
- Connect your GitHub repository
- Set build command: `pip install -r requirements.txt`
- Set start command: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
- Add environment variables from `.env.example`

**Frontend:**
- Connect your GitHub repository
- Set build command: `npm run build`
- Publish directory: `build`
- Add environment variables

#### Option 2: Railway

Similar setup to Render - provides easy guides during setup.

#### Option 3: Docker Deployment

```dockerfile
# Create Dockerfile in backend/
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

---

## API Endpoints (Examples)

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user
- `GET /api/auth/profile/` - Get current user profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/forgot-password/` - Request password reset
- `POST /api/auth/reset-password/{uid}/{token}/` - Reset password

### Events
- `GET /api/events/` - List events
- `POST /api/events/` - Create event (authenticated)
- `PATCH /api/events/{id}/approve/` - Approve event (admin)
- `POST /api/events/{id}/register/` - Register for event

### Announcements
- `GET /api/announcements/` - List announcements
- `POST /api/announcements/` - Create announcement (admin)

### Elections
- `GET /api/elections/` - List elections
- `POST /api/elections/{id}/vote/` - Cast vote

---

## Admin Panel

Access at `http://localhost:8000/admin` (or `https://yourdomain.com/admin` in production)

Manage:
- Users
- Events
- Announcements
- Elections & Candidates
- Suggestions

---

## WebSocket Endpoints (Chat)

- `ws://localhost:8000/ws/chat/{room_key}/` - Connect to chat room

For production, update to `wss://` (secure WebSocket).

---

## Monitoring & Logs

### View Logs
```bash
cd backend
tail -f logs/django.log      # General logs
tail -f logs/security.log    # Security events
```

### Common Issues

**Port already in use:**
```bash
# Windows - find and kill process on port 8000
netstat -aon | findstr :8000
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

**Database locked:**
```bash
# Delete db.sqlite3 and run migrations again (dev only!)
rm db.sqlite3
python manage.py migrate
```

---

## Security Reminders

- ✓ `.env` is in `.gitignore` - never commit secrets
- ✓ Use HTTPS/SSL in production
- ✓ Keep dependencies updated: `pip list --outdated`, `npm outdated`
- ✓ Review security logs regularly
- ✓ Use strong passwords (12+ chars, mixed case, numbers, symbols)
- ✓ Enable 2FA if available in your hosting provider

---

## Support

For security issues: See [SECURITY.md](SECURITY.md)

For delivery process: See [AGILE.md](AGILE.md) and [agile/product-backlog.md](agile/product-backlog.md)

For questions: Check Django docs or reach out to the team.

Happy coding! 🚀
