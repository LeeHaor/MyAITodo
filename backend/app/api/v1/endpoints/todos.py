from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import (
    TodoCreate,
    TodoListItem,
    TodoListResponse,
    TodoStatusUpdate,
    TodoUpdate,
)
from app.services.history import create_history_record

router = APIRouter()


@router.get("", response_model=TodoListResponse)
def list_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TodoListResponse:
    todos = db.scalars(
        select(Todo)
        .where(Todo.user_id == current_user.id)
        .order_by(Todo.created_at.desc(), Todo.id.desc())
    ).all()
    items = [TodoListItem.model_validate(todo) for todo in todos]
    return TodoListResponse(items=items)


@router.post("", response_model=TodoListItem, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TodoListItem:
    title = payload.title.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="任务标题不能为空。",
        )

    todo = Todo(title=title, user_id=current_user.id)
    db.add(todo)
    db.flush()
    db.add(create_history_record(current_user, todo, "created"))
    db.commit()
    db.refresh(todo)
    return TodoListItem.model_validate(todo)


@router.patch("/{todo_id}/status", response_model=TodoListItem)
def update_todo_status(
    todo_id: int,
    payload: TodoStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TodoListItem:
    todo = db.scalar(select(Todo).where(Todo.id == todo_id, Todo.user_id == current_user.id))
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在。",
        )

    todo.is_completed = payload.is_completed
    action = "completed" if payload.is_completed else "reopened"
    db.add(create_history_record(current_user, todo, action))
    db.commit()
    db.refresh(todo)
    return TodoListItem.model_validate(todo)


@router.patch("/{todo_id}", response_model=TodoListItem)
def update_todo(
    todo_id: int,
    payload: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TodoListItem:
    todo = db.scalar(select(Todo).where(Todo.id == todo_id, Todo.user_id == current_user.id))
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在。",
        )

    title = payload.title.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="任务标题不能为空。",
        )

    todo.title = title
    db.add(create_history_record(current_user, todo, "updated"))
    db.commit()
    db.refresh(todo)
    return TodoListItem.model_validate(todo)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    todo = db.scalar(select(Todo).where(Todo.id == todo_id, Todo.user_id == current_user.id))
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在。",
        )

    db.add(create_history_record(current_user, todo, "deleted"))
    db.delete(todo)
    db.commit()
