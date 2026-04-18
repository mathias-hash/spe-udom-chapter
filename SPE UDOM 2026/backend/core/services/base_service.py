"""
Base Service Class

Provides common functionality for all service classes.
"""

from django.core.exceptions import ValidationError
from django.db import transaction
from core.exceptions import ServiceError
from core.security import log_security_event


class BaseService:
    """
    Base service class with common functionality.
    
    All service classes should inherit from this.
    
    Example:
        class UserService(BaseService):
            def __init__(self, repository=None):
                super().__init__(repository or UserRepository())
            
            def create_user(self, data):
                return self.create(data)
    """
    
    def __init__(self, repository=None):
        """
        Initialize service with a repository.
        
        Args:
            repository: Data access object (dependency injection)
        """
        self.repository = repository
    
    @transaction.atomic
    def create(self, data):
        """
        Create a new entity with transaction support.
        
        Args:
            data: Dictionary of entity attributes
            
        Returns:
            Created entity
            
        Raises:
            ValidationError: If data is invalid
            ServiceError: If creation fails
        """
        try:
            entity = self.repository.create(**data)
            log_security_event('ENTITY_CREATED', details=f"{self.__class__.__name__}")
            return entity
        except ValidationError as e:
            raise ServiceError(f"Validation failed: {str(e)}")
        except Exception as e:
            self._handle_error(e, f"Failed to create {self.__class__.__name__}")
    
    @transaction.atomic
    def update(self, entity_id, data):
        """
        Update an entity with transaction support.
        
        Args:
            entity_id: ID of entity to update
            data: Dictionary of attributes to update
            
        Returns:
            Updated entity
        """
        try:
            entity = self.repository.update(entity_id, **data)
            log_security_event('ENTITY_UPDATED', details=f"{self.__class__.__name__}")
            return entity
        except Exception as e:
            self._handle_error(e, f"Failed to update {self.__class__.__name__}")
    
    def delete(self, entity_id):
        """
        Delete an entity.
        
        Args:
            entity_id: ID of entity to delete
        """
        try:
            self.repository.delete(entity_id)
            log_security_event('ENTITY_DELETED', details=f"{self.__class__.__name__}")
        except Exception as e:
            self._handle_error(e, f"Failed to delete {self.__class__.__name__}")
    
    def get_by_id(self, entity_id):
        """
        Get entity by ID.
        
        Args:
            entity_id: ID of entity
            
        Returns:
            Entity or None
        """
        return self.repository.get_by_id(entity_id)
    
    def get_all(self):
        """
        Get all entities.
        
        Returns:
            QuerySet of all entities
        """
        return self.repository.get_all()
    
    def _handle_error(self, error, context=""):
        """
        Centralized error handling.
        
        Args:
            error: Exception that occurred
            context: Context about what operation failed
            
        Raises:
            ServiceError: Always raises with context
        """
        log_security_event('SERVICE_ERROR', details=f"{context}: {str(error)}")
        raise ServiceError(f"{context}: {str(error)}")
    
    def _validate_data(self, data, required_fields):
        """
        Validate that required fields are present.
        
        Args:
            data: Dictionary to validate
            required_fields: List of required field names
            
        Raises:
            ValidationError: If required fields are missing
        """
        missing = [field for field in required_fields if field not in data]
        if missing:
            raise ValidationError(f"Missing required fields: {missing}")
