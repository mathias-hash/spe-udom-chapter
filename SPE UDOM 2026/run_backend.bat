@echo off
REM Start Django backend with ASGI server (required for WebSocket chat)
REM This script ensures the chat WebSocket connection works properly

cd /d "%~dp0backend"

echo.
echo ========================================
echo SPE UDOM Backend - ASGI Server Startup
echo ========================================
echo.

REM Check if Daphne is installed
pip show daphne >nul 2>&1
if errorlevel 1 (
    echo Installing Daphne (ASGI server)...
    pip install daphne
    echo.
)

echo Starting backend on http://localhost:8000
echo WebSocket available at ws://localhost:8000/ws/chat/
echo.
echo Press Ctrl+C to stop
echo.

REM Run with Daphne ASGI server
daphne -b 0.0.0.0 -p 8000 backend.asgi:application

pause
