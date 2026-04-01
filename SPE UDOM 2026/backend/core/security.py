"""Security utilities for API views"""
import logging
from functools import wraps
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('django.security')


class CustomUserThrottle(UserRateThrottle):
    scope = 'user_throttle'
    THROTTLE_RATES = {'user_throttle': '1000/hour'}


class CustomAnonThrottle(AnonRateThrottle):
    scope = 'anon_throttle'
    THROTTLE_RATES = {'anon_throttle': '100/hour'}


def log_security_event(event_type, user=None, details=None):
    """Log security events"""
    msg = f'Security Event: {event_type}'
    if user:
        msg += f' | User: {user.email}'
    if details:
        msg += f' | Details: {details}'
    logger.warning(msg)


def auth_required(view_func):
    """Decorator to require authentication"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            log_security_event('UNAUTHORIZED_ACCESS_ATTEMPT', details=f'Path: {request.path}')
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        return view_func(request, *args, **kwargs)
    return wrapper


def role_required(roles):
    """Decorator to require specific roles"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            if request.user.role not in roles:
                log_security_event('UNAUTHORIZED_ROLE_ACCESS', user=request.user, details=f'Roles: {roles}')
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def validate_request_data(required_fields):
    """Validate request data has required fields"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            data = request.data if hasattr(request, 'data') else request.POST
            missing = [f for f in required_fields if f not in data]
            if missing:
                return Response({'error': f'Missing required fields: {", ".join(missing)}'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def sanitize_input(value, max_length=None):
    """Sanitize user input"""
    if not isinstance(value, str):
        return value
    # Remove leading/trailing whitespace
    value = value.strip()
    # Truncate if max_length specified
    if max_length and len(value) > max_length:
        value = value[:max_length]
    return value


def validate_pagination(page, page_size):
    """Validate and sanitize pagination parameters"""
    try:
        page = max(1, int(page))
        page_size = max(1, min(100, int(page_size)))  # Max 100 items per page
    except (ValueError, TypeError):
        page, page_size = 1, 10
    return page, page_size
