# Architecture Migration Guide

## Phase 1: Backend Refactoring (Current Week)

### Step 1: Create New Directory Structure

```bash
# In backend/core, create:
mkdir -p api/views api/serializers
mkdir -p domain/models
mkdir -p services
mkdir -p repositories
mkdir -p infrastructure
```

### Step 2: Create Base Classes

These will be reused across all modules.

**File: `core/services/base_service.py`**
```python
class BaseService:
    """Base service class with common functionality"""
    
    def __init__(self, repository=None):
        self.repository = repository
    
    def handle_error(self, error, context=""):
        """Centralized error handling"""
        log_security_event('SERVICE_ERROR', details=f"{context}: {str(error)}")
        raise ServiceError(str(error))
```

**File: `core/repositories/base_repository.py`**
```python
class BaseRepository:
    """Base repository with common query methods"""
    
    model = None
    
    def get_by_id(self, id):
        return self.model.objects.get(id=id)
    
    def get_all(self):
        return self.model.objects.all()
    
    def create(self, **kwargs):
        return self.model.objects.create(**kwargs)
    
    def update(self, id, **kwargs):
        obj = self.get_by_id(id)
        for key, value in kwargs.items():
            setattr(obj, key, value)
        obj.save()
        return obj
    
    def delete(self, id):
        self.model.objects.filter(id=id).delete()
```

### Step 3: Refactor Core Module (Start Here)

#### Refactor Auth

**File: `core/api/views/auth.py`** (NEW)
```python
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from core.api.serializers.auth import LoginSerializer, RegisterSerializer
from core.services.auth_service import AuthService

auth_service = AuthService()

@api_view(['POST'])
@throttle_classes([StrictAnonThrottle])
def login(request):
    """Authenticate user"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        result = auth_service.authenticate(
            serializer.validated_data['email'],
            serializer.validated_data['password']
        )
        return Response(result)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@throttle_classes([StrictAnonThrottle])  
def register(request):
    """Register new user"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = auth_service.register(serializer.validated_data)
        return Response({
            'message': 'Registration successful',
            'user': {'id': user.id, 'email': user.email}
        }, status=201)
    return Response(serializer.errors, status=400)
```

**File: `core/services/auth_service.py`** (NEW)
```python
from core.repositories.user_repository import UserRepository
from rest_framework_simplejwt.tokens import RefreshToken
from core.infrastructure.security import validate_password

class AuthService:
    def __init__(self, user_repo=None):
        self.user_repo = user_repo or UserRepository()
    
    def authenticate(self, email, password):
        """Authenticate user with credentials"""
        user = self.user_repo.find_by_email(email)
        if not user or not user.check_password(password):
            raise AuthenticationError("Invalid credentials")
        
        tokens = self._get_tokens(user)
        log_security_event('USER_LOGIN', user=user)
        
        return {
            'message': 'Login successful',
            'tokens': tokens,
            'user': {'id': user.id, 'email': user.email}
        }
    
    def register(self, data):
        """Register new user"""
        validate_password(data['password'])
        
        user = self.user_repo.create(
            email=data['email'],
            full_name=data.get('full_name', ''),
            password=data['password']
        )
        
        log_security_event('USER_REGISTERED', user=user)
        return user
    
    @staticmethod
    def _get_tokens(user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
```

**File: `core/repositories/user_repository.py`** (NEW)
```python
from core.repositories.base_repository import BaseRepository
from core.domain.models import Student

class UserRepository(BaseRepository):
    model = Student
    
    def find_by_email(self, email):
        try:
            return Student.objects.get(email=email)
        except Student.DoesNotExist:
            return None
    
    def find_by_id(self, id):
        try:
            return Student.objects.get(id=id)
        except Student.DoesNotExist:
            return None
    
    def create(self, **kwargs):
        user = Student(**kwargs)
        user.set_password(kwargs.get('password', ''))
        user.save()
        return user
```

**File: `core/api/urls.py`** (Update imports)
```python
from django.urls import path
from core.api.views import auth  # Import from api/views

urlpatterns = [
    # Auth
    path('auth/login/', auth.login),
    path('auth/register/', auth.register),
    # ... more routes
]
```

### Step 4: Move Existing Code

1. **Move serializers:**
   - `core/serializers.py` → `core/api/serializers/`
   - Split by domain (auth.py, user.py, etc.)

2. **Move models:**
   - `core/models.py` → `core/domain/models/`
   - Keep one file per model if large

3. **Extract services:**
   - Identify business logic in `core/views.py`
   - Extract to `core/services/`

### Step 5: Update Imports

Replace all imports in `core/urls.py`:
```python
# OLD
from core import views
path('auth/login/', views.login)

# NEW
from core.api.views import auth
path('auth/login/', auth.login)
```

### Step 6: Repeat for Chat Module

Create same structure:
```bash
mkdir -p chat/api/views chat/api/serializers
mkdir -p chat/domain/models
mkdir -p chat/services
mkdir -p chat/repositories
mkdir -p chat/infrastructure
```

---

## Phase 2: Frontend Refactoring (Next Week)

### Step 1: Create Module Structure

```bash
cd frontend/src
mkdir -p modules/auth modules/elections modules/chat modules/events
mkdir -p hooks shared
```

### Step 2: Create Base Hooks

**File: `hooks/useApi.js`** (NEW)
```javascript
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await api(endpoint, options);
        if (isMounted) {
          if (response.ok) {
            setData(response.data);
          } else {
            setError(response.data);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    })();

    return () => { isMounted = false; };
  }, [endpoint]);

  return { data, loading, error };
}
```

### Step 3: Organize Auth Module

**File: `modules/auth/context/AuthContext.js`**
- Move from `context/AuthContext.js`
- Make it auth-specific

**File: `modules/auth/hooks/useAuth.js`** (NEW)
```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**File: `modules/auth/services/authService.js`** (NEW)
```javascript
import { api } from '../../../services/api';

export const authService = {
  login: (email, password) =>
    api('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (data) =>
    api('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  profile: () => api('/auth/profile/'),

  logout: () => {
    localStorage.removeItem('spe_access');
    localStorage.removeItem('spe_refresh');
  }
};
```

### Step 4: Update Component Imports

Before:
```javascript
import { useAuth } from '../context/AuthContext';
```

After:
```javascript
import { useAuth } from '../modules/auth/hooks/useAuth';
```

### Step 5: Organize Shared Components

```
components/
├── Layout/
│   ├── Header.js
│   ├── Sidebar.js
│   └── Layout.js
├── Forms/
│   ├── FormInput.js
│   ├── FormError.js
│   └── FormButton.js
├── UI/
│   ├── Button.js
│   ├── Card.js
│   ├── Modal.js
│   └── Spinner.js
└── Common/
    ├── PageHeader.js
    ├── Toast.js
    └── Badge.js
```

---

## Migration Checklist

### Backend
- [ ] Create directory structure
- [ ] Create base classes (service, repository)
- [ ] Refactor auth module
- [ ] Refactor user module
- [ ] Refactor chat module
- [ ] Update all imports
- [ ] Test all endpoints
- [ ] Update documentation

### Frontend
- [ ] Create module structure
- [ ] Create base hooks
- [ ] Migrate auth module
- [ ] Migrate elections module
- [ ] Migrate chat module
- [ ] Update component imports
- [ ] Test all features
- [ ] Update documentation

---

## Testing Strategy

### Backend Unit Tests

```python
# tests/unit/services/test_auth_service.py
from django.test import TestCase
from core.services.auth_service import AuthService
from core.repositories.user_repository import UserRepository

class TestAuthService(TestCase):
    def setUp(self):
        self.repo = UserRepository()
        self.service = AuthService(self.repo)
    
    def test_authenticate_success(self):
        user = self.repo.create(
            email='test@example.com',
            password='testpass123'
        )
        result = self.service.authenticate('test@example.com', 'testpass123')
        self.assertIn('tokens', result)
    
    def test_authenticate_invalid_password(self):
        self.repo.create(email='test@example.com', password='testpass123')
        with self.assertRaises(AuthenticationError):
            self.service.authenticate('test@example.com', 'wrongpassword')
```

### Frontend Integration Tests

```javascript
// tests/integration/auth.test.js
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../modules/auth/components/LoginForm';

test('Login with valid credentials', async () => {
  const { getByLabelText, getByRole } = render(<Login />);
  
  fireEvent.change(getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(getByLabelText(/password/i), {
    target: { value: 'password123' }
  });
  fireEvent.click(getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(localStorage.getItem('spe_access')).toBeTruthy();
  });
});
```

---

## Rollout Timeline

**Week 1:** Backend - Core module refactoring  
**Week 2:** Backend - Chat & Elections modules  
**Week 3:** Frontend - Auth & Core modules  
**Week 4:** Frontend - Feature modules  
**Week 5:** Testing & Documentation  

