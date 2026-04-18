@echo off
set DJANGO_SETTINGS_MODULE=backend.settings
echo Starting SPE UDOM backend with Daphne (ASGI - WebSocket support)...
python -m daphne -b 127.0.0.1 -p 8000 backend.asgi:application
