"""
Repositories

Data access layer. Repositories abstract database operations and provide
clean queries for services.

All repositories should inherit from BaseRepository.
"""

from .base_repository import BaseRepository

__all__ = ['BaseRepository']
