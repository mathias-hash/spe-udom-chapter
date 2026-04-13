# SPE UDOM 2026 - Software Architecture

## Overview

This project follows a **Layered Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│         Presentation Layer (Frontend - React)       │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────┐
│           API Gateway / Routing Layer               │
│              (Django URLs & Views)                  │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│      Business Logic Layer (Services)                │
│    • Authentication       • Election Logic          │
│    • User Management      • Event Management        │
│    • Chat Logic           • Analytics               │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│      Data Access Layer (Repositories)               │
│    • Database Queries  • Caching  • ORM             │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│      Domain Layer (Models)                          │
│    • Business Entities  • Business Rules            │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│      Infrastructure Layer (Utilities)               │
│    • Email  • Logging  • Security  • File Upload    │
└─────────────────────────────────────────────────────┘
```

---

## Backend Structure

### Directory Organization

```
backend/
├── backend/                    # Project configuration
│   ├── settings.py            # Django settings
│   ├── urls.py                # Root URL routing
│   ├── asgi.py                # ASGI configuration
│   └── wsgi.py                # WSGI configuration
│
├── core/                       # Main application (Auth, Users, Admin)
│   ├── api/                    # API layer
│   │   ├── views/             # Endpoint handlers
│   │   │   ├── auth.py        # Authentication endpoints
│   │   │   ├── users.py       # User management endpoints
│   │   │   └── admin.py       # Admin endpoints
│   │   ├── serializers/       # Request/Response serializers
│   │   │   ├── auth.py
│   │   │   └── user.py
│   │   └── urls.py            # API routes
│   │
│   ├── domain/                 # Business domain layer
│   │   ├── models/            # Business entities
│   │   │   ├── student.py     # Student model
│   │   │   └── audit_log.py   # Audit log model
│   │   ├── constants.py       # Domain constants
│   │   └── enums.py           # Domain enums
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth_service.py    # Authentication logic
│   │   ├── user_service.py    # User management logic
│   │   └── email_service.py   # Email sending logic
│   │
│   ├── repositories/          # Data access layer
│   │   ├── user_repository.py # User queries
│   │   └── base_repository.py # Base repository pattern
│   │
│   ├── infrastructure/        # Infrastructure utilities
│   │   ├── encryption.py      # Encryption utilities
│   │   ├── security.py        # Security utilities
│   │   ├── logging.py         # Logging utilities
│   │   └── validators.py      # Input validation
│   │
│   ├── middleware.py          # Custom middleware
│   ├── permissions.py         # DRF permission classes
│   ├── exceptions.py          # Custom exceptions
│   └── apps.py
│
├── chat/                       # Chat feature (same structure)
│   ├── api/
│   │   ├── views/
│   │   ├── serializers/
│   │   └── urls.py
│   ├── domain/
│   │   └── models/
│   ├── services/
│   ├── repositories/
│   └── consumers.py          # WebSocket consumers
│
├── elections/                  # Elections feature
│   ├── api/
│   │   ├── views/
│   │   ├── serializers/
│   │   └── urls.py
│   ├── domain/
│   │   └── models/
│   ├── services/
│   └── repositories/
│
└── tests/                      # Test suite
    ├── integration/            # Integration tests
    ├── unit/                   # Unit tests
    └── fixtures/               # Test data
```

### Layer Responsibilities

#### API Layer (`api/`)
- **Responsibility:** Handle HTTP requests/responses
- **What goes here:** Django views/viewsets, serializers, URL routing
- **No business logic:** Just input validation & response formatting
- **Dependencies:** Injects services

```python
# Example: api/views/auth.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.services.auth_service import AuthService

@api_view(['POST'])
def login(request):
    service = AuthService()
    result = service.authenticate(request.data['email'], request.data['password'])
    return Response(result)
```

#### Services Layer (`services/`)
- **Responsibility:** Implement business logic
- **What goes here:** Authentication, transactions, validations, business rules
- **No database calls directly:** Uses repositories
- **No HTTP concerns:** Pure business logic

```python
# Example: services/auth_service.py
class AuthService:
    def __init__(self, user_repo=None):
        self.user_repo = user_repo or UserRepository()
    
    def authenticate(self, email, password):
        user = self.user_repo.find_by_email(email)
        if not user or not user.check_password(password):
            raise AuthenticationError("Invalid credentials")
        return get_tokens(user)
```

#### Repositories Layer (`repositories/`)
- **Responsibility:** Abstract database access
- **What goes here:** Database queries, ORM calls, caching
- **Benefits:** Easy to test, swap implementations

```python
# Example: repositories/user_repository.py
class UserRepository:
    def find_by_email(self, email):
        return Student.objects.get(email=email)
    
    def create(self, data):
        return Student.objects.create(**data)
```

#### Domain Layer (`domain/`)
- **Responsibility:** Define business entities
- **What goes here:** Django models, constants, enums
- **No endpoints or persistence logic:** Just entity definitions

#### Infrastructure Layer (`infrastructure/`)
- **Responsibility:** Cross-cutting concerns
- **What goes here:** Encryption, validation, logging, file storage
- **Utility functions:** Helpers used across layers

---

## Frontend Structure

### Directory Organization

```
frontend/src/
├── pages/                      # Route-level components (1:1 with routes)
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js
│   └── NotFound.js
│
├── modules/                    # Feature modules (organize by feature)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.js
│   │   │   └── RegisterForm.js
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   └── context/
│   │       └── AuthContext.js
│   │
│   ├── elections/
│   │   ├── components/
│   │   │   ├── ElectionList.js
│   │   │   ├── CandidateCard.js
│   │   │   └── VoteForm.js
│   │   ├── hooks/
│   │   │   └── useElections.js
│   │   ├── services/
│   │   │   └── electionService.js
│   │   └── pages/
│   │       ├── ElectionsPage.js
│   │       └── VotePage.js
│   │
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatWindow.js
│   │   │   ├── MessageList.js
│   │   │   └── MessageInput.js
│   │   ├── hooks/
│   │   │   └── useChat.js
│   │   ├── services/
│   │   │   └── chatService.js
│   │   └── context/
│   │       └── ChatContext.js
│   │
│   └── events/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── pages/
│
├── components/                 # Shared reusable components
│   ├── Layout/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── Footer.js
│   ├── Common/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Modal.js
│   │   └── Spinner.js
│   ├── Forms/
│   │   ├── TextInput.js
│   │   ├── SelectInput.js
│   │   └── FormError.js
│   └── UI/
│       ├── Badge.js
│       ├── Alert.js
│       └── Toast.js
│
├── services/                   # Core API services
│   ├── api.js                  # Main API client
│   ├── authService.js          # Authentication service
│   ├── userService.js          # User service
│   └── socketService.js        # WebSocket service
│
├── hooks/                      # Custom React hooks
│   ├── useApi.js               # API hook
│   ├── usePagination.js        # Pagination hook
│   ├── useLocalStorage.js      # Local storage hook
│   └── useTheme.js             # Theme hook
│
├── context/                    # Global state (Context API)
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   └── NotificationContext.js
│
├── utils/                      # Utility functions
│   ├── formatters.js           # Format dates, numbers, etc.
│   ├── validators.js           # Input validation
│   ├── constants.js            # App constants
│   └── helpers.js              # Helper functions
│
├── assets/                     # Static files
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── spe-udom-logo.png
│
├── styles/                     # Global styles
│   ├── globals.css
│   ├── variables.css
│   └── animations.css
│
└── App.js                      # Root component
```

### Layer Responsibilities

#### Pages Layer
- **Purpose:** Route-level containers
- **What goes here:** Top-level page components
- **Note:** 1 page = 1 route

#### Modules Layer
- **Purpose:** Feature organization
- **What goes here:** Feature-specific components, hooks, services
- **Benefits:** Easy to extract into separate packages later

#### Components Layer
- **Purpose:** Reusable UI components
- **What goes here:** Generic, reusable components (no business logic)
- **Examples:** Button, Card, Modal, Input

#### Services Layer
- **Purpose:** API communication
- **What goes here:** HTTP requests, WebSocket connections
- **No JSX:** Just logic

```javascript
// Example: services/authService.js
export const authService = {
  login: (email, password) => api('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  
  register: (data) => api('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
```

#### Hooks Layer
- **Purpose:** Encapsulate stateful logic
- **What goes here:** React hooks for data fetching, state management
- **Reusability:** Can be shared across components

```javascript
// Example: hooks/useElections.js
export function useElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    electionService.list().then(data => {
      setElections(data);
      setLoading(false);
    });
  }, []);
  
  return { elections, loading };
}
```

#### Utils Layer
- **Purpose:** Shared utility functions
- **What goes here:** Formatters, validators, helpers
- **No dependencies:** Pure functions

---

## Data Flow

### Backend Request Flow

```
HTTP Request
    ↓
[API Layer] - Validate & deserialize request
    ↓
[Service Layer] - Execute business logic
    ↓
[Repository Layer] - Query/save data
    ↓
[Domain Layer] - Database models
    ↓
[Service Layer] - Transform response
    ↓
[API Layer] - Serialize & return response
    ↓
HTTP Response
```

### Frontend Request Flow

```
User Action (click, form submit)
    ↓
[Page/Component] - Handle user input
    ↓
[Service] - Call API or WebSocket
    ↓
[Hook/Context] - Update state
    ↓
[Component] - Re-render with new data
    ↓
UI Update
```

---

## Key Principles

### 1. Single Responsibility Principle
- Each layer has **one reason to change**
- Views = HTTP, Services = Logic, Repos = Data

### 2. Dependency Injection
- Services are injected to views
- Repositories are injected to services
- Makes testing easy (mock dependencies)

### 3. No Cross-Layer Violations
- Views don't directly query database
- Services don't return HTTP responses
- Components don't handle API errors statically

### 4. Testability
- Each layer can be tested independently
- Mock dependencies easily
- Services have no HTTP concerns

### 5. Maintainability
- Clear folder structure
- Easy to find code
- Easy to add new features

---

## Module Organization Example: Elections

### Backend

```python
# elections/api/views/election.py
@api_view(['GET', 'POST'])
def elections(request):
    service = ElectionService()
    if request.method == 'GET':
        elections = service.list_active()
        serializer = ElectionSerializer(elections, many=True)
        return Response(serializer.data)

# elections/api/serializers/election.py
class ElectionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()

# elections/services/election_service.py
class ElectionService:
    def __init__(self, repo=None):
        self.repo = repo or ElectionRepository()
    
    def list_active(self):
        return self.repo.find_active()
    
    def create(self, data):
        self.repo.save(data)

# elections/repositories/election_repository.py
class ElectionRepository:
    def find_active(self):
        return Election.objects.filter(status='active')

# elections/domain/models/election.py
class Election(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(choices=STATUS_CHOICES)
```

### Frontend

```javascript
// modules/elections/services/electionService.js
export const electionService = {
  list: () => api('/elections/'),
  create: (data) => api('/elections/', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  vote: (id, candidate) => api(`/elections/${id}/vote/`, {
    method: 'POST',
    body: JSON.stringify({ candidate_id: candidate })
  })
};

// modules/elections/hooks/useElections.js
export function useElections() {
  const [elections, setElections] = useState([]);
  
  useEffect(() => {
    electionService.list().then(data => {
      setElections(data);
    });
  }, []);
  
  return { elections };
}

// modules/elections/components/ElectionList.js
export function ElectionList() {
  const { elections } = useElections();
  return (
    <div>
      {elections.map(e => <ElectionCard key={e.id} election={e} />)}
    </div>
  );
}

// pages/ElectionsPage.js
export function ElectionsPage() {
  return <ElectionList />;
}
```

---

## Benefits

✅ **Scalability** - Easy to add features without affecting existing code  
✅ **Testability** - Each layer can be tested independently  
✅ **Maintainability** - Clear folder structure and responsibilities  
✅ **Reusability** - Services and hooks can be reused  
✅ **Separation of Concerns** - Each layer has a single responsibility  
✅ **Team Collaboration** - Multiple teams can work on different modules  
✅ **Code Reviews** - Clear structure makes reviews easier  

---

## Next Steps

1. **Migrate backend** to new structure (refactor API layers)
2. **Migrate frontend** to module-based organization
3. **Create base classes** for repositories and services
4. **Add dependency injection** container (optional, for advanced DI)
5. **Write tests** for each layer
6. **Document API** contracts

