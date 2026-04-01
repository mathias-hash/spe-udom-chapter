"""
Data Encryption Module for Sensitive Fields
================================================
Provides encryption/decryption utilities for sensitive data storage.
Uses Fernet from cryptography library for AES encryption.
"""

from cryptography.fernet import Fernet
from django.conf import settings
from django.db import models
import logging

logger = logging.getLogger('django.security')


class EncryptedField(models.Field):
    """Custom Django field that encrypts data before storing in database"""
    
    description = "An encrypted CharField"
    
    def __init__(self, *args, **kwargs):
        self.cipher_suite = Fernet(settings.ENCRYPTION_KEY.encode())
        super().__init__(*args, **kwargs)
    
    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        del kwargs["cipher_suite"]
        return name, path, args, kwargs
    
    def get_db_prep_save(self, value, connection):
        """Encrypt data before saving to database"""
        if value is None:
            return value
        
        if isinstance(value, str):
            value = value.encode('utf-8')
        
        try:
            encrypted = self.cipher_suite.encrypt(value).decode('utf-8')
            return encrypted
        except Exception as e:
            logger.error(f'Encryption error: {str(e)}')
            raise ValueError('Failed to encrypt field data')
    
    def from_db_value(self, value, expression, connection):
        """Decrypt data retrieved from database"""
        if value is None:
            return value
        
        try:
            if isinstance(value, str):
                value = value.encode('utf-8')
            decrypted = self.cipher_suite.decrypt(value).decode('utf-8')
            return decrypted
        except Exception as e:
            logger.error(f'Decryption error: {str(e)}')
            raise ValueError('Failed to decrypt field data')
    
    def to_python(self, value):
        """Convert to Python value"""
        if value is None:
            return value
        if isinstance(value, str):
            return value
        return value


class DataEncryption:
    """Helper class for manual encryption/decryption operations"""
    
    def __init__(self):
        self.cipher_suite = Fernet(settings.ENCRYPTION_KEY.encode())
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string"""
        try:
            if isinstance(plaintext, str):
                plaintext = plaintext.encode('utf-8')
            encrypted = self.cipher_suite.encrypt(plaintext)
            return encrypted.decode('utf-8')
        except Exception as e:
            logger.error(f'Encryption error: {str(e)}')
            raise
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a string"""
        try:
            if isinstance(ciphertext, str):
                ciphertext = ciphertext.encode('utf-8')
            decrypted = self.cipher_suite.decrypt(ciphertext)
            return decrypted.decode('utf-8')
        except Exception as e:
            logger.error(f'Decryption error: {str(e)}')
            raise
    
    def hash_sensitive_data(self, data: str) -> str:
        """Hash sensitive data for comparison without storing plaintext"""
        from hashlib import sha256
        return sha256(data.encode()).hexdigest()


# Singleton instance for easy import
encryption_service = DataEncryption()
