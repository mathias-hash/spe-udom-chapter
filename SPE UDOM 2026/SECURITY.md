# Security Implementation Guide - SPE UDOM 2026

## Overview
This document outlines all security measures implemented in the SPE UDOM application. Please follow these guidelines for production deployment and maintenance.

---

## Backend Security

### 1. Environment Configuration

#### Critical Settings
- **SECRET_KEY**: Must be a strong, random string in production
  ```bash
  # Generate a secure key:
  python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  ```
- **DEBUG**: Must be `False` in production
- **ALLOWED_HOSTS**: Specify only your production domains

#### SSL/TLS Configuration
```env
ENFORCE_HTTPS=True
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

### 2. Authentication & Authorization

#### JWT Token Security
- **Access Token Lifetime**: 1 hour (configurable)
- **Refresh Token Lifetime**: 7 days
- **Token Rotation**: Enabled (old tokens blacklisted)
- **Signing Algorithm**: HS256

**Best Practice**: Use HTTPS to prevent token interception in transit.

#### Password Requirements
- Minimum 6 characters
- Enforces Django password validators:
  - No similarity to user attributes
  - No common passwords
  - No purely numeric passwords

#### Rate Limiting
- Anonymous users: 100 requests/hour (general), 50/hour (auth endpoints)
- Authenticated users: 1000 requests/hour (general), 500/hour (user endpoints)

### 3. Security Headers

The following headers are set on all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME type sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Enable XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer leakage |
| Permissions-Policy | geolocation=(), microphone=(), camera=() | Restrict browser features |

### 4. CORS & CSRF Configuration

#### CORS (Cross-Origin Resource Sharing)
- Only specified origins allowed
- Credentials allowed only from trusted origins
- Limited headers exposed

#### CSRF (Cross-Site Request Forgery)
- CSRF_COOKIE_SECURE: True
- CSRF_COOKIE_HTTPONLY: True
- CSRF_COOKIE_SAMESITE: Strict

### 5. File Upload Security

#### Upload Restrictions
- **Max file size**: 20MB
- **Allowed image extensions**: jpg, jpeg, png, gif
- **Allowed document extensions**: pdf, doc, docx, xls, xlsx
- **File validation**: Extension and size validation before storage

#### Best Practice
Store uploaded files outside the web root or use cloud storage (AWS S3).

### 6. Session Security

- **Session backend**: Database (not encrypted in SQLite - use secure DB in production)
- **SESSION_COOKIE_SECURE**: True (HTTPS only)
- **SESSION_COOKIE_HTTPONLY**: True (JavaScript cannot access)
- **SESSION_COOKIE_SAMESITE**: Strict (CSRF protection)
- **Session lifetime**: 2 weeks

### 7. Database Security

#### SQLite (Development Only)
- Do NOT use in production
- Stored locally - vulnerable to file-system access

#### PostgreSQL (Recommended for Production)
```env
DATABASE_URL=postgresql://user:password@host:5432/spe_udom
```

#### Best Practices
- Use strong database passwords
- Restrict database network access
- Enable database encryption at rest
- Regular database backups
- Use parameterized queries (Django ORM does this)

### 8. Email Security

- Use app-specific passwords for Gmail
- Never hardcode credentials
- Use environment variables
- Consider using SES (AWS) or SendGrid for production

### 9. Input Validation

All API endpoints validate:
- **Field presence**: Required fields are checked
- **Field length**: Prevents buffer overflows
- **Authorization**: Users can only access their own data
- **Data type**: Filed values are type-checked
- **Content**: Malicious content is sanitized

### 10. WebSocket Security

#### Chat Consumer Security
- Rate limiting: 50 messages/hour per connection
- Message length: Max 5000 characters
- Input sanitization: HTML tags stripped
- Error handling: Generic error messages to prevent info leakage
- Connection validation: Room existence verified

### 11. Logging & Monitoring

Security events are logged to `logs/security.log`:
- Failed login attempts
- Unauthorized access attempts
- Password reset requests
- Role-based access denials
- File upload failures

### 12. API Security

#### Throttling
- Prevent brute force attacks
- DDoS protection

#### Input Sanitization
- User inputs stripped and validated
- Pagination limits enforced (max 100 items/page)

#### Error Messages
- Generic messages to prevent information leakage
- No stack traces in production
- Logging for debugging

---

## Frontend Security

### 1. Token Management

#### Secure Token Storage
- **Current**: localStorage (vulnerable to XSS)
- **Recommended for Production**: HttpOnly secure cookies

#### Token Refresh Implementation
```javascript
// Automatic token refresh on 401
// Prevents multiple simultaneous refresh requests
// Redirects to login on refresh failure
```

### 2. API Communication

#### Security Headers
```javascript
headers: {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  Authorization: `Bearer ${token}`
}
```

#### HTTPS Enforcement
- All API calls use HTTPS in production
- No mixed content (HTTP + HTTPS)

### 3. Content Security Policy

**Recommended CSP Header**:
```
default-src 'self';
script-src 'self' 'unsafe-inline' cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com;
img-src 'self' data: https:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### 4. XSS Protection

- Never use `dangerouslySetInnerHTML` unless content is trusted
- Sanitize all user input before displaying
- Use React's built-in XSS protection

### 5. Authentication Flow

1. User logs in with email + password
2. Backend validates and returns JWT tokens
3. Frontend stores tokens securely
4. Subsequent requests include JWT in Authorization header
5. On 401, automatic token refresh is attempted
6. If refresh fails, redirect to login

---

## Deployment Checklist

### Backend Deployment
- [ ] Set `DEBUG = False`
- [ ] Generate secure `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Enable HTTPS/SSL
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set up email configuration
- [ ] Configure logging
- [ ] Enable Sentry monitoring (optional)
- [ ] Set up database backups
- [ ] Configure Redis for caching
- [ ] Review environment variables in `.env`

### Frontend Deployment
- [ ] Build for production: `npm run build`
- [ ] Update `REACT_APP_API_BASE_URL` to production backend
- [ ] Enable HTTPS
- [ ] Set charset to UTF-8
- [ ] Enable gzip compression
- [ ] Implement security headers in web server
- [ ] Consider implementing HttpOnly cookies for tokens
- [ ] Set up error tracking (Sentry)

### Infrastructure
- [ ] Use HTTPS/TLS certificates (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up intrusion detection
- [ ] Enable DDoS protection
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Implement backup and disaster recovery

---

## Maintenance & Monitoring

### Regular Tasks
1. **Weekly**: Check security logs for anomalies
2. **Monthly**: Update dependencies: `pip outdated`, `npm outdated`
3. **Quarterly**: Security audit and penetration testing
4. **Annual**: Full security assessment

### Updates
```bash
# Backend
pip install --upgrade pip
pip install -r requirements.txt --upgrade

# Frontend
npm update
npm audit fix
```

---

## Incident Response

### If Compromised
1. Immediately rotate SECRET_KEY
2. Invalidate all sessions
3. Force password resets for all users
4. Review access logs
5. Patch vulnerabilities
6. Notify users

---

## Additional Resources

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Django REST Framework Security](https://www.django-rest-framework.org/api-guide/authentication/)

---

## Questions or Issues?

If you discover any security vulnerabilities, please report them responsibly:
1. Do NOT post in public issues
2. Email: security@speudom.ac.tz
3. Include: Vulnerability description, impact, reproduction steps

Thank you for keeping SPE UDOM secure!
