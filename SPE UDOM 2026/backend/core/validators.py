"""File upload validators and security utilities"""
import os
from django.core.exceptions import ValidationError
from django.conf import settings


def validate_file_size(file, max_size=None):
    """Validate file size"""
    if max_size is None:
        max_size = settings.MAX_UPLOAD_SIZE
    
    if file.size > max_size:
        raise ValidationError(f'File size exceeds {max_size / 1024 / 1024:.1f}MB limit')


def validate_file_extension(file, allowed_extensions=None):
    """Validate file extension"""
    if allowed_extensions is None:
        allowed_extensions = settings.ALLOWED_UPLOAD_EXTENSIONS
    
    ext = os.path.splitext(file.name)[1].lstrip('.').lower()
    if ext not in allowed_extensions:
        raise ValidationError(f'File type .{ext} is not allowed. Allowed types: {", ".join(allowed_extensions)}')


def validate_image_file(file):
    """Validate image files"""
    validate_file_size(file)
    validate_file_extension(file, settings.ALLOWED_IMAGE_EXTENSIONS)


def validate_document_file(file):
    """Validate document files"""
    validate_file_size(file)
    validate_file_extension(file, settings.ALLOWED_DOCUMENT_EXTENSIONS)


def sanitize_filename(filename):
    """Remove potentially dangerous characters from filename"""
    # Keep only alphanumeric, dots, hyphens, and underscores
    import re
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Remove leading/trailing spaces
    filename = filename.strip()
    return filename or 'uploaded_file'


class FileUploadValidator:
    """Comprehensive file upload validation"""
    
    def __init__(self, max_size=None, allowed_extensions=None):
        self.max_size = max_size or settings.MAX_UPLOAD_SIZE
        self.allowed_extensions = allowed_extensions or settings.ALLOWED_UPLOAD_EXTENSIONS
    
    def validate(self, file):
        """Validate file"""
        validate_file_size(file, self.max_size)
        validate_file_extension(file, self.allowed_extensions)
        return True
