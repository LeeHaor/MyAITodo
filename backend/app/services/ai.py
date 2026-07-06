from __future__ import annotations

import json
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class AIServiceError(Exception):
    """Raised when the AI provider cannot return a usable result."""


def _build_headers() -> dict[str, str]:
    if not settings.deepseek_api_key:
        raise AIServiceError("AI 服务尚未配置，请先补充 DEEPSEEK_API_KEY。")

    return {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json",
    }


async def _chat_completion(system_prompt: str, user_prompt: str) -> str:
    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.4,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0, base_url=settings.deepseek_base_url) as client:
            response = await client.post(
                "/chat/completions",
                headers=_build_headers(),
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text or "AI 服务调用失败。"
        raise AIServiceError(detail) from exc
    except httpx.HTTPError as exc:
        raise AIServiceError("AI 服务暂时不可用，请稍后重试。") from exc

    data = response.json()
    choices = data.get("choices") or []
    if not choices:
        raise AIServiceError("AI 服务未返回有效结果。")

    message = choices[0].get("message", {})
    content = message.get("content", "")
    if not content.strip():
        raise AIServiceError("AI 服务未返回有效内容。")

    return content.strip()


def _extract_json(content: str) -> Any:
    normalized = content.strip()
    if normalized.startswith("```"):
        lines = normalized.splitlines()
        if len(lines) >= 3:
            normalized = "\n".join(lines[1:-1]).strip()

    try:
        return json.loads(normalized)
    except json.JSONDecodeError as exc:
        raise AIServiceError("AI 返回格式异常，暂时无法解析。") from exc


async def decompose_task(title: str) -> list[str]:
    content = await _chat_completion(
        system_prompt=(
            "你是任务规划助手。请把用户输入的一条任务拆成 3 到 5 条可执行子任务。"
            '只返回 JSON，格式为 {"items": ["子任务1", "子任务2"]}。'
        ),
        user_prompt=f"请拆解这条任务：{title}",
    )
    data = _extract_json(content)
    items = data.get("items") if isinstance(data, dict) else None
    if not isinstance(items, list):
        raise AIServiceError("AI 拆解结果格式不正确。")

    normalized_items = [str(item).strip() for item in items if str(item).strip()]
    if not normalized_items:
        raise AIServiceError("AI 没有生成可用的拆解结果。")
    return normalized_items[:5]


async def rewrite_task(title: str) -> dict[str, str]:
    content = await _chat_completion(
        system_prompt=(
            "你是任务重写助手。请把任务标题改写得更明确、更可执行。"
            '只返回 JSON，格式为 {"title": "...", "reason": "..."}。'
        ),
        user_prompt=f"请重写这条任务：{title}",
    )
    data = _extract_json(content)
    if not isinstance(data, dict):
        raise AIServiceError("AI 重写结果格式不正确。")

    rewritten_title = str(data.get("title", "")).strip()
    reason = str(data.get("reason", "")).strip()
    if not rewritten_title:
        raise AIServiceError("AI 没有生成可用的新标题。")

    return {
        "title": rewritten_title,
        "reason": reason or "AI 已将任务改写为更明确的执行表达。",
    }


async def suggest_priority(title: str) -> dict[str, str]:
    content = await _chat_completion(
        system_prompt=(
            "你是任务优先级助手。请基于任务紧急度和执行价值给出优先级建议。"
            '只返回 JSON，格式为 {"priority": "高/中/低", "reason": "..."}。'
        ),
        user_prompt=f"请判断这条任务的优先级：{title}",
    )
    data = _extract_json(content)
    if not isinstance(data, dict):
        raise AIServiceError("AI 优先级结果格式不正确。")

    priority = str(data.get("priority", "")).strip()
    reason = str(data.get("reason", "")).strip()
    if priority not in {"高", "中", "低"}:
        raise AIServiceError("AI 返回了无效的优先级。")

    return {
        "priority": priority,
        "reason": reason or "AI 已基于任务紧急度和执行价值给出建议。",
    }


def raise_ai_http_error(error: AIServiceError) -> None:
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=str(error),
    )
