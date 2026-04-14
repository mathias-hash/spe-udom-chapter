# Deployment

## Backend: Railway or Render

Deploy the `backend` folder.

### Environment variables

- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `DATABASE_URL`

### Render

- Root directory: `backend`
- Build command: `./build.sh`
- Start command: `python manage.py migrate && gunicorn backend.wsgi:application`
- Add `backend/runtime.txt` with `python-3.13.3` so Render does not default to Python 3.14
- Optional: use the included `backend/render.yaml`

### Railway

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn backend.wsgi:application`
- Run once after first deploy: `python manage.py migrate`

## Frontend: Netlify or Vercel

Deploy the `frontend` folder.

### Environment variable

- `REACT_APP_API_BASE_URL=https://your-backend-domain`

### Netlify

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `build`
- SPA fallback is configured in `frontend/netlify.toml`

### Vercel

- Root directory: `frontend`
- Framework preset: Create React App / React
- Build command: `npm run build`
- Output directory: `build`

## Final wiring

After the frontend is live, copy the real frontend URL into:

- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
