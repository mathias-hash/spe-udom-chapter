# Comprehensive Security Implementation Guide

## Overview
This document details all security best practices implemented in the SPE UDOM 2026 application including role-based access control, data encryption, parameterized queries, API security, and proper configurations.

---

## 1. Role-Based Access Control (RBAC)

### User Roles
```
- Admin: Full system access
- President: Leadership decisions, event approval, announcements
- General Secretary: Elections management, publications
- Member: Standard member access
```

### Permission Classes
All permission classes are in `core/permissions.py`:

#### Endpoint Protection Examples

**Admin Only:**
```python
from core.permissions import IsAdmin

class AdminOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def post(self, request):
        # Only admins can perform this action
        pass
```

**Leadership Only:**
```python
from core.permissions import IsLeadership

class LeadershipView(APIView):
    permission_classes = [IsAuthenticated, IsLeadership]
```

**Ownership Check:**
```python
from core.permissions import IsOwnerOrAdmin

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_object(self, pk):
        # Returns user object for permission check
        return User.objects.get(pk=pk)
```

### Available Permission Classes

| Permission | Usage | Rules |
|-----------|-------|-------|
| `IsAdmin` | Admin-only endpoints | user.role == 'admin' |
| `IsPresident` | President-only endpoints | user.role == 'president' |
| `IsGeneralSecretary` | Secretary-only endpoints | user.role == 'general_secretary' |
| `IsAdminOrPresident` | Leadership endpoints | role in ['admin', 'president'] |
| `IsLeadership` | All leadership | role in ['admin', 'president', 'secretary'] |
| `IsAuthenticated` | Logged-in users | user.is_authenticated |
| `IsOwnerOrAdmin` | Owner or admin | owner == user \|\| role == 'admin' |
| `CanVote` | Voting access | user.is_active |
| `CanCreateEvent` | Event creation | user.role in ['admin', 'president', 'secretary'] |
| `CanApproveEvent` | Event approval | role in ['admin', 'president'] |
| `CanSendAnnouncement` | Announcements | role in ['admin', 'president'] |
| `CanManageElections` | Elections management | role in ['admin', 'general_secretary'] |
| `CanViewAnalytics` | Analytics access | role in ['admin', 'president', 'secretary'] |

---

## 2. Data Encryption

### Encrypted Fields

#### Implementation
```python
from core.encryption import EncryptedField

class Student(AbstractBaseUser):
    # Regular field
    email = models.EmailField(unique=True)
    
    # Encrypted field (stores encrypted in DB, decrypted on retrieval)
    phone = models.CharField(max_length=15)  # Can be replaced with EncryptedField
    
    # Other fields
    full_name = models.CharField(max_length=100)
```

### Using Encryption Service

```python
from core.encryption import encryption_service

# Encrypt sensitive data
encrypted_data = encryption_service.encrypt("sensitive_information")

# Decrypt data
original_data = encryption_service.decrypt(encrypted_data)

# Hash for comparison (one-way)
hashed = encryption_service.hash_sensitive_data("password")
```

### Encryption Key Management

#### Generate Encryption Key (One-time)
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

#### Add to `.env` file
```env
ENCRYPTION_KEY=your_generated_key_here
```

**IMPORTANT:** 
- Never commit encryption keys to version control
- Store key securely in production environment variables
- Keep backups of encryption key (you cannot decrypt without it)
- Rotate keys periodically with data re-encryption

---

## 3. Parameterized Queries (SQL Injection Prevention)

### Django ORM Security

Django ORM automatically uses parameterized queries:

```python
# SAFE - Uses parameterized queries automatically
students = Student.objects.filter(email=user_email)
events = Event.objects.filter(created_by=user)

# SAFE - QuerySet methods with parameters
results = Student.objects.filter(
    email__icontains=search_term,
    role__in=['member', 'president']
)

# UNSAFE - Never do this!
Student.objects.raw(f"SELECT * FROM student WHERE email = '{email}'")  # DON'T USE!
```

### Safe Query Patterns

```python
from django.db.models import Q
from django.db import models

# Safe filtering
events = Event.objects.filter(
    models.Q(status='approved') & 
    models.Q(created_by=user)
)

# Safe search
events = Event.objects.filter(
    title__icontains=search_query  # Safe parameter
)

# Safe aggregation
from django.db.models import Count
results = Event.objects.annotate(
    registration_count=Count('registrations')
)
```

### Raw Queries (When Necessary)

If raw SQL is absolutely required:

```python
from django.db import connection
from django.db.models import Model

# SAFE - Use parameters
cursor = connection.cursor()
cursor.execute(
    "SELECT * FROM student WHERE email = %s AND role = %s",
    [email, role]  # Parameters passed separately
)

# UNSAFE - Never do this
cursor.execute(f"SELECT * FROM student WHERE email = '{email}'")  # DON'T USE!
```

---

## 4. API Security

### Authentication

All endpoints use JWT (JSON Web Tokens):

```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Get tokens
POST /api/token/
{
    "email": "user@example.com",
    "password": "SecurePassword123!"
}

# Response
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# Refresh token
POST /api/token/refresh/
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# Use in requests
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Rate Limiting

Configured in settings:
```python
'DEFAULT_THROTTLE_CLASSES': [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
],
'DEFAULT_THROTTLE_RATES': {
    'anon': '100/hour',      # Anonymous users
    'user': '1000/hour',     # Authenticated users
}
```

### Input Validation

```python
from core.api_security import SecurityValidator

# Validate email
is_valid, msg = SecurityValidator.validate_email("user@example.com")

# Validate phone
is_valid, msg = SecurityValidator.validate_phone("+255785123456")

# Check password strength
is_valid, msg, score = SecurityValidator.validate_password_strength("MyPass123!@#")

# Sanitize input
clean_input = SecurityValidator.sanitize_input(user_input)
```

### Response Sanitization

```python
from core.api_security import ResponseSanitizer

# Remove sensitive fields
clean_user_data = ResponseSanitizer.sanitize_user_data(user_dict)

# Sanitize response data
safe_response = ResponseSanitizer.sanitize_response(response_data)
```

### Security Decorators

```python
from core.api_security import require_https, rate_limit_by_ip, validate_content_type

# Require HTTPS
@require_https
def sensitive_view(request):
    pass

# Rate limit by IP
@rate_limit_by_ip(limit=50, period=3600)  # 50 requests per hour
def expensive_operation(request):
    pass

# Validate content type
@validate_content_type(['application/json'])
def api_endpoint(request):
    pass
```

### CORS Configuration

```python
# Allowed origins (in settings.py)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',      # Development
    'https://app.example.com',    # Production
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
    'x-csrftoken',
]
```

---

## 5. Security Headers & Configuration

### Automatic Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### HTTPS Enforcement

Production (DEBUG=False):
```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
```

### CSRF Protection

All state-changing requests require CSRF token:
```html
<!-- Include in forms -->
<input type="hidden" name="csrfmiddlewaretoken" value="{{ csrf_token }}">

<!-- Or in headers -->
X-CSRFToken: {{ csrf_token }}
```

### Session Security

```python
SESSION_COOKIE_AGE = 1209600          # 2 weeks
SESSION_COOKIE_HTTPONLY = True        # Not accessible via JS
SESSION_COOKIE_SAMESITE = 'Strict'    # CSRF protection
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
```

---

## 6. Audit Logging

### Security Event Logging

```python
from core.api_security import AuditLogger

# Log authentication
AuditLogger.log_authentication(
    user=user,
    success=True,
    ip_address=request.META.get('REMOTE_ADDR'),
    user_agent=request.META.get('HTTP_USER_AGENT')
)

# Log permission denied
AuditLogger.log_permission_denied(
    user=user,
    action='delete_event',
    resource='event_123'
)

# Log data access
AuditLogger.log_data_access(
    user=user,
    data_type='user_emails',
    action='bulk_export'
)

# Log suspicious activity
AuditLogger.log_suspicious_activity(
    user=user,
    activity='multiple_failed_logins',
    details='5 failed attempts in 10 minutes'
)
```

### Viewing Logs

```bash
# See security logs
tail -f var/log/django.security.log

# Search for specific user
grep 'user_email' var/log/django.security.log
```

---

## 7. File Upload Security

### Configuration

```python
MAX_UPLOAD_SIZE = 5242880  # 5MB
ALLOWED_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif']
ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx']
```

### Validation

```python
from core.validators import validate_file_upload

# In serializer
class DocumentSerializer(serializers.Serializer):
    file = serializers.FileField(validators=[validate_file_upload])
    
    def validate_file(self, file):
        # File automatically validated for size and extension
        return file
```

---

## 8. Password Security

### Requirements

Passwords must have:
- Minimum 12 characters
- Uppercase and lowercase letters
- Numbers
- Special characters

### Setup

```bash
# Terminal
python manage.py createsuperuser

# Username: admin@speudom.ac.tz
# Password: AdminPass@123456  (meets all requirements)
```

---

## 9. .env Configuration Template

```env
# ─── Core Settings ───
DEBUG=False
SECRET_KEY=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# ─── Database ───
DATABASE_URL=postgresql://user:password@localhost/dbname

# ─── SMTP Email (for password reset) ───
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# ─── Security ───
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENFORCE_HTTPS=True
IP_WHITELIST=  # Leave empty or add IPs: 192.168.1.1,10.0.0.1

# ─── API Security ───
API_SECRET_KEY=your-api-secret-key
ALLOW_ADMIN_IP_ONLY=False

# ─── Redis (for Channels) ───
REDIS_URL=redis://127.0.0.1:6379/0

# ─── CORS ───
FRONTEND_URL=https://yourdomain.com
```

---

## 10. Security Checklist

### Development
- [ ] Set SECRET_KEY
- [ ] Set ENCRYPTION_KEY
- [ ] Configure DATABASE_URL
- [ ] Set DEBUG=False for testing
- [ ] Configure email backend

### Before Production Deploy
- [ ] [ ] Generate new SECRET_KEY
- [ ] [ ] Generate new ENCRYPTION_KEY
- [ ] [ ] Set ENFORCE_HTTPS=True
- [ ] [ ] Configure DATABASE for production
- [ ] [ ] Set ALLOWED_HOSTS correctly
- [ ] [ ] Configure CORS origins
- [ ] [ ] Set up email for password resets
- [ ] [ ] Configure IP whitelisting if needed
- [ ] [ ] Enable HTTPS/SSL certificate
- [ ] [ ] Set up Redis for WebSockets
- [ ] [ ] Configure CDN for static files
- [ ] [ ] Set up monitoring/alerting
- [ ] [ ] Review and configure rate limiting
- [ ] [ ] Enable audit logging
- [ ] [ ] Test authentication flows
- [ ] [ ] Test file upload restrictions
- [ ] [ ] Verify all permission checks
- [ ] [ ] Run security audit

### Ongoing
- [ ] Monitor security logs regularly
- [ ] Review failed authentication attempts
- [ ] Check for suspicious activity patterns
- [ ] Update dependencies for security patches
- [ ] Rotate encryption keys periodically
- [ ] Audit user roles and permissions
- [ ] Review API access logs
- [ ] Test disaster recovery procedures

---

## 11. Common Security Issues & Solutions

### Issue: "Authentication credentials were not provided"
**Solution**: Ensure frontend is using secure API helper with JWT token
```javascript
// WRONG
fetch(`${API_URL}/api/endpoint/`).then(...)

// CORRECT
import { api } from './utils/api';
api(`/api/endpoint/`).then(...)
```

### Issue: CORS errors in frontend
**Solution**: Update TRUSTED_ORIGINS in settings and ensure frontend URL is included
```python
TRUSTED_ORIGINS = ['http://localhost:3000', 'https://yourdomain.com']
```

### Issue: File upload fails
**Solution**: Check file size and extension against allowed types
```python
MAX_UPLOAD_SIZE = 5242880  # 5MB
ALLOWED_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf']
```

### Issue: Password reset email not sending
**Solution**: Configure email backend in .env
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your@gmail.com
```

---

## 12. Reference Documentation

- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [Django REST Framework Security](https://www.django-rest-framework.org/api-guide/authentication/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Cryptography Module](https://cryptography.io/)

---

## Support

For security issues or questions, contact admin@speudom.ac.tz

**NEVER** share sensitive keys, tokens, or credentials.
