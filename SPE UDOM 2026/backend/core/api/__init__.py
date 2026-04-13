"""
Core Application - Layered Architecture

This package implements a clean, layered architecture for the SPE UDOM core functionality.

Layers:
  - api/        : HTTP request/response handling
  - services/   : Business logic
  - repositories/ : Data access layer
  - domain/     : Business entities (models)
  - infrastructure/ : Cross-cutting concerns
"""

default_app_config = 'core.apps.CoreConfig'
