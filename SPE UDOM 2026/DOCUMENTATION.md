# SPE UDOM Student Chapter — System Documentation

**Version:** 1.0  
**Institution:** University of Dodoma (UDOM)  
**Organization:** Society of Petroleum Engineers (SPE) Student Chapter  
**Date:** 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Models](#4-database-models)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Features & Modules](#6-features--modules)
7. [API Reference](#7-api-reference)
8. [Frontend Pages](#8-frontend-pages)
9. [Security](#9-security)
10. [Deployment](#10-deployment)
11. [Environment Variables](#11-environment-variables)
12. [Installation & Local Setup](#12-installation--local-setup)

---

## 1. System Overview

The SPE UDOM Student Chapter Web System is a full-stack web application that manages all activities of the SPE Student Chapter at the University of Dodoma. It provides a platform for student members, chapter leadership, and administrators to manage elections, events, publications, leadership records, annual reports, and member communication.

**Core Goals:**
- Digitize chapter operations and record keeping
- Enable transparent and secure online elections
- Provide members with easy access to chapter resources
- Automate communication through a live AI-powered chat assistant

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│              React.js Single Page App                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────┐
│                  BACKEND SERVER                      │
│         Django + Django REST Framework               │
│         Daphne ASGI (WebSocket support)              │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  REST API   │  │  Chat    │  │  Django Admin  │  │
│  │  /api/      │  │  /ws/    │  │  /admin/       │  │
│  └─────────────┘  └──────────┘  └────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   DATABASE                           │
│         PostgreSQL (production)                      │
│         SQLite (development)                         │
└─────────────────────────────────────────────────────┘
```

**Communication:**
- REST API over HTTPS for all data operations
- WebSocket (WSS) via Django Channels for live chat
- JWT tokens for authentication

---

## 3. Technology Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Django | 5.2.12 | Web framework |
| Django REST Framework | 3.16.1 | REST API |
| Django Channels | 4.2.2 | WebSocket support |
| Daphne | 4.1.2 | ASGI server |
| djangorestframework-simplejwt | 5.5.1 | JWT authentication |
| django-cors-headers | 4.7.0 | CORS handling |
| django-environ | 0.12.0 | Environment variables |
| psycopg | 3.2.10 | PostgreSQL driver |
| whitenoise | 6.9.0 | Static file serving |
| django-ratelimit | 4.1.0 | Rate limiting |
| cryptography | 43.0.0 | Data encryption |
| gunicorn | 23.0.0 | WSGI server |
| Pillow | ≥11.0.0 | Image processing |

### Frontend
| Package | Purpose |
|---|---|
| React.js | UI framework |
| React Router DOM | Client-side routing |
| Context API | Global state (auth) |
| Fetch API | HTTP requests |
| WebSocket API | Live chat |
| CSS Modules | Styling |

### Infrastructure
| Service | Purpose |
|---|---|
| Render | Backend & frontend hosting |
| PostgreSQL | Production database |
| GitHub Actions | CI/CD pipeline |

---

## 4. Database Models

### Student (Custom User)
| Field | Type | Description |
|---|---|---|
| email | EmailField (unique) | Login identifier |
| full_name | CharField | Full name |
| phone | CharField | Phone number (optional) |
| year_of_study | PositiveSmallIntegerField | Academic year (1–4) |
| role | CharField | admin / president / general_secretary / member |
| profile_picture | FileField | Profile photo |
| is_active | BooleanField | Account status |
| date_joined | DateTimeField | Registration date |

### Election
| Field | Type | Description |
|---|---|---|
| title | CharField | Election name |
| description | TextField | Details |
| status | CharField | draft / open / closed |
| start_date | DateTimeField | Opening time |
| end_date | DateTimeField | Closing time |
| created_by | ForeignKey(Student) | Creator |

### Candidate
| Field | Type | Description |
|---|---|---|
| election | ForeignKey(Election) | Associated election |
| name | CharField | Candidate name |
| position | CharField | Position contested |
| manifesto | TextField | Candidate statement |
| photo | ImageField | Candidate photo |
| approved | BooleanField | Approval status |

### Vote
| Field | Type | Description |
|---|---|---|
| election | ForeignKey(Election) | Election voted in |
| voter | ForeignKey(Student) | Voter |
| candidate | ForeignKey(Candidate) | Candidate voted for |
| position_voted | CharField | Position |
| voted_at | DateTimeField | Timestamp |

*Constraint: One vote per voter per position per election*

### Event
| Field | Type | Description |
|---|---|---|
| title | CharField | Event name |
| description | TextField | Details |
| location | CharField | Venue |
| date | DateTimeField | Event date/time |
| status | CharField | pending / approved / rejected / cancelled |
| created_by | ForeignKey(Student) | Organizer |

### Publication
| Field | Type | Description |
|---|---|---|
| title | CharField | Title |
| content | TextField | Body text |
| file | FileField | Attached file |
| pub_type | CharField | article / journal / document / image |
| published_by | ForeignKey(Student) | Author |

### LeadershipMember
| Field | Type | Description |
|---|---|---|
| name | CharField | Member name |
| position | CharField | Leadership position |
| year | CharField | Academic year (e.g. 2025/2026) |
| image | FileField | Photo |
| display_order | PositiveSmallIntegerField | Sort order |

### AnnualReport
| Field | Type | Description |
|---|---|---|
| year | CharField (unique) | Academic year |
| president_message | TextField | Message from president |
| membership_statistics | TextField | Membership data |
| challenges | TextField | Challenges faced |
| recommendations | TextField | Recommendations |
| technical_dissemination | TextField | Technical activities |
| community_engagement | TextField | Community activities |
| member_recognition | TextField | Member achievements |

### Chat Models
- **ChatRoom** — Chat room with a unique slug
- **Message** — Individual chat message with sender info and role
- **ChatFAQ** — Admin-managed FAQ entries with keywords for auto-responses
- **MessageQuota** — Per-user daily/hourly message limits

---

## 5. User Roles & Permissions

| Role | Access Level |
|---|---|
| **Admin** | Full system access — manage users, elections, events, publications, leadership, reports |
| **President** | President dashboard — overview, leadership management, annual report |
| **General Secretary** | Secretary dashboard — elections, candidates, results, analytics, publications, leadership, annual report |
| **Member** | Member dashboard — view elections, cast votes, view events and publications, profile management |
| **Guest (unauthenticated)** | Public pages only — home, about, leadership, events, publications, contact |

---

## 6. Features & Modules

### 6.1 Authentication
- User registration with email, full name, phone, year of study
- JWT login with access token (1 hour) and refresh token (7 days)
- Automatic token refresh on expiry
- Forgot password via email link
- Password reset with secure token
- Change password from profile
- Role-based dashboard routing on login

### 6.2 Public Website
- **Home** — Chapter overview, stats, upcoming events, latest publications
- **About** — Chapter history, mission, vision
- **Leadership** — Current leadership team with photos, filterable by academic year
- **Events** — Approved upcoming and past events with photos
- **Publications** — Articles, journals, documents, images
- **Contact** — Contact form, email, location
- **Membership** — How to join, benefits

### 6.3 Elections System
- Create elections with title, description, start/end dates
- Add candidates with photo, position, manifesto
- Approve/reject candidates
- Open/close elections
- Members cast one vote per position
- Real-time results with vote counts and percentages
- Election analytics with charts
- Public election results page

### 6.4 Events Management
- Create events (pending approval)
- Admin/Secretary approves or rejects events
- Event cancellation with reason
- Event photo gallery upload
- Member event registration
- Public events listing

### 6.5 Publications
- Upload articles, journals, documents, images
- File attachment support (PDF, DOC, images)
- Public publication listing with download/view

### 6.6 Leadership Management
- Add/edit/remove leadership members per academic year
- Photo upload for each member
- Display order control
- Academic year navigation (advance year feature)
- Public leadership page filtered by year

### 6.7 Annual Report
- Structured report per academic year
- Sections: President's Message, Membership Statistics, Technical Activities, Community Engagement, Member Recognition, Challenges, Recommendations
- Image uploads per section
- Financial items table (income, expenditure, balance)

### 6.8 Live Chat & AI Assistant
- WebSocket-based real-time chat
- AI assistant (SPE Assistant) auto-responds to questions about:
  - Membership and joining
  - Events and activities
  - Leadership and roles
  - Elections and voting
  - Publications
  - Scholarships and career
  - SPE International information
  - PetroBowl and ATCE
  - Contact details
- Admin-managed FAQ entries with keyword matching
- Message quota per user (rate limiting)
- Guest chat support (no login required)

### 6.9 Suggestions
- Members submit suggestions (optionally anonymous)
- Admin/Secretary can reply to suggestions
- Members view their own suggestions and replies

### 6.10 Announcements
- Admin creates announcements
- Visible to all authenticated users

### 6.11 Profile Management
- Update name, phone, year of study
- Change password
- View account details and role

---

## 7. API Reference

**Base URL:** `https://your-backend.onrender.com/api`

### Authentication Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register/` | Register new user | No |
| POST | `/auth/login/` | Login, returns JWT tokens | No |
| GET/PATCH | `/auth/profile/` | Get or update profile | Yes |
| POST | `/auth/change-password/` | Change password | Yes |
| POST | `/auth/token/refresh/` | Refresh access token | No |
| POST | `/auth/forgot-password/` | Send reset email | No |
| POST | `/auth/reset-password/<uidb64>/<token>/` | Reset password | No |

### Public Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API status |
| GET | `/about/` | About info |
| GET | `/leadership/` | Leadership members |
| GET | `/public/events/` | Approved events |
| GET | `/public/stats/` | Chapter statistics |
| GET | `/public/election/` | Public elections |
| GET | `/public/election/<id>/results/` | Election results |
| GET | `/publications/` | Publications list |
| POST | `/contact/` | Submit contact message |
| POST | `/join/` | Membership enquiry |

### Elections Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET/POST | `/elections/` | List or create elections | Yes |
| GET/PATCH/DELETE | `/elections/<id>/` | Election detail | Yes |
| POST | `/elections/<id>/candidates/` | Add candidate | Yes |
| POST | `/elections/<id>/vote/` | Cast vote | Yes |
| GET | `/elections/<id>/my-votes/` | My votes | Yes |
| GET | `/elections/<id>/results/` | Results | Yes |

### Events Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET/POST | `/events/` | List or create events | Yes |
| GET/PATCH | `/events/<id>/` | Event detail | Yes |
| POST | `/events/<id>/approve/` | Approve event | Admin |
| POST | `/events/<id>/register/` | Register for event | Yes |
| POST/GET | `/events/<id>/photos/` | Event photos | Yes |

### Annual Report Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET/POST | `/annual-reports/` | List or create report | Yes |
| GET/PATCH | `/annual-reports/<year>/` | Report detail | Yes |
| GET/POST | `/annual-reports/<year>/financial/` | Financial items | Yes |
| POST | `/annual-reports/<year>/images/<section>/` | Upload section image | Yes |

### Chat Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/chat/support-room/` | Get room and messages | No |
| POST | `/chat/send/` | Send message (HTTP fallback) | No |
| WS | `wss://backend/ws/chat/<room_key>/` | WebSocket chat | No |

---

## 8. Frontend Pages

### Public Pages
| Route | Component | Description |
|---|---|---|
| `/` | Home | Landing page |
| `/about` | About | About the chapter |
| `/leadership` | Leadership | Leadership team |
| `/events` | Events | Events listing |
| `/publication` | Publication | Publications |
| `/contact` | Contact | Contact form |
| `/join` | Membership | Join the chapter |
| `/election` | Election | Public election info |
| `/forgot-password` | ForgotPassword | Password reset request |
| `/reset-password/:uid/:token` | ResetPassword | Password reset form |

### Dashboard Pages
| Route | Role | Description |
|---|---|---|
| `/dashboard/` | All | Overview/home |
| `/dashboard/elections` | Secretary/Admin | Manage elections |
| `/dashboard/candidates` | Secretary/Admin | Manage candidates |
| `/dashboard/results` | Secretary/Admin | View results |
| `/dashboard/analytics` | Secretary/Admin | Election analytics |
| `/dashboard/publications` | Secretary/Admin | Manage publications |
| `/dashboard/leadership` | Secretary/President/Admin | Manage leadership |
| `/dashboard/annual-report` | Secretary/President | Annual report editor |
| `/dashboard/profile` | All | Profile settings |
| `/dashboard/users` | Admin | User management |
| `/dashboard/events` | Admin | Event management |

---

## 9. Security

### Authentication & Authorization
- JWT access tokens (1-hour expiry) and refresh tokens (7-day expiry)
- Role-based permission checks on all protected endpoints
- Token blacklisting after rotation

### Data Protection
- Fernet symmetric encryption for sensitive fields
- Passwords hashed using Django's PBKDF2 algorithm
- HTTPS enforced in production (`SECURE_SSL_REDIRECT`)
- HSTS enabled with 1-year max-age

### API Security
- CORS restricted to allowed origins only
- CSRF protection with `SameSite=Strict` cookies
- Rate limiting: 100 requests/hour (anonymous), 1000/hour (authenticated)
- WebSocket rate limiting: 50 messages/hour per connection
- Input validation and sanitization on all endpoints
- Max file upload size: 5MB
- Allowed file types: jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx

### Security Headers
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- Content Security Policy
- Custom security headers middleware

### Logging
- Application logs: `logs/django.log` (10MB rotating, 5 backups)
- Security logs: `logs/security.log` (warnings and above)

---

## 10. Deployment

### Backend (Render)
- **Root directory:** `SPE UDOM 2026/backend`
- **Build command:** `./build.sh`
- **Start command:** `daphne -b 0.0.0.0 -p $PORT backend.asgi:application`
- **Runtime:** Python 3.11

### Frontend (Render Static Site)
- **Root directory:** `SPE UDOM 2026/frontend`
- **Build command:** `npm install && npm run build`
- **Publish directory:** `build`

### CI/CD (GitHub Actions)
- Runs on push/PR to `main` branch
- Tests against Python 3.10 and 3.11
- Installs dependencies and runs `python manage.py test`

---

## 11. Environment Variables

### Backend `.env`
```env
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
CSRF_TRUSTED_ORIGINS=https://your-frontend.onrender.com
DATABASE_URL=postgresql://user:password@host:5432/dbname
ENCRYPTION_KEY=your-fernet-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=SPE UDOM Chapter <noreply@speudom.ac.tz>
PASSWORD_RESET_CONFIRM_URL=https://your-frontend.onrender.com/reset-password
REDIS_URL=redis://your-redis-url  # Optional, for multi-instance WebSocket
```

### Frontend `.env`
```env
REACT_APP_API_BASE_URL=https://your-backend.onrender.com
```

---

## 12. Installation & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend Setup
```bash
cd "SPE UDOM 2026/backend"
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Fill in your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Or with Daphne (for WebSocket support):
```bash
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

### Frontend Setup
```bash
cd "SPE UDOM 2026/frontend"
npm install
# Create .env file
echo REACT_APP_API_BASE_URL=http://localhost:8000 > .env
npm start
```

### Access
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| Django Admin | http://localhost:8000/admin |

---

*Documentation prepared for SPE UDOM Student Chapter Web System — University of Dodoma, 2026*
