from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=64)
    display_name: str = Field(min_length=2, max_length=80)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("请输入正确的邮箱地址。")
        return normalized


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=64)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class AuthUser(BaseModel):
    id: int
    email: str
    display_name: str
    bio: str
    timezone: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
