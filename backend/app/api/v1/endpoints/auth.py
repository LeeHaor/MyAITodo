from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.todo import Todo
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthUser, LoginRequest, RegisterRequest

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    is_first_user = db.query(User).count() == 0
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该邮箱已注册，请直接登录。",
        )

    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        display_name=payload.display_name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if is_first_user:
        legacy_todos = db.scalars(select(Todo).where(Todo.user_id.is_(None))).all()
        for todo in legacy_todos:
            todo.user_id = user.id
        db.commit()

    access_token = create_access_token(user.email)
    return AuthResponse(access_token=access_token, user=AuthUser.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误。",
        )

    access_token = create_access_token(user.email)
    return AuthResponse(access_token=access_token, user=AuthUser.model_validate(user))
