from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserProfile(BaseModel):
    id: int
    email: str
    display_name: str
    bio: str
    timezone: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    display_name: str = Field(min_length=2, max_length=80)
    bio: str = Field(default="", max_length=255)
    timezone: str = Field(default="Asia/Shanghai", min_length=2, max_length=64)
