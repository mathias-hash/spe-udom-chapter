"""
Security Quick Reference Guide
==============================
Fast lookup for common security tasks and implementations.
"""

# ─────────────────────────────────────────────────────────────
# 1. PERMISSION CLASSES - Role-Based Access Control
# ─────────────────────────────────────────────────────────────

"""
from core.permissions import (
    IsAdmin,                  # Only admin
    IsPresident,             # Only president  
    IsGeneralSecretary,      # Only secretary
    IsAdminOrPresident,      # Admin or president
    IsLeadership,            # All leadership
    IsAuthenticated,         # Any logged-in user
    IsOwnerOrAdmin,          # Owner of object or admin
    CanVote,                 # Can vote in elections
    CanCreateEvent,          # Can create events
    CanApproveEvent,         # Can approve events
    CanSendAnnouncement,     # Can send announcements
    CanManageElections,      # Can manage elections
    CanViewAnalytics,        # Can view analytics
)

# Usage in APIView
from rest_framework.views import APIView

class MySecureView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def post(self, request):
        # Only authenticated admin users can reach here
        pass

# Usage in function view
from rest_framework.decorators import api_view, permission_classes

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsLeadership])
def leadership_only_function(request):
    pass
"""

# ─────────────────────────────────────────────────────────────
# 2. INPUT VALIDATION & SANITIZATION
# ─────────────────────────────────────────────────────────────

"""
from core.api_security import SecurityValidator

# Validate email
is_valid, msg = SecurityValidator.validate_email("user@example.com")
# Returns: (True/False, error_message)

# Validate phone
is_valid, msg = SecurityValidator.validate_phone("+255785123456")

# Check password strength
is_valid, msg, score = SecurityValidator.validate_password_strength("Secure@Pass123")
# Returns: (is_valid, message, score_1_to_4)

# Sanitize user input
clean_text = SecurityValidator.sanitize_input("<script>alert</script>")
# Returns: "alert"

# Validate request size doesn't exceed limit (10MB)
is_valid, msg = SecurityValidator.validate_request_size(request)
"""

# ─────────────────────────────────────────────────────────────
# 3. DATA ENCRYPTION (Sensitive Fields)
# ─────────────────────────────────────────────────────────────

"""
from core.encryption import encryption_service, EncryptedField
from django.db import models

# Option A: Encrypt specific data when needed
encrypted = encryption_service.encrypt("sensitive_data")
decrypted = encryption_service.decrypt(encrypted)

# Option B: Use EncryptedField (auto-encrypt in DB)
class MyModel(models.Model):
    # This field is automatically encrypted in database
    # and decrypted when retrieved
    sensitive_info = EncryptedField(max_length=500)

# Option C: Hash one-way (for passwords, already handled by Django)
hashed = encryption_service.hash_sensitive_data("data_to_hash")
"""

# ─────────────────────────────────────────────────────────────
# 4. AUDIT LOGGING
# ─────────────────────────────────────────────────────────────

"""
from core.api_security import AuditLogger

# Log authentication attempt
AuditLogger.log_authentication(
    user=user,
    success=True,
    ip_address=request.META.get('REMOTE_ADDR'),
    user_agent=request.META.get('HTTP_USER_AGENT')
)

# Log permission denial
AuditLogger.log_permission_denied(
    user=request.user,
    action='delete_event',
    resource='event_123'
)

# Log data access
AuditLogger.log_data_access(
    user=request.user,
    data_type='email_list',
    action='export'
)

# Log suspicious activity
AuditLogger.log_suspicious_activity(
    user=request.user,
    activity='multiple_failed_login',
    details='5 attempts in 10 minutes'
)
"""

# ─────────────────────────────────────────────────────────────
# 5. SECURITY DECORATORS
# ─────────────────────────────────────────────────────────────

"""
from core.api_security import (
    require_https,
    rate_limit_by_ip,
    check_ip_whitelist,
    validate_content_type
)

# Require HTTPS only
@require_https
def sensitive_view(request):
    pass

# Rate limit by IP (50 requests per hour)
@rate_limit_by_ip(limit=50, period=3600)
def expensive_operation(request):
    pass

# Whitelist IPs
@check_ip_whitelist
def admin_only_by_ip(request):
    pass

# Validate content type
@validate_content_type(['application/json'])
def json_only_api(request):
    pass
"""

# ─────────────────────────────────────────────────────────────
# 6. RESPONSE SANITIZATION
# ─────────────────────────────────────────────────────────────

"""
from core.api_security import ResponseSanitizer

# Remove sensitive fields from user data
clean_user = ResponseSanitizer.sanitize_user_data(
    user_data,
    requesting_user=request.user
)
# Removes: password, api_key, secret, token, etc.

# Sanitize any response data
safe_response = ResponseSanitizer.sanitize_response(response_data)
# Removes dangerous patterns from strings
"""

# ─────────────────────────────────────────────────────────────
# 7. PARAMETERIZED QUERIES (Auto-handled by Django ORM)
# ─────────────────────────────────────────────────────────────

"""
from django.db import models

# SAFE - Django ORM uses parameterized queries
students = Student.objects.filter(email=user_email)
results = Student.objects.filter(email__icontains=search)

# SAFE - With multiple conditions
events = Event.objects.filter(
    models.Q(status='approved') &
    models.Q(created_by=user)
)

# UNSAFE - NEVER use string formatting!
# DON'T DO THIS:
Student.objects.raw(f"SELECT * FROM student WHERE email = '{email}'")

# If raw SQL is absolutely required, use parameters:
from django.db import connection
cursor = connection.cursor()
cursor.execute(
    "SELECT * FROM student WHERE email = %s",
    [email]  # Parameters passed separately
)
"""

# ─────────────────────────────────────────────────────────────
# 8. SECURE API RESPONSES
# ─────────────────────────────────────────────────────────────

"""
from rest_framework.response import Response
from rest_framework import status

# Include security headers automatically (via middleware)
# Response includes:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security
# - Content-Security-Policy
# - etc.

# Return error responses
def my_view(request):
    # Don't leak sensitive info in error messages
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        # Generic message
        return Response(
            {'error': 'Resource not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    if request.user != user and request.user.role != 'admin':
        return Response(
            {'error': 'Access denied'},
            status=status.HTTP_403_FORBIDDEN
        )
"""

# ─────────────────────────────────────────────────────────────
# 9. CONFIGURATION BEST PRACTICES
# ─────────────────────────────────────────────────────────────

"""
# .env file should contain:
DEBUG=False
SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-fernet-key
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=yourdomain.com
TRUSTED_ORIGINS=https://yourdomain.com
ENFORCE_HTTPS=True
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# NEVER:
- Commit .env to git
- Share SECRET_KEY or ENCRYPTION_KEY
- Use weak passwords
- Disable HTTPS in production
- Set DEBUG=True in production
- Use default database credentials
"""

# ─────────────────────────────────────────────────────────────
# 10. COMMON IMPLEMENTATIONS
# ─────────────────────────────────────────────────────────────

"""
# Secure user registration
@api_view(['POST'])
def register(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Validate email format
    if not SecurityValidator.validate_email(email):
        return Response({'error': 'Invalid email'}, 400)
    
    # Check duplicate (safe parameterized query)
    if Student.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, 400)
    
    # Validate password strength
    is_valid, msg, score = SecurityValidator.validate_password_strength(password)
    if not is_valid:
        return Response({'error': f'Weak password: {msg}'}, 400)
    
    # Sanitize input
    full_name = SecurityValidator.sanitize_input(request.data.get('full_name'))
    
    # Create user (password auto-hashed)
    user = Student.objects.create_user(
        email=email,
        full_name=full_name,
        password=password
    )
    
    # Log event
    AuditLogger.log_authentication(user, True, 
        request.META.get('REMOTE_ADDR'),
        request.META.get('HTTP_USER_AGENT'))
    
    return Response({'message': 'Registered successfully'}, 201)

# Secure data access
class SecureDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        # Check ownership
        if request.user.id != user_id and request.user.role != 'admin':
            AuditLogger.log_permission_denied(
                request.user, 'access_user_data', f'user_{user_id}')
            return Response({'error': 'Access denied'}, 403)
        
        user = Student.objects.get(id=user_id)
        
        # Sanitize response
        data = ResponseSanitizer.sanitize_user_data({
            'id': user.id,
            'email': user.email,
            'name': user.full_name,
            'phone': user.phone,
        })
        
        AuditLogger.log_data_access(
            request.user, 'user_data', 'view')
        
        return Response(data)
"""

# ─────────────────────────────────────────────────────────────
# 11. SETUP COMMANDS
# ─────────────────────────────────────────────────────────────

"""
# Generate encryption keys and create .env
python setup_security.py create

# Validate .env configuration
python setup_security.py validate

# Apply database migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Run security checks
python manage.py check --deploy

# Install packages
pip install -r requirements.txt
"""

# ─────────────────────────────────────────────────────────────
# 12. TESTING SECURITY
# ─────────────────────────────────────────────────────────────

"""
from rest_framework.test import APITestCase
from core.models import Student

class SecurityTests(APITestCase):
    
    def setUp(self):
        self.admin = Student.objects.create_user(
            email='admin@test.com',
            full_name='Admin',
            password='SecurePass@123',
            role='admin'
        )
        self.member = Student.objects.create_user(
            email='member@test.com',
            full_name='Member',
            password='SecurePass@123',
            role='member'
        )
    
    def test_admin_only_endpoint(self):
        # Member shouldn't access
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/admin/create-user/')
        self.assertEqual(response.status_code, 403)
        
        # Admin should access
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/create-user/')
        self.assertNotEqual(response.status_code, 403)
    
    def test_password_validation(self):
        # Weak password rejected
        response = self.client.post('/api/register/', {
            'email': 'new@test.com',
            'password': 'weak',
            'full_name': 'Test'
        })
        self.assertEqual(response.status_code, 400)
    
    def test_email_validation(self):
        # Invalid email rejected
        response = self.client.post('/api/register/', {
            'email': 'not-an-email',
            'password': 'SecurePass@123',
            'full_name': 'Test'
        })
        self.assertEqual(response.status_code, 400)
"""

print(__doc__)
