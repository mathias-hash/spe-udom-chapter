#!/usr/bin/env python
"""
Quick diagnostic script to verify chat WebSocket setup
"""
import os
import sys
import json
import subprocess
from pathlib import Path

def check_env_file(path, required_vars):
    """Check if .env file exists and has required variables"""
    env_file = Path(path)
    if not env_file.exists():
        return False, f"Missing: {path}"
    
    env_content = env_file.read_text()
    missing = [var for var in required_vars if var not in env_content]
    
    if missing:
        return False, f"Missing variables in {path}: {', '.join(missing)}"
    return True, f"✓ {path} configured"

def check_package_installed(package_name):
    """Check if Python package is installed"""
    try:
        __import__(package_name)
        return True
    except ImportError:
        return False

def run_test():
    print("\n" + "="*60)
    print("SPE UDOM Chat - WebSocket Diagnostic Tool")
    print("="*60 + "\n")
    
    base_dir = Path(__file__).parent
    backend_dir = base_dir / "backend"
    frontend_dir = base_dir / "frontend"
    
    # Check Python packages
    print("📦 Checking Python packages...")
    required_packages = ['channels', 'channels_redis', 'django', 'daphne']
    for pkg in required_packages:
        if check_package_installed(pkg):
            print(f"  ✓ {pkg}")
        else:
            print(f"  ✗ {pkg} - INSTALL IT: pip install {pkg}")
    
    # Check environment files
    print("\n📝 Checking configuration files...")
    frontend_success, frontend_msg = check_env_file(frontend_dir / ".env", 
                                                     ["REACT_APP_API_BASE_URL", "REACT_APP_WS_BASE_URL"])
    backend_success, backend_msg = check_env_file(backend_dir / ".env", 
                                                   ["DEBUG", "SECRET_KEY"])
    print(f"  {frontend_msg}")
    print(f"  {backend_msg}")
    
    # Check ASGI configuration
    print("\n⚙️ Checking ASGI setup...")
    asgi_file = backend_dir / "backend" / "asgi.py"
    if asgi_file.exists():
        print(f"  ✓ ASGI configuration found")
    else:
        print(f"  ✗ ASGI file not found: {asgi_file}")
    
    # Check routing
    routing_file = backend_dir / "chat" / "routing.py"
    if routing_file.exists():
        print(f"  ✓ Chat routing found")
    else:
        print(f"  ✗ Routing file not found: {routing_file}")
    
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)
    print("\n1. Run the backend with ASGI server:")
    print("   cd backend")
    print("   daphne -b 0.0.0.0 -p 8000 backend.asgi:application")
    print("\n2. In another terminal, start the frontend:")
    print("   cd frontend")
    print("   npm start")
    print("\n3. Open http://localhost:3000 and test the chat")
    
    if frontend_success and backend_success:
        print("\n✓ Configuration looks good! Start the servers above.")
    else:
        print("\n✗ Please fix the issues above before starting.")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    run_test()
