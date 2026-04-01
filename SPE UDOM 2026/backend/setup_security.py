#!/usr/bin/env python
"""
Security Setup Script
=====================
Generates encryption keys and helps configure security settings.
Run this script with: python setup_security.py
"""

import os
import secrets
import string
from pathlib import Path
from cryptography.fernet import Fernet
import sys

def generate_django_secret_key(length=50):
    """Generate a secure Django SECRET_KEY"""
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_fernet_key():
    """Generate a Fernet encryption key"""
    return Fernet.generate_key().decode()

def generate_api_secret(length=32):
    """Generate API secret key"""
    return secrets.token_urlsafe(length)

def create_env_file():
    """Create .env file with security keys"""
    
    print("\n" + "="*60)
    print("SPE UDOM Security Setup Script")
    print("="*60 + "\n")
    
    env_path = Path('.env')
    
    if env_path.exists():
        response = input("⚠️  .env file already exists. Overwrite? (y/n): ").strip().lower()
        if response != 'y':
            print("✓ Setup cancelled. Keeping existing .env file.")
            return
    
    print("\n🔐 Generating security keys...\n")
    
    # Generate keys
    secret_key = generate_django_secret_key()
    encryption_key = generate_fernet_key()
    api_secret = generate_api_secret()
    
    # Environment variables to set
    env_content = f"""# ─── DJANGO CORE ───
DEBUG=False
SECRET_KEY={secret_key}

# ─── DATA ENCRYPTION ───
ENCRYPTION_KEY={encryption_key}

# ─── DATABASE ───
DATABASE_URL=sqlite:///db.sqlite3
# For Production PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/spe_udom

# ─── EMAIL CONFIGURATION ───
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
# For Gmail:
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-app-specific-password

# ─── ALLOWED HOSTS ───
ALLOWED_HOSTS=localhost,127.0.0.1
TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ─── HTTPS/SECURITY ───
ENFORCE_HTTPS=False

# ─── API SECURITY ───
API_SECRET_KEY={api_secret}
IP_WHITELIST=
ALLOW_ADMIN_IP_ONLY=False

# ─── REDIS (for WebSockets) ───
REDIS_URL=redis://127.0.0.1:6379/0

# ─── CORS ───
FRONTEND_URL=http://localhost:3000
"""
    
    # Write to file
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print("✓ Created .env file with security configuration")
    print("\n📋 Generated Keys:")
    print(f"  • SECRET_KEY: {secret_key[:20]}...")
    print(f"  • ENCRYPTION_KEY (Fernet): {encryption_key[:20]}...")
    print(f"  • API_SECRET_KEY: {api_secret[:20]}...")
    
    print("\n⚠️  IMPORTANT SECURITY NOTES:")
    print("  1. NEVER commit .env to version control")
    print("  2. Add '.env' to .gitignore")
    print("  3. For production, use environment variables instead of .env")
    print("  4. Keep backups of ENCRYPTION_KEY (cannot decrypt without it)")
    print("  5. Rotate keys periodically")
    
    print("\n" + "="*60)
    print("✓ Security setup complete!")
    print("="*60 + "\n")

def validate_env():
    """Validate .env file has all required security keys"""
    
    print("\n🔍 Validating .env configuration...\n")
    
    env_path = Path('.env')
    if not env_path.exists():
        print("❌ .env file not found")
        print("Run: python setup_security.py")
        return False
    
    with open(env_path) as f:
        env_content = f.read()
    
    required_keys = [
        'SECRET_KEY',
        'ENCRYPTION_KEY',
        'API_SECRET_KEY',
    ]
    
    all_present = True
    for key in required_keys:
        if f'{key}=' in env_content:
            print(f"✓ {key} configured")
        else:
            print(f"❌ {key} missing")
            all_present = False
    
    if all_present:
        print("\n✓ All required security keys configured!")
        return True
    else:
        print("\n❌ Some security keys are missing")
        print("Run: python setup_security.py")
        return False

def main():
    """Main entry point"""
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'create':
            create_env_file()
        elif command == 'validate':
            validate_env()
        elif command in ['help', '-h', '--help']:
            print("""
Security Setup Script

Usage:
  python setup_security.py create    - Create .env with security keys
  python setup_security.py validate  - Validate .env configuration
  python setup_security.py help      - Show this help message

Examples:
  # First time setup
  python setup_security.py create
  
  # Verify configuration
  python setup_security.py validate
            """)
        else:
            print(f"Unknown command: {command}")
            print("Run: python setup_security.py help")
    else:
        # Default: create
        create_env_file()

if __name__ == '__main__':
    main()
