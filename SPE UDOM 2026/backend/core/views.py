from django.http import JsonResponse
from django.core.mail import send_mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes, throttle_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from .serializers import (
    RegisterSerializer, LoginSerializer, StudentSerializer, StudentUpdateSerializer,
    EventSerializer, AnnouncementSerializer, PublicationSerializer,
    ElectionSerializer, CandidateSerializer, SuggestionSerializer
)
from .models import (
    Student, Event, EventRegistration, Announcement, Publication,
    Election, Candidate, Vote, Suggestion, LeadershipMember, POSITION_CHOICES,
    AnnualReport, AnnualReportImage, FinancialItem, available_academic_years,
    latest_available_academic_year, is_valid_academic_year_format, is_allowed_academic_year
)
from .security import log_security_event, sanitize_input, validate_pagination
from .validators import validate_document_file, validate_image_file


# ── Throttling ─────────────────────────────────────────────────
class StrictAnonThrottle(AnonRateThrottle):
    scope = 'strict_anon'
    THROTTLE_RATES = {'strict_anon': '50/hour'}  # For auth endpoints


class NormalUserThrottle(UserRateThrottle):
    scope = 'normal_user'
    THROTTLE_RATES = {'normal_user': '500/hour'}


class PublicReadThrottle(AnonRateThrottle):
    scope = 'public_read'
    THROTTLE_RATES = {'public_read': '200/hour'}


class PublicWriteThrottle(AnonRateThrottle):
    scope = 'public_write'
    THROTTLE_RATES = {'public_write': '20/hour'}


# ── Permissions ───────────────────────────────────────────────
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active and request.user.role == 'admin'


class IsPresident(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active and request.user.role in ['admin', 'president']


class IsGeneralSecretary(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active and request.user.role in ['admin', 'general_secretary']


# ── Helpers ───────────────────────────────────────────────────
def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


def paginate(queryset, request, serializer_class, **kwargs):
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    page, page_size = validate_pagination(page, page_size)
    
    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    items = serializer_class(queryset[start:end], many=True, **kwargs).data
    return {
        'results': items, 'total': total, 'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size,
    }


def validate_uploaded_image(file_obj, field_name='image'):
    try:
        validate_image_file(file_obj)
    except DjangoValidationError as exc:
        return Response({field_name: exc.messages[0] if exc.messages else 'Invalid image upload'}, status=400)
    return None


def validate_uploaded_document(file_obj, field_name='file'):
    try:
        validate_document_file(file_obj)
    except DjangoValidationError as exc:
        return Response({field_name: exc.messages[0] if exc.messages else 'Invalid file upload'}, status=400)
    return None


# ── Auth ──────────────────────────────────────────────────────
@api_view(['POST'])
@throttle_classes([StrictAnonThrottle])
def register(request):
    """Register new user with security validation"""
    s = RegisterSerializer(data=request.data)
    if s.is_valid():
        user = s.save()
        # Send welcome email without exposing sensitive info
        try:
            send_mail(
                'Welcome to SPE UDOM Chapter!',
                f'Hi {user.full_name},\n\nWelcome to SPE UDOM Student Chapter!\n\nBest regards,\nSPE UDOM Team',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False
            )
        except Exception as e:
            log_security_event('EMAIL_SEND_FAILED', details=f'Registration email for {user.email}')
        
        log_security_event('USER_REGISTERED', user=user)
        return Response({
            'message': 'Registration successful',
            'tokens': get_tokens(user),
            'user': StudentSerializer(user).data
        }, status=201)
    
    # Log failed registration attempts for suspicious activity
    if 'email' in s.errors:
        email = request.data.get('email', 'unknown')
        log_security_event('REGISTRATION_FAILED', details=f'Email: {email}')
    
    return Response(s.errors, status=400)


@api_view(['POST'])
@throttle_classes([StrictAnonThrottle])
def login(request):
    """Authenticate user with rate limiting and logging"""
    s = LoginSerializer(data=request.data)
    if s.is_valid():
        user = s.validated_data['user']
        log_security_event('USER_LOGIN', user=user)
        return Response({
            'message': 'Login successful',
            'tokens': get_tokens(user),
            'user': StudentSerializer(user).data
        })
    
    # Log failed login attempts
    email = request.data.get('email', 'unknown')
    log_security_event('FAILED_LOGIN_ATTEMPT', details=f'Email: {email}')
    return Response(s.errors, status=400)


@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def profile(request):
    """Get or update user profile"""
    if request.method == 'GET':
        return Response(StudentSerializer(request.user).data)
    
    s = StudentUpdateSerializer(request.user, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        log_security_event('PROFILE_UPDATED', user=request.user)
        return Response(StudentSerializer(request.user).data)
    return Response(s.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password with validation"""
    current_password = sanitize_input(request.data.get('current_password', ''))
    new_password = sanitize_input(request.data.get('new_password', ''))
    confirm_password = sanitize_input(request.data.get('confirm_password', ''))

    if not current_password or not new_password or not confirm_password:
        return Response({'error': 'All fields are required'}, status=400)

    if not request.user.check_password(current_password):
        log_security_event('FAILED_PASSWORD_CHANGE', user=request.user, details='Incorrect current password')
        return Response({'current_password': 'Current password is incorrect'}, status=400)
    
    if new_password != confirm_password:
        return Response({'confirm_password': 'Passwords do not match'}, status=400)

    try:
        validate_password(new_password, user=request.user)
    except DjangoValidationError as exc:
        return Response({'new_password': list(exc.messages)}, status=400)

    request.user.set_password(new_password)
    request.user.save()
    log_security_event('PASSWORD_CHANGED', user=request.user)
    return Response({'message': 'Password changed successfully. Please log in again'})


@api_view(['POST'])
@throttle_classes([StrictAnonThrottle])
def forgot_password(request):
    """Request password reset with security"""
    email = sanitize_input(request.data.get('email', '')).lower()
    
    try:
        user = Student.objects.get(email=email)
        if not user.is_active:
            # Don't reveal that account is inactive
            return Response({'message': 'If this email exists, a reset link has been sent'})
        
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.PASSWORD_RESET_CONFIRM_URL}/{uid}/{token}/"
        
        send_mail(
            'Password Reset - SPE UDOM Chapter',
            f'Hi {user.full_name},\n\nClick the link below to reset your password:\n{reset_url}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.\n\nBest regards,\nSPE UDOM Team',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False
        )
        log_security_event('PASSWORD_RESET_REQUESTED', user=user)
    except Student.DoesNotExist:
        # Don't reveal whether email exists
        pass
    except Exception as e:
        log_security_event('PASSWORD_RESET_EMAIL_FAILED', details=f'Email: {email}')
    
    # Always return same message for security
    return Response({'message': 'If this email exists, a reset link has been sent'})


@api_view(['POST'])
@throttle_classes([StrictAnonThrottle])
def reset_password(request, uidb64, token):
    """Reset password with token validation"""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = Student.objects.get(pk=uid)
    except (Student.DoesNotExist, ValueError, TypeError):
        log_security_event('INVALID_PASSWORD_RESET_ATTEMPT', details=f'UID: {uidb64}')
        return Response({'error': 'Invalid reset link'}, status=400)
    
    if not default_token_generator.check_token(user, token):
        log_security_event('EXPIRED_PASSWORD_RESET_ATTEMPT', user=user)
        return Response({'error': 'Reset link is invalid or has expired'}, status=400)
    
    password = sanitize_input(request.data.get('password', ''))
    confirm = sanitize_input(request.data.get('confirm_password', ''))
    
    if not password or not confirm:
        return Response({'error': 'All fields are required'}, status=400)
    
    if password != confirm:
        return Response({'error': 'Passwords do not match'}, status=400)

    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        return Response({'password': list(exc.messages)}, status=400)
    
    user.set_password(password)
    user.save()
    log_security_event('PASSWORD_RESET_SUCCESSFUL', user=user)
    return Response({'message': 'Password reset successful. You can now log in'})


# ── Admin ─────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_dashboard(request):
    """Admin dashboard with statistics"""
    return Response({
        'total_members': Student.objects.filter(is_active=True).count(),
        'total_events': Event.objects.count(),
        'pending_events': Event.objects.filter(status='pending').count(),
        'total_publications': Publication.objects.count(),
        'total_elections': Election.objects.count(),
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def list_users(request):
    search = request.GET.get('search', '')
    qs = Student.objects.all().order_by('-date_joined')
    if search:
        qs = qs.filter(full_name__icontains=search) | qs.filter(email__icontains=search)
    return Response(paginate(qs, request, StudentSerializer))


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def manage_user(request, pk):
    try:
        user = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    if request.method == 'GET':
        return Response(StudentSerializer(user).data)
    if request.method == 'PATCH':
        allowed = ['role', 'full_name', 'phone', 'year_of_study']
        for field in allowed:
            if field in request.data:
                val = request.data[field]
                if field == 'role' and val not in dict(Student.ROLE_CHOICES):
                    return Response({'error': 'Invalid role'}, status=400)
                if field == 'year_of_study':
                    if val not in ['', None] and int(val) not in [1, 2, 3, 4]:
                        return Response({'year_of_study': 'Year of study must be 1, 2, 3, or 4.'}, status=400)
                    val = None if val in ['', None] else int(val)
                setattr(user, field, val)
        user.save()
        return Response(StudentSerializer(user).data)
    user.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_user(request):
    """Create a new user with proper password validation and error handling"""
    # Validate required fields
    required = ['email', 'full_name', 'password', 'confirm_password']
    for field in required:
        if not request.data.get(field):
            return Response({field: [f'{field.replace("_", " ").title()} is required']}, status=400)
    
    # Validate passwords match
    if request.data.get('password') != request.data.get('confirm_password'):
        return Response({'confirm_password': ['Passwords do not match']}, status=400)
    
    # Use RegisterSerializer for validation (includes password strength check)
    s = RegisterSerializer(data=request.data)
    if s.is_valid():
        user = s.save()
        role = request.data.get('role', 'member')
        if role in dict(Student.ROLE_CHOICES):
            user.role = role
            user.save()
            log_security_event('USER_CREATED', user=user, details=f'Created by admin: {request.user.email}, Role: {role}')
        return Response(StudentSerializer(user).data, status=201)
    
    # Return detailed validation errors to help admin understand what went wrong
    return Response(s.errors, status=400)


# ── Events ────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def events(request):
    if request.method == 'GET':
        search = request.GET.get('search', '')
        qs = Event.objects.filter(status='approved') if request.user.role == 'member' else Event.objects.all()
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(location__icontains=search)
        return Response(paginate(qs.order_by('-date'), request, EventSerializer, context={'request': request}))
    
    # Allow admin, president, and general_secretary to create events
    if request.user.role not in ['admin', 'president', 'general_secretary']:
        return Response({'error': 'Permission denied'}, status=403)
    
    s = EventSerializer(data=request.data, context={'request': request})
    if s.is_valid():
        s.save(created_by=request.user, status='approved' if request.user.role == 'admin' else 'pending')
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def event_detail(request, pk):
    """Get, update, or delete a specific event"""
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    
    if request.method == 'GET':
        return Response(EventSerializer(event, context={'request': request}).data)
    
    # Check permissions for update/delete
    if event.created_by.id != request.user.id and request.user.role not in ['admin', 'president']:
        return Response({'error': 'Permission denied'}, status=403)
    
    if request.method == 'PATCH':
        s = EventSerializer(event, data=request.data, partial=True, context={'request': request})
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)
    
    if request.method == 'DELETE':
        event.delete()
        return Response(status=204)


@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def event_photos(request, pk):
    """Manage event photos (upload and retrieve)"""
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    
    if request.method == 'GET':
        photos = event.photos.all()
        data = [{
            'id': p.id,
            'photo': request.build_absolute_uri(p.photo.url) if p.photo else None,
            'caption': p.caption,
            'uploaded_by': p.uploaded_by.full_name if p.uploaded_by else None,
            'uploaded_at': p.uploaded_at.isoformat()
        } for p in photos]
        return Response(data)
    
    # POST - Upload photo
    from .models import EventPhoto
    if event.created_by.id != request.user.id and request.user.role not in ['admin', 'president', 'general_secretary']:
        return Response({'error': 'Permission denied'}, status=403)
    
    photo = request.FILES.get('photo')
    if not photo:
        return Response({'error': 'Photo is required'}, status=400)
    invalid_photo_response = validate_uploaded_image(photo, 'photo')
    if invalid_photo_response:
        return invalid_photo_response
    
    event_photo = EventPhoto.objects.create(
        event=event,
        photo=photo,
        caption=sanitize_input(request.data.get('caption', ''), max_length=200),
        uploaded_by=request.user
    )
    return Response({
        'id': event_photo.id,
        'photo': request.build_absolute_uri(event_photo.photo.url),
        'caption': event_photo.caption,
        'uploaded_by': request.user.full_name,
        'uploaded_at': event_photo.uploaded_at.isoformat()
    }, status=201)


@api_view(['PATCH'])
@permission_classes([IsPresident])
def approve_event(request, pk):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    event.status = request.data.get('status', 'approved')
    if event.status == 'cancelled':
        event.cancel_reason = request.data.get('cancel_reason', '')
    event.save()
    return Response(EventSerializer(event).data)


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def delete_event(request, pk):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    event.delete()
    return Response(status=204)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def register_event(request, pk):
    try:
        event = Event.objects.get(pk=pk, status='approved')
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    if request.method == 'POST':
        reg, created = EventRegistration.objects.get_or_create(student=request.user, event=event)
        if created:
            try:
                send_mail(f'Event Registration: {event.title}',
                    f'Hi {request.user.full_name},\n\nYou registered for "{event.title}" on {event.date.strftime("%B %d, %Y")} at {event.location}.\n\nSPE UDOM Team',
                    None, [request.user.email], fail_silently=True)
            except Exception:
                pass
        return Response({'registered': True}, status=201 if created else 200)
    EventRegistration.objects.filter(student=request.user, event=event).delete()
    return Response({'registered': False})


# ── Announcements ─────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def announcements(request):
    if request.method == 'GET':
        return Response(AnnouncementSerializer(Announcement.objects.order_by('-created_at'), many=True).data)
    if request.user.role not in ['admin', 'president']:
        return Response({'error': 'Permission denied'}, status=403)
    s = AnnouncementSerializer(data=request.data)
    if s.is_valid():
        announcement = s.save(sent_by=request.user)
        emails = list(Student.objects.filter(is_active=True).values_list('email', flat=True))
        if emails:
            try:
                send_mail(f'Announcement: {announcement.title}',
                    f'{announcement.message}\n\n— {request.user.full_name}\nSPE UDOM Chapter',
                    None, emails, fail_silently=True)
            except Exception:
                pass
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


# ── Publications ──────────────────────────────────────────────
@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def publications(request):
    if request.method == 'GET':
        search = request.GET.get('search', '')
        qs = Publication.objects.all()
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(content__icontains=search)
        return Response(paginate(qs.order_by('-created_at'), request, PublicationSerializer))
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication credentials were not provided'}, status=401)
    if request.user.role not in ['admin', 'general_secretary']:
        return Response({'error': 'Permission denied'}, status=403)
    upload = request.FILES.get('file')
    if upload:
        invalid_file_response = validate_uploaded_document(upload, 'file')
        if invalid_file_response:
            return invalid_file_response
    s = PublicationSerializer(data=request.data)
    if s.is_valid():
        s.save(published_by=request.user)
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsGeneralSecretary])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def delete_publication(request, pk):
    try:
        pub = Publication.objects.get(pk=pk)
    except Publication.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    if request.method == 'DELETE':
        pub.delete()
        return Response(status=204)
    s = PublicationSerializer(pub, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        return Response(s.data)
    return Response(s.errors, status=400)


# ── Elections ─────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def elections(request):
    if request.method == 'GET':
        qs = Election.objects.order_by('-created_at')
        return Response(ElectionSerializer(qs, many=True, context={'request': request}).data)
    if request.user.role not in ['admin', 'general_secretary']:
        return Response({'error': 'Permission denied'}, status=403)
    s = ElectionSerializer(data=request.data)
    if s.is_valid():
        s.save(created_by=request.user)
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def election_detail(request, pk):
    try:
        election = Election.objects.get(pk=pk)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found'}, status=404)

    if request.method == 'GET':
        return Response(ElectionSerializer(election, context={'request': request}).data)

    if request.user.role not in ['admin', 'general_secretary']:
        return Response({'error': 'Permission denied'}, status=403)

    if request.method == 'PATCH':
        for field in ['title', 'description', 'status', 'start_date', 'end_date']:
            if field in request.data:
                setattr(election, field, request.data[field])
        election.save()
        return Response(ElectionSerializer(election, context={'request': request}).data)

    election.delete()
    return Response(status=204)


@api_view(['GET'])
def public_election(request):
    """Public endpoint — returns the latest open or most recent election."""
    election = Election.objects.filter(status='open').order_by('-created_at').first()
    if not election:
        election = Election.objects.order_by('-created_at').first()
    if not election:
        return Response({
            'message': 'No election available yet',
            'results': None,
        })
    return Response(ElectionSerializer(election, context={'request': request}).data)


@api_view(['GET'])
def public_election_detail(request, pk):
    try:
        election = Election.objects.get(pk=pk)
    except Election.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    return Response(ElectionSerializer(election, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsGeneralSecretary])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def add_candidate(request, election_id):
    try:
        election = Election.objects.get(pk=election_id)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found'}, status=404)
    photo = request.FILES.get('photo')
    if photo:
        invalid_photo_response = validate_uploaded_image(photo, 'photo')
        if invalid_photo_response:
            return invalid_photo_response
    s = CandidateSerializer(data=request.data, context={'request': request})
    if s.is_valid():
        s.save(election=election, approved=True)
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsGeneralSecretary])
def manage_candidate(request, pk):
    try:
        candidate = Candidate.objects.get(pk=pk)
    except Candidate.DoesNotExist:
        return Response({'error': 'Candidate not found'}, status=404)
    if request.method == 'DELETE':
        candidate.delete()
        return Response(status=204)
    candidate.approved = request.data.get('approved', candidate.approved)
    candidate.save()
    return Response(CandidateSerializer(candidate, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cast_vote(request, election_id):
    try:
        election = Election.objects.get(pk=election_id, status='open')
        candidate = Candidate.objects.get(pk=request.data.get('candidate_id'), election=election, approved=True)
    except (Election.DoesNotExist, Candidate.DoesNotExist):
        return Response({'error': 'Invalid election or candidate'}, status=400)
    if Vote.objects.filter(election=election, voter=request.user, position_voted=candidate.position).exists():
        return Response({'error': 'Already voted for this position'}, status=400)
    Vote.objects.create(election=election, voter=request.user, candidate=candidate, position_voted=candidate.position)
    return Response({'message': 'Vote cast successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_votes(request, election_id):
    """Returns positions the current user has already voted for."""
    voted_positions = list(
        Vote.objects.filter(election_id=election_id, voter=request.user).values_list('position_voted', flat=True)
    )
    return Response({'voted_positions': voted_positions})


@api_view(['GET'])
def election_results(request, election_id):
    try:
        election = Election.objects.get(pk=election_id)
    except Election.DoesNotExist:
        return Response({'error': 'Election not found'}, status=404)
    if election.status != 'closed':
        return Response({'error': 'Results are only available after the election closes'}, status=403)
    candidates = Candidate.objects.filter(election=election, approved=True)
    total_votes = Vote.objects.filter(election=election).count()
    results = []
    for c in candidates:
        count = c.votes_received.count()
        results.append({
            'id': c.id,
            'name': c.name,
            'position': c.position,
            'vote_count': count,
            'percentage': round((count / total_votes * 100), 1) if total_votes > 0 else 0,
            'photo_url': request.build_absolute_uri(c.photo.url) if c.photo else '',
        })
    return Response({'total_votes': total_votes, 'results': results})


@api_view(['GET'])
def position_choices(request):
    return Response({'positions': [p[0] for p in POSITION_CHOICES]})


# ── Suggestions ───────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def suggestions(request):
    if request.method == 'GET':
        if request.user.role not in ['admin', 'president']:
            return Response({'error': 'Permission denied'}, status=403)
        return Response(SuggestionSerializer(Suggestion.objects.order_by('-created_at'), many=True).data)
    s = SuggestionSerializer(data=request.data)
    if s.is_valid():
        s.save(student=request.user)
        return Response(s.data, status=201)
    return Response(s.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_suggestions(request):
    """Member views their own suggestions and replies."""
    qs = Suggestion.objects.filter(student=request.user).order_by('-created_at')
    return Response(SuggestionSerializer(qs, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def reply_suggestion(request, pk):
    """Admin/President replies to a suggestion."""
    if request.user.role not in ['admin', 'president']:
        return Response({'error': 'Permission denied'}, status=403)
    try:
        suggestion = Suggestion.objects.get(pk=pk)
    except Suggestion.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    reply = request.data.get('reply', '').strip()
    if not reply:
        return Response({'error': 'Reply cannot be empty.'}, status=400)
    from django.utils import timezone
    suggestion.reply = reply
    suggestion.replied_by = request.user
    suggestion.replied_at = timezone.now()
    suggestion.save()
    return Response(SuggestionSerializer(suggestion).data)


# ── Role Dashboards ───────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsPresident])
def president_dashboard(request):
    return Response({
        'total_members': Student.objects.count(),
        'approved_events': Event.objects.filter(status='approved').count(),
        'pending_events': Event.objects.filter(status='pending').count(),
        'announcements': Announcement.objects.count(),
        'suggestions': Suggestion.objects.count(),
        'participation': EventRegistration.objects.count(),
    })


@api_view(['GET'])
@permission_classes([IsGeneralSecretary])
def secretary_dashboard(request):
    return Response({
        'total_elections': Election.objects.count(),
        'open_elections': Election.objects.filter(status='open').count(),
        'pending_candidates': Candidate.objects.filter(approved=False).count(),
        'total_publications': Publication.objects.count(),
        'total_votes': Vote.objects.count(),
    })


# ── Public ────────────────────────────────────────────────────
def public_stats(request):
    return JsonResponse({
        'members': Student.objects.count(),
        'events': Event.objects.filter(status='approved').count(),
        'publications': Publication.objects.count(),
        'elections': Election.objects.count(),
    })

def home(request):
    return JsonResponse({"page": "home"})

def about(request):
    return JsonResponse({"page": "about"})

def leadership(request):
    year = request.GET.get('year') or latest_available_academic_year()
    if not is_allowed_academic_year(year):
        return JsonResponse({'error': 'Invalid year. Allowed years are from 2024/2025 to 2026/2027 unless a new year has been advanced.'}, status=400)
    members = []
    for m in LeadershipMember.objects.filter(year=year):
        members.append({'id': m.id, 'name': m.name, 'position': m.position, 'year': m.year,
                        'image_url': request.build_absolute_uri(m.image.url) if m.image else ''})
    return JsonResponse({'year': year, 'members': members})


def leadership_years(request):
    """Return all allowed years from 2024/2025 to 2026/2027, plus any future year explicitly advanced."""
    return JsonResponse({'years': available_academic_years()})


@api_view(['DELETE'])
@permission_classes([IsGeneralSecretary])
def leadership_delete_year(request, year):
    """Delete all leadership members for a given academic year."""
    deleted, _ = LeadershipMember.objects.filter(year=year).delete()
    if deleted == 0:
        return Response({'error': 'No leadership records found for this year.'}, status=404)
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsGeneralSecretary])
def leadership_advance_year(request):
    """Advance the current academic year by one (e.g. 2025/2026 → 2026/2027)."""
    current = request.data.get('current_year') or latest_available_academic_year()
    if not is_allowed_academic_year(current):
        return Response({'error': 'Current year is not allowed.'}, status=400)
    try:
        start = int(current.split('/')[0])
    except (ValueError, IndexError):
        return Response({'error': 'Invalid year format.'}, status=400)
    next_year = f'{start + 1}/{start + 2}'
    # Persist a sentinel so leadership_years includes this year for all users
    LeadershipMember.objects.get_or_create(
        position='PRESIDENT', year=next_year,
        defaults={'name': 'To Be Announced'}
    )
    return Response({'next_year': next_year})


@api_view(['POST'])
@permission_classes([IsGeneralSecretary])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def leadership_create(request):
    name = request.data.get('name', '').strip()
    position = request.data.get('position', '').strip()
    image = request.FILES.get('image')
    if not name or not position:
        return Response({'error': 'Name and position are required.'}, status=400)
    year = request.data.get('year', '').strip() or latest_available_academic_year()
    if not is_valid_academic_year_format(year):
        return Response({'error': 'Year must be in format YYYY/YYYY and consecutive, e.g. 2025/2026.'}, status=400)
    if not is_allowed_academic_year(year):
        return Response({'error': 'Year must be between 2024/2025 and 2026/2027 unless a newer year has been advanced.'}, status=400)
    if image:
        invalid_image_response = validate_uploaded_image(image, 'image')
        if invalid_image_response:
            return invalid_image_response
    obj, _ = LeadershipMember.objects.update_or_create(
        position=position, year=year,
        defaults={'name': name, **(({'image': image}) if image else {})}
    )
    return Response({'id': obj.id, 'name': obj.name, 'position': obj.position, 'year': obj.year,
                     'image_url': request.build_absolute_uri(obj.image.url) if obj.image else ''}, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsGeneralSecretary])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def leadership_detail(request, pk):
    try:
        obj = LeadershipMember.objects.get(pk=pk)
    except LeadershipMember.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    if request.method == 'DELETE':
        obj.delete()
        return Response(status=204)
    if 'name' in request.data:
        obj.name = request.data['name']
    if 'image' in request.FILES:
        invalid_image_response = validate_uploaded_image(request.FILES['image'], 'image')
        if invalid_image_response:
            return invalid_image_response
        obj.image = request.FILES['image']
    obj.save()
    return Response({'id': obj.id, 'name': obj.name, 'position': obj.position,
                     'image_url': request.build_absolute_uri(obj.image.url) if obj.image else ''})

@api_view(['GET', 'POST'])
@throttle_classes([PublicWriteThrottle])
def contact(request):
    if request.method == 'GET':
        return Response({"page": "contact"})

    from .models import ContactMessage
    name = sanitize_input(request.data.get('name', ''), max_length=100)
    email = sanitize_input(request.data.get('email', ''), max_length=254).lower()
    subject = sanitize_input(request.data.get('subject', ''), max_length=200) or 'SPE UDOM Contact Form'
    message = sanitize_input(request.data.get('message', ''), max_length=5000)

    if not name or not email or not message:
        return Response({'error': 'Name, email, and message are required.'}, status=400)

    ContactMessage.objects.create(name=name, email=email, subject=subject, message=message)

    try:
        send_mail(
            f'New Contact: {subject}',
            f'From: {name} <{email}>\n\n{message}',
            None, ['speudom@gmail.com'], fail_silently=True,
        )
    except Exception:
        pass
    return Response({'message': 'Message sent successfully!'}, status=201)

def join(request):
    return JsonResponse({"page": "join"})


# ── Annual Report ─────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def annual_report_list(request):
    reports = AnnualReport.objects.order_by('-year').values('id', 'year', 'created_at', 'updated_at')
    return Response(list(reports))


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def annual_report_detail(request, year):
    if not is_valid_academic_year_format(year):
        return Response({'error': 'Year must be in format YYYY/YYYY and consecutive, e.g. 2025/2026.'}, status=400)
    if not is_allowed_academic_year(year):
        return Response({'error': 'Year must be between 2024/2025 and 2026/2027 unless a newer year has been advanced.'}, status=400)

    if request.method == 'DELETE':
        if request.user.role != 'general_secretary':
            return Response({'error': 'Only the General Secretary can delete annual reports.'}, status=403)
        try:
            r = AnnualReport.objects.get(year=year)
            r.delete()
            return Response(status=204)
        except AnnualReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=404)
    if request.method == 'GET':
        try:
            r = AnnualReport.objects.get(year=year)
        except AnnualReport.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        financial = list(r.financial_items.values(
            'id', 'item_source', 'expenditure', 'total_expenditure', 'outstanding_balance', 'balance'
        ))
        def img_list(qs):
            return [{'id': i.id, 'url': request.build_absolute_uri(i.image.url), 'caption': i.caption} for i in qs]
        return Response({
            'id': r.id, 'year': r.year,
            'president_message': r.president_message,
            'president_image': request.build_absolute_uri(r.president_image.url) if r.president_image else None,
            'membership_statistics': r.membership_statistics,
            'membership_chart': request.build_absolute_uri(r.membership_chart.url) if r.membership_chart else None,
            'technical_dissemination': r.technical_dissemination,
            'technical_images': img_list(r.technical_images.all()),
            'community_engagement': r.community_engagement,
            'community_images': img_list(r.community_images.all()),
            'member_recognition': r.member_recognition,
            'recognition_images': img_list(r.recognition_images.all()),
            'challenges': r.challenges,
            'recommendations': r.recommendations,
            'financial_items': financial,
            'updated_at': r.updated_at,
        })

    # POST — create or update report fields
    if request.user.role != 'general_secretary':
        return Response({'error': 'Only the General Secretary can update annual reports.'}, status=403)

    r, _ = AnnualReport.objects.get_or_create(year=year, defaults={'created_by': request.user})
    fields = [
        'president_message', 'membership_statistics',
        'technical_dissemination', 'community_engagement',
        'member_recognition', 'challenges', 'recommendations',
    ]
    for f in fields:
        if f in request.data:
            setattr(r, f, sanitize_input(request.data[f]))
    if 'president_image' in request.FILES:
        invalid_image_response = validate_uploaded_image(request.FILES['president_image'], 'president_image')
        if invalid_image_response:
            return invalid_image_response
        r.president_image = request.FILES['president_image']
    if 'membership_chart' in request.FILES:
        invalid_image_response = validate_uploaded_image(request.FILES['membership_chart'], 'membership_chart')
        if invalid_image_response:
            return invalid_image_response
        r.membership_chart = request.FILES['membership_chart']
    r.save()
    return Response({'id': r.id, 'year': r.year, 'updated_at': r.updated_at})


@api_view(['POST'])
@permission_classes([IsGeneralSecretary])
@parser_classes([MultiPartParser, FormParser])
def annual_report_upload_image(request, year, section):
    """Upload an image to technical_images / community_images / recognition_images."""
    if not is_valid_academic_year_format(year):
        return Response({'error': 'Year must be in format YYYY/YYYY and consecutive, e.g. 2025/2026.'}, status=400)
    if not is_allowed_academic_year(year):
        return Response({'error': 'Year must be between 2024/2025 and 2026/2027 unless a newer year has been advanced.'}, status=400)
    VALID = ('technical', 'community', 'recognition')
    if section not in VALID:
        return Response({'error': 'Invalid section'}, status=400)
    try:
        r = AnnualReport.objects.get(year=year)
    except AnnualReport.DoesNotExist:
        return Response({'error': 'Report not found. Save the report first.'}, status=404)
    img_file = request.FILES.get('image')
    if not img_file:
        return Response({'error': 'image file required'}, status=400)
    invalid_image_response = validate_uploaded_image(img_file, 'image')
    if invalid_image_response:
        return invalid_image_response
    img = AnnualReportImage.objects.create(
        image=img_file,
        caption=sanitize_input(request.data.get('caption', ''), max_length=200)
    )
    getattr(r, f'{section}_images').add(img)
    return Response({'id': img.id, 'url': request.build_absolute_uri(img.image.url), 'caption': img.caption}, status=201)


@api_view(['DELETE'])
@permission_classes([IsGeneralSecretary])
def annual_report_delete_image(request, pk):
    try:
        img = AnnualReportImage.objects.get(pk=pk)
    except AnnualReportImage.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    img.delete()
    return Response(status=204)


@api_view(['POST', 'PUT', 'DELETE'])
@permission_classes([IsGeneralSecretary])
def annual_report_financial(request, year):
    """POST = add row, PUT = update row (pass id), DELETE = remove row (pass id)."""
    if not is_valid_academic_year_format(year):
        return Response({'error': 'Year must be in format YYYY/YYYY and consecutive, e.g. 2025/2026.'}, status=400)
    if not is_allowed_academic_year(year):
        return Response({'error': 'Year must be between 2024/2025 and 2026/2027 unless a newer year has been advanced.'}, status=400)
    try:
        r = AnnualReport.objects.get(year=year)
    except AnnualReport.DoesNotExist:
        return Response({'error': 'Report not found. Save the report first.'}, status=404)

    if request.method == 'DELETE':
        FinancialItem.objects.filter(pk=request.data.get('id'), report=r).delete()
        return Response(status=204)

    fields = ['item_source', 'expenditure', 'total_expenditure', 'outstanding_balance', 'balance']
    if request.method == 'PUT':
        try:
            item = FinancialItem.objects.get(pk=request.data.get('id'), report=r)
        except FinancialItem.DoesNotExist:
            return Response({'error': 'Row not found'}, status=404)
        for f in fields:
            if f in request.data:
                setattr(item, f, request.data[f])
        item.save()
    else:
        item = FinancialItem.objects.create(report=r, **{f: request.data.get(f, 0 if f != 'item_source' else '') for f in fields})

    return Response({
        'id': item.id, 'item_source': item.item_source,
        'expenditure': str(item.expenditure), 'total_expenditure': str(item.total_expenditure),
        'outstanding_balance': str(item.outstanding_balance), 'balance': str(item.balance),
    })

@api_view(['GET'])
@permission_classes([])
@throttle_classes([PublicReadThrottle])
def public_events(request):
    qs = Event.objects.filter(status='approved').order_by('-date')
    search = sanitize_input(request.GET.get('search', ''), max_length=200)
    date_after = request.GET.get('date_after')
    date_before = request.GET.get('date_before')

    if search:
        qs = qs.filter(title__icontains=search) | qs.filter(location__icontains=search)
    if date_after:
        qs = qs.filter(date__gte=date_after)
    if date_before:
        qs = qs.filter(date__lt=date_before)

    page, page_size = validate_pagination(request.GET.get('page', 1), request.GET.get('page_size', 10))
    start = (page - 1) * page_size
    total = qs.count()
    events_page = qs[start:start + page_size]

    data = [{
        'id': e.id,
        'title': e.title,
        'description': e.description,
        'location': e.location,
        'date': e.date.isoformat(),
        'status': e.status,
        'cancel_reason': e.cancel_reason or '',
        'registration_count': e.registrations.count(),
    } for e in events_page]

    return Response({
        'results': data,
        'count': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size,
    })


@api_view(['GET'])
@permission_classes([])
@throttle_classes([PublicReadThrottle])
def public_event_photos(request, pk):
    """Public endpoint to view photos of an approved event"""
    try:
        event = Event.objects.get(pk=pk, status='approved')
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)
    
    photos = event.photos.all()
    data = [{
        'id': p.id,
        'photo': request.build_absolute_uri(p.photo.url) if p.photo else None,
        'caption': p.caption,
        'uploaded_by': p.uploaded_by.full_name if p.uploaded_by else None,
        'uploaded_at': p.uploaded_at.isoformat()
    } for p in photos]
    return Response(data)
