#!/usr/bin/env python
import os
import secrets
import sys

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

ADMIN_EMAIL = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'speudomadmin@gmail.com')
ADMIN_NAME = os.environ.get('DJANGO_SUPERUSER_NAME', 'SPE Administrator')
ADMIN_LOGIN_URL = os.environ.get('ADMIN_LOGIN_URL', 'http://localhost:8000/admin')

if User.objects.filter(email=ADMIN_EMAIL).exists():
    print(f'Superuser already exists: {ADMIN_EMAIL}')
    sys.exit(0)

password = os.environ.get('DJANGO_SUPERUSER_PASSWORD') or secrets.token_urlsafe(24)

user = User.objects.create_superuser(
    email=ADMIN_EMAIL,
    full_name=ADMIN_NAME,
    password=password,
)

print('Superuser created successfully.')
print(f'Email: {user.email}')
print(f'Name: {user.full_name}')
print(f'Role: {user.role}')
if 'DJANGO_SUPERUSER_PASSWORD' in os.environ:
    print('Password: loaded from DJANGO_SUPERUSER_PASSWORD')
else:
    print(f'Generated password: {password}')
print(f'\nLogin at: {ADMIN_LOGIN_URL}')
