from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserProfile, UserProfileUpdate

router = APIRouter()


@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)) -> UserProfile:
    return UserProfile.model_validate(current_user)


@router.patch("/me", response_model=UserProfile)
def update_my_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfile:
    current_user.display_name = payload.display_name.strip()
    current_user.bio = payload.bio.strip()
    current_user.timezone = payload.timezone.strip()
    db.commit()
    db.refresh(current_user)
    return UserProfile.model_validate(current_user)
