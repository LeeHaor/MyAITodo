from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HistoryItem(BaseModel):
    id: int
    todo_id: int | None
    action: str
    title_snapshot: str
    detail: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
