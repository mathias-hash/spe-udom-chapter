"""
Base Repository Class

Provides common database operations using Django ORM.
"""

from django.core.exceptions import ObjectDoesNotExist


class BaseRepository:
    """
    Base repository class with common CRUD operations.
    
    All repository classes should inherit from this.
    
    Example:
        class UserRepository(BaseRepository):
            model = Student
            
            def find_by_email(self, email):
                return self.model.objects.filter(email=email).first()
    """
    
    model = None  # Subclasses must define this
    
    def get_by_id(self, entity_id):
        """
        Get entity by primary key.
        
        Args:
            entity_id: Primary key value
            
        Returns:
            Entity or None
        """
        try:
            return self.model.objects.get(pk=entity_id)
        except ObjectDoesNotExist:
            return None
    
    def get_all(self):
        """
        Get all entities.
        
        Returns:
            QuerySet of all entities
        """
        return self.model.objects.all()
    
    def filter(self, **kwargs):
        """
        Filter entities by attributes.
        
        Args:
            **kwargs: Filter conditions
            
        Returns:
            QuerySet of filtered entities
        """
        return self.model.objects.filter(**kwargs)
    
    def first(self, **kwargs):
        """
        Get first entity matching filter.
        
        Args:
            **kwargs: Filter conditions
            
        Returns:
            First matching entity or None
        """
        return self.model.objects.filter(**kwargs).first()
    
    def exists(self, **kwargs):
        """
        Check if entity exists.
        
        Args:
            **kwargs: Filter conditions
            
        Returns:
            True if entity exists, False otherwise
        """
        return self.model.objects.filter(**kwargs).exists()
    
    def count(self, **kwargs):
        """
        Count entities matching filter.
        
        Args:
            **kwargs: Filter conditions
            
        Returns:
            Count of matching entities
        """
        return self.model.objects.filter(**kwargs).count()
    
    def create(self, **kwargs):
        """
        Create new entity instance.
        
        Args:
            **kwargs: Entity attributes
            
        Returns:
            Created entity instance
        """
        return self.model.objects.create(**kwargs)
    
    def update(self, entity_id, **kwargs):
        """
        Update entity by ID.
        
        Args:
            entity_id: Primary key of entity to update
            **kwargs: Attributes to update
            
        Returns:
            Updated entity or None
        """
        try:
            obj = self.model.objects.get(pk=entity_id)
            for key, value in kwargs.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)
            obj.save()
            return obj
        except ObjectDoesNotExist:
            return None
    
    def delete(self, entity_id):
        """
        Delete entity by ID.
        
        Args:
            entity_id: Primary key of entity to delete
            
        Returns:
            True if deleted, False if not found
        """
        try:
            self.model.objects.get(pk=entity_id).delete()
            return True
        except ObjectDoesNotExist:
            return False
    
    def bulk_create(self, objects):
        """
        Bulk create entities.
        
        Args:
            objects: List of model instances
            
        Returns:
            List of created instances
        """
        return self.model.objects.bulk_create(objects)
    
    def bulk_update(self, objects, fields):
        """
        Bulk update entities.
        
        Args:
            objects: List of model instances to update
            fields: List of fields to update
            
        Returns:
            Number of rows updated
        """
        return self.model.objects.bulk_update(objects, fields)
    
    def paginate(self, page=1, page_size=10, **filters):
        """
        Get paginated results.
        
        Args:
            page: Page number (1-based)
            page_size: Number of items per page
            **filters: Filter conditions
            
        Returns:
            Dictionary with paginated data
        """
        queryset = self.model.objects.filter(**filters)
        total = queryset.count()
        
        start = (page - 1) * page_size
        end = start + page_size
        
        items = queryset[start:end]
        total_pages = (total + page_size - 1) // page_size
        
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        }
