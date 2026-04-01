"""
Role-Based Access Control (RBAC) and Permission Classes
========================================================
Comprehensive permission classes for API endpoint protection.
Enforces role-based access control across the application.
"""

from rest_framework import permissions
from rest_framework.permissions import BasePermission
import logging

logger = logging.getLogger('django.security')


class IsAdmin(BasePermission):
    """Only allow admin users"""
    message = 'You do not have permission to perform this action. Admin access required.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsPresident(BasePermission):
    """Only allow president role"""
    message = 'You do not have permission to perform this action. President access required.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'president')


class IsGeneralSecretary(BasePermission):
    """Only allow general secretary role"""
    message = 'You do not have permission to perform this action. Secretary access required.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'general_secretary')


class IsAdminOrPresident(BasePermission):
    """Allow admin or president"""
    message = 'You do not have permission to perform this action. Admin or President access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in ['admin', 'president']
        )


class IsAdminOrSecretary(BasePermission):
    """Allow admin or general secretary"""
    message = 'You do not have permission to perform this action. Admin or Secretary access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in ['admin', 'general_secretary']
        )


class IsLeadership(BasePermission):
    """Allow admin, president, or secretary"""
    message = 'You do not have permission to perform this action. Leadership access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in ['admin', 'president', 'general_secretary']
        )


class IsAuthenticated(BasePermission):
    """Only authenticated members"""
    message = 'Authentication credentials were not provided.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsOwnerOrAdmin(BasePermission):
    """Allow object owner or admin to edit"""
    message = 'You can only edit your own data or have admin privileges.'

    def has_object_permission(self, request, view, obj):
        # Admin can edit anything
        if request.user.role == 'admin':
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'student'):
            return obj.student == request.user
        elif hasattr(obj, 'sender'):
            return obj.sender == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class IsOwner(BasePermission):
    """Only allow object owner"""
    message = 'This object does not belong to you.'

    def has_object_permission(self, request, view, obj):
        # Check if user is the owner
        if hasattr(obj, 'student'):
            return obj.student == request.user
        elif hasattr(obj, 'sender'):
            return obj.sender == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'voter'):
            return obj.voter == request.user
        
        return False


class CanVote(BasePermission):
    """Check if user can vote"""
    message = 'You cannot vote in this election.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Voting restrictions can be added here (e.g., membership status, year of study)
        return request.user.is_active


class CanCreateEvent(BasePermission):
    """Check if user can create events"""
    message = 'You do not have permission to create events.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Only leadership can create events
        return request.user.role in ['admin', 'president', 'general_secretary']


class CanApproveEvent(BasePermission):
    """Check if user can approve events"""
    message = 'You do not have permission to approve events.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Only president and admin can approve
        return request.user.role in ['admin', 'president']


class CanSendAnnouncement(BasePermission):
    """Check if user can send announcements"""
    message = 'You do not have permission to send announcements.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Only leadership can send
        return request.user.role in ['admin', 'president']


class CanManageElections(BasePermission):
    """Check if user can manage elections"""
    message = 'You do not have permission to manage elections.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Only secretary and admin can manage
        return request.user.role in ['admin', 'general_secretary']


class CanViewAnalytics(BasePermission):
    """Check if user can view analytics"""
    message = 'You do not have permission to view analytics.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Only leadership can view
        return request.user.role in ['admin', 'president', 'general_secretary']


class ReadOnlyOrIsAdmin(permissions.BasePermission):
    """Allow read for all authenticated, write for admin only"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class RateLimitPermission(BasePermission):
    """Custom permission for rate limiting by role"""
    
    def has_permission(self, request, view):
        # Get rate limit from settings based on user role
        from django.conf import settings
        
        if not request.user or not request.user.is_authenticated:
            return True  # Rate limiting for anonymous is handled in throttles
        
        # Check if user is suspended
        if hasattr(request.user, 'message_quota') and request.user.message_quota.is_suspended:
            logger.warning(f'User {request.user.email} attempted action while suspended')
            return False
        
        return True
