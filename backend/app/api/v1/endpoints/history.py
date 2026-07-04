from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.todo_history import TodoHistory
from app.models.user import User
from app.schemas.history import HistoryItem, HistoryListResponse

router = APIRouter()


@router.get("", response_model=HistoryListResponse)
def list_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HistoryListResponse:
    history_items = db.scalars(
        select(TodoHistory)
        .where(TodoHistory.user_id == current_user.id)
        .order_by(TodoHistory.created_at.desc(), TodoHistory.id.desc())
        .limit(50)
    ).all()
    return HistoryListResponse(items=[HistoryItem.model_validate(item) for item in history_items])
