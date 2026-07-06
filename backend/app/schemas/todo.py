from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class TodoStatusUpdate(BaseModel):
    is_completed: bool


class TodoUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class TodoListItem(BaseModel):
    id: int
    title: str
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TodoListResponse(BaseModel):
    items: list[TodoListItem]


class AITodoRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class AIDecomposeResponse(BaseModel):
    items: list[str]


class AIRewriteResponse(BaseModel):
    title: str
    reason: str


class AIPriorityResponse(BaseModel):
    priority: str
    reason: str
