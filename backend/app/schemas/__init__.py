"""Pydantic schema package."""
from app.schemas.auth import AuthResponse, AuthUser, LoginRequest, RegisterRequest
from app.schemas.history import HistoryItem, HistoryListResponse
from app.schemas.todo import (
    TodoCreate,
    TodoListItem,
    TodoListResponse,
    TodoStatusUpdate,
    TodoUpdate,
)
from app.schemas.user import UserProfile, UserProfileUpdate

__all__ = [
    "AuthResponse",
    "AuthUser",
    "HistoryItem",
    "HistoryListResponse",
    "LoginRequest",
    "RegisterRequest",
    "TodoCreate",
    "TodoListItem",
    "TodoListResponse",
    "TodoStatusUpdate",
    "TodoUpdate",
    "UserProfile",
    "UserProfileUpdate",
]

__all__ = [
    "TodoCreate",
    "TodoListItem",
    "TodoListResponse",
    "TodoStatusUpdate",
    "TodoUpdate",
]
