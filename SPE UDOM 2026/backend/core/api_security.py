"""
API Security Module
===================
Provides security utilities for API endpoints including:
- Request validation
- Response sanitization
- Security headers
- Audit logging
- Threat detection
"""

from rest_framework import status
from rest_framework.response import Response
from django.utils.decorators import decorator_from_middleware
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import condition
from functools import wraps
import logging
import hashlib
import hmac
import json
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger('django.security')


class SecurityValidator:
    """Validate and sanitize API requests"""
    
    MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB
    BLOCKED_PATTERNS = ['<script', 'javascript:', 'onerror=', 'onclick=']
    
    @staticmethod
    def validate_request_size(request):
        """Check request size doesn't exceed limit"""
        if hasattr(request, 'body'):
            if len(request.body) > SecurityValidator.MAX_REQUEST_SIZE:
                logger.warning(f'Request size exceeded: {request.user}')
                return False, 'Request payload too large'
        return True, 'OK'
    
    @staticmethod
    def sanitize_input(data: str, field_type: str = 'text') -> str:
        """Sanitize user input"""
        if not isinstance(data, str):
            return str(data)
        
        # Remove dangerous patterns
        for pattern in SecurityValidator.BLOCKED_PATTERNS:
            if pattern.lower() in data.lower():
                logger.warning(f'Blocked dangerous pattern: {pattern}')
                data = data.replace(pattern, '')
        
        # Trim whitespace
        data = data.strip()
        
        return data
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone format"""
        import re
        pattern = r'^[\d\s\+\-\(\)]{10,20}$'
        return re.match(pattern, phone) is not None
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple:
        """
        Validate password strength
        Returns (is_valid, message, score)
        """
        import re
        
        if len(password) < 6:
            return False, 'Password must be at least 6 characters', 0
        
        score = 0
        feedback = []
        
        if re.search(r'[a-z]', password):
            score += 1
        else:
            feedback.append('Add lowercase letters')
        
        if re.search(r'[A-Z]', password):
            score += 1
        else:
            feedback.append('Add uppercase letters')
        
        if re.search(r'[0-9]', password):
            score += 1
        else:
            feedback.append('Add numbers')
        
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            score += 1
        else:
            feedback.append('Add special characters')
        
        is_valid = score >= 3
        message = ', '.join(feedback) if feedback else 'Strong password'
        
        return is_valid, message, score


class SecurityHeaders:
    """Security headers for API responses"""
    
    @staticmethod
    def get_headers():
        """Return secure response headers"""
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        }


class AuditLogger:
    """Log security events for audit trail"""
    
    @staticmethod
    def log_authentication(user, success: bool, ip_address: str, user_agent: str):
        """Log authentication attempts"""
        event = {
            'event': 'authentication',
            'user': user.email if user else 'anonymous',
            'success': success,
            'ip': ip_address,
            'user_agent': user_agent,
            'timestamp': datetime.now().isoformat()
        }
        logger.warning(json.dumps(event))
    
    @staticmethod
    def log_permission_denied(user, action: str, resource: str):
        """Log permission denied events"""
        event = {
            'event': 'permission_denied',
            'user': user.email if user else 'anonymous',
            'action': action,
            'resource': resource,
            'timestamp': datetime.now().isoformat()
        }
        logger.warning(json.dumps(event))
    
    @staticmethod
    def log_data_access(user, data_type: str, action: str):
        """Log sensitive data access"""
        event = {
            'event': 'data_access',
            'user': user.email if user else 'anonymous',
            'data_type': data_type,
            'action': action,
            'timestamp': datetime.now().isoformat()
        }
        logger.warning(json.dumps(event))
    
    @staticmethod
    def log_suspicious_activity(user, activity: str, details: str):
        """Log suspicious activities"""
        event = {
            'event': 'suspicious_activity',
            'user': user.email if user else 'anonymous',
            'activity': activity,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        logger.critical(json.dumps(event))


def require_https(view_func):
    """Decorator to require HTTPS"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not settings.DEBUG and not request.is_secure():
            logger.warning(f'HTTP request to secure endpoint: {request.path}')
            return Response(
                {'error': 'HTTPS required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


def rate_limit_by_ip(limit: int = 100, period: int = 3600):
    """Rate limit by IP address"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip = request.META.get('REMOTE_ADDR', 'unknown')
            cache_key = f'rate_limit:{ip}'
            
            count = cache.get(cache_key, 0)
            
            if count >= limit:
                logger.warning(f'Rate limit exceeded for IP: {ip}')
                return Response(
                    {'error': 'Rate limit exceeded'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            cache.set(cache_key, count + 1, period)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def validate_signature(request, secret_key: str = None):
    """Validate webhook/API signature"""
    if not secret_key:
        secret_key = settings.API_SECRET_KEY
    
    signature = request.headers.get('X-Signature')
    if not signature:
        return False, 'Missing signature'
    
    body = request.body
    expected_signature = hmac.new(
        secret_key.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        return False, 'Invalid signature'
    
    return True, 'Valid signature'


def check_ip_whitelist(view_func):
    """Restrict access to whitelisted IPs"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        ip = request.META.get('REMOTE_ADDR', 'unknown')
        whitelist = settings.IP_WHITELIST
        
        if whitelist and ip not in whitelist:
            logger.warning(f'Unauthorized IP access attempt: {ip}')
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(request, *args, **kwargs)
    return wrapper


def validate_content_type(allowed_types: list):
    """Validate request content type"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            content_type = request.META.get('CONTENT_TYPE', 'application/json')
            
            if not any(t in content_type for t in allowed_types):
                logger.warning(f'Invalid content type: {content_type}')
                return Response(
                    {'error': f'Invalid content type. Expected: {allowed_types}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


class ResponseSanitizer:
    """Sanitize API responses"""
    
    @staticmethod
    def sanitize_user_data(user_data: dict, requesting_user=None):
        """Remove sensitive fields from user data"""
        sensitive_fields = [
            'password',
            'encryption_key',
            'api_key',
            'secret',
            'token'
        ]
        
        sanitized = user_data.copy()
        
        for field in sensitive_fields:
            if field in sanitized:
                del sanitized[field]
        
        # If requesting user is not admin, hide certain fields
        if requesting_user and requesting_user.role != 'admin':
            sensitive_fields_user = ['is_staff', 'is_superuser']
            for field in sensitive_fields_user:
                if field in sanitized:
                    del sanitized[field]
        
        return sanitized
    
    @staticmethod
    def sanitize_response(data):
        """Sanitize response data"""
        if isinstance(data, dict):
            return {k: ResponseSanitizer.sanitize_response(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [ResponseSanitizer.sanitize_response(item) for item in data]
        elif isinstance(data, str):
            return SecurityValidator.sanitize_input(data)
        else:
            return data
