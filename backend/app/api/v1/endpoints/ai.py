from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps.auth import get_current_user
from app.models.user import User
from app.schemas.todo import (
    AIDecomposeResponse,
    AIPriorityResponse,
    AIRewriteResponse,
    AITodoRequest,
)
from app.services.ai import (
    AIServiceError,
    decompose_task,
    raise_ai_http_error,
    rewrite_task,
    suggest_priority,
)

router = APIRouter()


def _normalize_title(title: str) -> str:
    normalized = title.strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="任务标题不能为空。",
        )
    return normalized


@router.post("/decompose", response_model=AIDecomposeResponse)
async def ai_decompose(
    payload: AITodoRequest,
    current_user: User = Depends(get_current_user),
) -> AIDecomposeResponse:
    current_user
    try:
        items = await decompose_task(_normalize_title(payload.title))
    except AIServiceError as error:
        raise_ai_http_error(error)
    return AIDecomposeResponse(items=items)


@router.post("/rewrite", response_model=AIRewriteResponse)
async def ai_rewrite(
    payload: AITodoRequest,
    current_user: User = Depends(get_current_user),
) -> AIRewriteResponse:
    current_user
    try:
        result = await rewrite_task(_normalize_title(payload.title))
    except AIServiceError as error:
        raise_ai_http_error(error)
    return AIRewriteResponse(**result)


@router.post("/priority", response_model=AIPriorityResponse)
async def ai_priority(
    payload: AITodoRequest,
    current_user: User = Depends(get_current_user),
) -> AIPriorityResponse:
    current_user
    try:
        result = await suggest_priority(_normalize_title(payload.title))
    except AIServiceError as error:
        raise_ai_http_error(error)
    return AIPriorityResponse(**result)
