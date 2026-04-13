"""
Exceptions used throughout the application.
"""


class ServiceError(Exception):
    """Raised when a service operation fails."""
    pass


class AuthenticationError(ServiceError):
    """Raised when authentication fails."""
    pass


class AuthorizationError(ServiceError):
    """Raised when user lacks required permissions."""
    pass


class ValidationError(ServiceError):
    """Raised when validation fails."""
    pass


class NotFoundError(ServiceError):
    """Raised when entity is not found."""
    pass


class DuplicateError(ServiceError):
    """Raised when trying to create duplicate."""
    pass
