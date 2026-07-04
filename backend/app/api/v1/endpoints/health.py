from fastapi import APIRouter

from app.db.session import check_database_connection

router = APIRouter()


@router.get("")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "myaitodo-backend",
    }


@router.get("/db")
def database_health() -> dict[str, str]:
    if check_database_connection():
        return {
            "status": "ok",
            "database": "connected",
        }

    return {
        "status": "degraded",
        "database": "unavailable",
    }
