# Backend Development

## Environment

1. Install dependencies from `requirements.txt`
2. Configure `backend/.env`
3. Run database migrations before starting the API

## Migration Commands

```bash
alembic upgrade head
```

Create a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe change"
```
