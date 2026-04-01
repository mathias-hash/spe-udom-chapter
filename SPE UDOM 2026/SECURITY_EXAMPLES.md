"""
Security Implementation Examples for API Views
==============================================
Demonstrates how to apply RBAC, validation, and security practices in actual views.
"""

# Example 1: Admin-Only Endpoint with Audit Logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from core.permissions import IsAdmin, IsAuthenticated
from core.api_security import AuditLogger, SecurityValidator
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

@api_view(['POST'])
def create_admin_user(request):
    """Create new admin user (admin only)"""
    
    # Permission check
    if not (request.user and request.user.is_authenticated and request.user.role == 'admin'):
        AuditLogger.log_permission_denied(
            request.user,
            'create_admin_user',
            'user_management'
        )
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Input validation
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    full_name = request.data.get('full_name', '').strip()
    
    # Validate email
    if not SecurityValidator.validate_email(email):
        return Response(
            {'error': 'Invalid email format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password strength
    is_valid, msg, score = SecurityValidator.validate_password_strength(password)
    if not is_valid:
        return Response(
            {'error': 'Password too weak', 'feedback': msg},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Sanitize input
    full_name = SecurityValidator.sanitize_input(full_name)
    
    # Create user
    try:
        from core.models import Student
        user = Student.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role='admin'
        )
        
        # Audit log
        AuditLogger.log_data_access(
            request.user,
            'admin_user',
            'create'
        )
        
        return Response(
            {'message': 'Admin user created', 'email': user.email},
            status=status.HTTP_201_CREATED
        )
    
    except Exception as e:
        AuditLogger.log_suspicious_activity(
            request.user,
            'user_creation_failed',
            str(e)
        )
        return Response(
            {'error': 'Failed to create user'},
            status=status.HTTP_400_BAD_REQUEST
        )


# Example 2: Role-Based Event Approval
class EventApprovalView(APIView):
    """Approve/reject events (President & Admin only)"""
    
    def get_permissions(self):
        """Override to apply role-based permissions"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # Only leadership can approve/reject
            return [IsAuthenticated(), IsPresident() | IsAdmin()]
        # Anyone can view
        return [AllowAny()]
    
    def put(self, request, event_id):
        """Approve or reject event"""
        from core.models import Event
        
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get action
        action = request.data.get('action', '').lower()
        if action not in ['approve', 'reject']:
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sanitize rejection reason if provided
        reason = ''
        if action == 'reject':
            reason = SecurityValidator.sanitize_input(
                request.data.get('reason', '')
            )
        
        # Update event
        if action == 'approve':
            event.status = 'approved'
        else:
            event.status = 'rejected'
            event.cancel_reason = reason
        
        event.save()
        
        # Audit log
        AuditLogger.log_data_access(
            request.user,
            'event',
            f'{action}d'
        )
        
        return Response(
            {
                'message': f'Event {action}ed',
                'event_id': event.id,
                'status': event.status
            },
            status=status.HTTP_200_OK
        )


# Example 3: Protected User Data Endpoint
class UserProfileView(APIView):
    """User profile with data sanitization"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Get user profile (own data only or admin)"""
        from core.models import Student
        from core.api_security import ResponseSanitizer
        
        try:
            user = Student.objects.get(id=user_id)
        except Student.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission (own profile or admin)
        if request.user.id != user_id and request.user.role != 'admin':
            AuditLogger.log_permission_denied(
                request.user,
                'view_profile',
                f'user_{user_id}'
            )
            return Response(
                {'error': 'Cannot view other users profiles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Prepare response
        user_data = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
            'role': user.role,
            'date_joined': user.date_joined.isoformat(),
        }
        
        # Sanitize sensitive data
        sanitized = ResponseSanitizer.sanitize_user_data(
            user_data,
            requesting_user=request.user
        )
        
        # Audit log
        AuditLogger.log_data_access(
            request.user,
            'user_profile',
            'view'
        )
        
        return Response(sanitized, status=status.HTTP_200_OK)


# Example 4: Form Validation with Parameterized Queries
class StudentRegistrationView(APIView):
    """Register new student with validation"""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Register new student"""
        from core.models import Student
        
        # Validate request size
        is_valid_size, size_msg = SecurityValidator.validate_request_size(request)
        if not is_valid_size:
            return Response(
                {'error': size_msg},
                status=status.HTTP_413_PAYLOAD_TOO_LARGE
            )
        
        # Collect and validate input
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        full_name = request.data.get('full_name', '').strip()
        phone = request.data.get('phone', '').strip()
        
        # Validate email
        if not SecurityValidator.validate_email(email):
            return Response(
                {'error': 'Invalid email format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if email already exists (using parameterized query)
        if Student.objects.filter(email=email).exists():  # Safe!
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password
        is_valid_pw, pw_msg, score = SecurityValidator.validate_password_strength(password)
        if not is_valid_pw:
            return Response(
                {'error': 'Password too weak', 'feedback': pw_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate phone (optional)
        if phone and not SecurityValidator.validate_phone(phone):
            return Response(
                {'error': 'Invalid phone format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Sanitize input
        full_name = SecurityValidator.sanitize_input(full_name)
        
        # Create user
        try:
            user = Student.objects.create_user(
                email=email,
                full_name=full_name,
                password=password,
                phone=phone,
                role='member'
            )
            
            # Audit log
            AuditLogger.log_authentication(
                user,
                True,
                request.META.get('REMOTE_ADDR'),
                request.META.get('HTTP_USER_AGENT')
            )
            
            return Response(
                {
                    'message': 'Registration successful',
                    'email': user.email,
                    'full_name': user.full_name
                },
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            AuditLogger.log_suspicious_activity(
                None,
                'registration_failed',
                str(e)
            )
            return Response(
                {'error': 'Registration failed'},
                status=status.HTTP_400_BAD_REQUEST
            )


# Example 5: Custom Permission Check
class PublicationManagementView(APIView):
    """Manage publications with custom permissions"""
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        # POST, PUT, DELETE require leadership
        return [IsAuthenticated(), IsLeadership()]
    
    def get(self, request):
        """Get publications (public)"""
        from core.models import Publication
        
        publications = Publication.objects.all().order_by('-created_at')[:50]
        
        data = [{
            'id': p.id,
            'title': p.title,
            'content': p.content[:200],
            'type': p.pub_type,
            'created_at': p.created_at.isoformat()
        } for p in publications]
        
        return Response(data)
    
    def post(self, request):
        """Create publication (leadership only)"""
        from core.models import Publication
        
        title = SecurityValidator.sanitize_input(request.data.get('title', ''))
        content = SecurityValidator.sanitize_input(request.data.get('content', ''))
        
        if not title or len(title) < 5:
            return Response(
                {'error': 'Title required (minimum 5 characters)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            pub = Publication.objects.create(
                title=title,
                content=content,
                published_by=request.user,
                pub_type=request.data.get('pub_type', 'article')
            )
            
            AuditLogger.log_data_access(
                request.user,
                'publication',
                'create'
            )
            
            return Response(
                {'message': 'Publication created', 'id': pub.id},
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {'error': 'Failed to create publication'},
                status=status.HTTP_400_BAD_REQUEST
            )


# Example 6: Using Encryption for Sensitive Data
def encrypt_sensitive_operations(request):
    """Example of encrypted data handling"""
    from core.encryption import encryption_service
    
    # Example: Encrypt user contact info
    phone = request.data.get('phone')
    encrypted_phone = encryption_service.encrypt(phone)
    
    # Store encrypted_phone in database
    # When retrieving, it auto-decrypts if using EncryptedField
    
    # Or manually decrypt
    decrypted_phone = encryption_service.decrypt(encrypted_phone)
    
    return Response({'phone': decrypted_phone.startswith('+255')})
