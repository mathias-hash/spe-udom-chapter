# Architecture Quick Reference

## For Backend Developers

### Creating a New API Endpoint

**Step 1: Create Service (Business Logic)**

```python
# services/user_service.py
from core.services.base_service import BaseService
from core.repositories.user_repository import UserRepository

class UserService(BaseService):
    def __init__(self, repository=None):
        super().__init__(repository or UserRepository())
    
    def create_user(self, email, full_name, password):
        # Business logic here
        user = self.create({
            'email': email,
            'full_name': full_name,
            'password': password
        })
        return user
    
    def get_user(self, user_id):
        return self.get_by_id(user_id)
```

**Step 2: Create Repository (Data Access)**

```python
# repositories/user_repository.py
from core.repositories.base_repository import BaseRepository
from core.models import Student

class UserRepository(BaseRepository):
    model = Student
    
    def find_by_email(self, email):
        return self.first(email=email)
    
    def find_active_users(self):
        return self.filter(is_active=True)
```

**Step 3: Create Serializer (Request/Response)**

```python
# api/serializers/user.py
from rest_framework import serializers
from core.models import Student

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'email', 'full_name', 'role']
```

**Step 4: Create View (HTTP Handler)**

```python
# api/views/user.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.services.user_service import UserService
from core.api.serializers.user import UserSerializer

user_service = UserService()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = user_service.get_user(request.user.id)
    serializer = UserSerializer(user)
    return Response(serializer.data)

@api_view(['POST'])
def create_user(request):
    try:
        user = user_service.create_user(
            email=request.data['email'],
            full_name=request.data['full_name'],
            password=request.data['password']
        )
        serializer = UserSerializer(user)
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
```

**Step 5: Register URLs**

```python
# api/urls.py
from django.urls import path
from core.api.views import user

urlpatterns = [
    path('auth/profile/', user.profile),
    path('users/', user.create_user),
]
```

### Testing Pattern

```python
# tests/unit/services/test_user_service.py
from django.test import TestCase
from core.services.user_service import UserService
from core.repositories.user_repository import UserRepository

class TestUserService(TestCase):
    def setUp(self):
        self.repo = UserRepository()
        self.service = UserService(self.repo)
    
    def test_create_user(self):
        user = self.service.create_user(
            email='test@example.com',
            full_name='Test User',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
```

### Key Principles

✅ **Never** query database directly in views  
✅ **Always** use services for business logic  
✅ **Always** inject repositories into services  
✅ **Always** use base classes for consistency  
✅ **Always** handle errors at service level  

---

## For Frontend Developers

### Creating a New Module (Elections Example)

**Step 1: Create Service (API Communication)**

```javascript
// modules/elections/services/electionService.js
import { api } from '../../../services/api';

export const electionService = {
  list: () => api('/elections/'),
  
  get: (id) => api(`/elections/${id}/`),
  
  create: (data) => api('/elections/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  vote: (electionId, candidateId) => api(`/elections/${electionId}/vote/`, {
    method: 'POST',
    body: JSON.stringify({ candidate_id: candidateId })
  })
};
```

**Step 2: Create Hook (State Management)**

```javascript
// modules/elections/hooks/useElections.js
import { useState, useEffect } from 'react';
import { electionService } from '../services/electionService';

export function useElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await electionService.list();
        if (isMounted) {
          if (response.ok) {
            setElections(response.data);
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
  }, []);

  return { elections, loading, error };
}
```

**Step 3: Create Components**

```javascript
// modules/elections/components/ElectionList.js
import { useElections } from '../hooks/useElections';
import { ElectionCard } from './ElectionCard';
import { Spinner } from '../../../components/UI/Spinner';

export function ElectionList() {
  const { elections, loading, error } = useElections();

  if (loading) return <Spinner />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="elections-list">
      {elections.map(election => (
        <ElectionCard key={election.id} election={election} />
      ))}
    </div>
  );
}
```

**Step 4: Create Page**

```javascript
// modules/elections/pages/ElectionsPage.js
import { ElectionList } from '../components/ElectionList';
import PageHeader from '../../../components/Layout/PageHeader';

export function ElectionsPage() {
  return (
    <>
      <PageHeader title="Elections" />
      <ElectionList />
    </>
  );
}
```

**Step 5: Register Route**

```javascript
// App.js (or routes.js)
import { ElectionsPage } from './modules/elections/pages/ElectionsPage';

function App() {
  return (
    <Routes>
      <Route path="/elections" element={<ElectionsPage />} />
    </Routes>
  );
}
```

### Testing Pattern

```javascript
// tests/integration/elections.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElectionList } from '../modules/elections/components/ElectionList';

jest.mock('../modules/elections/services/electionService');

test('displays elections', async () => {
  render(<ElectionList />);
  
  await waitFor(() => {
    expect(screen.getByText('Election 1')).toBeInTheDocument();
  });
});
```

### Key Principles

✅ **Never** call `fetch` directly in components  
✅ **Always** use services for API calls  
✅ **Always** use hooks for state management  
✅ **Always** handle loading/error states  
✅ **Always** clean up subscriptions  

---

## Common Patterns

### Pattern 1: List with Pagination

**Backend:**
```python
class ElectionRepository(BaseRepository):
    model = Election
    
    def get_active_paginated(self, page=1, page_size=10):
        return self.paginate(page, page_size, status='active')
```

**Frontend:**
```javascript
export function usePaginatedElections() {
  const [page, setPage] = useState(1);
  const { data, loading } = useApi(`/elections?page=${page}`);
  
  return { elections: data?.results, total: data?.total, page, setPage };
}
```

### Pattern 2: Create with Validation

**Backend:**
```python
class ElectionService(BaseService):
    def create_election(self, data):
        self._validate_data(data, ['title', 'description'])
        return self.create(data)
```

**Frontend:**
```javascript
export function useCreateElection() {
  const [errors, setErrors] = useState({});
  
  const create = async (data) => {
    setErrors({});
    const response = await electionService.create(data);
    if (response.ok) {
      return response.data;
    } else {
      setErrors(response.data);
      return null;
    }
  };
  
  return { create, errors };
}
```

### Pattern 3: Real-time Updates (WebSocket)

**Frontend:**
```javascript
export function useRealtimeElections() {
  const [elections, setElections] = useState([]);
  
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/elections/');
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setElections(prev => [...prev, data]);
    };
    
    return () => socket.close();
  }, []);
  
  return elections;
}
```

---

## File Structure Lookup

**Need to add an endpoint?**
1. Create service in `services/`
2. Create repository in `repositories/`
3. Create serializer in `api/serializers/`
4. Create view in `api/views/`
5. Register URL in `urls.py`

**Need to add a feature component?**
1. Create service in `modules/{feature}/services/`
2. Create hook in `modules/{feature}/hooks/`
3. Create component in `modules/{feature}/components/`
4. Create page in `modules/{feature}/pages/`
5. Register route in `App.js`

---

## Useful Commands

### Backend

```bash
# Create migration
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test core.tests.unit

# Run dev server
python manage.py runserver

# Django shell
python manage.py shell

# Format code
black core/

# Lint code
flake8 core/
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build

# Format code
npx prettier --write src/

# Lint code
npm run lint
```

---

## Resources

- Backend: [ARCHITECTURE.md](./ARCHITECTURE.md)  
- Migration: [ARCHITECTURE_MIGRATION.md](./ARCHITECTURE_MIGRATION.md)  
- Auth: [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md)  
- Security: [COMPREHENSIVE_SECURITY.md](./COMPREHENSIVE_SECURITY.md)  

