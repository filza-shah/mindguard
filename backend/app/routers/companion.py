# backend/app/routers/companion.py

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import anthropic

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User

settings = get_settings()
router = APIRouter(prefix="/companion", tags=["AI Companion"])


class ChatMessage(BaseModel):
    role: str
    content: str


class CompanionRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    mood_context: Optional[dict] = None


class CompanionResponse(BaseModel):
    response: str
    conversation_id: str


SYSTEM_PROMPT = """You are MindGuard, a warm and supportive AI companion designed to help young people (ages 10-25) reflect on their feelings and emotional wellbeing.

Your role:
- Listen actively and respond with empathy and warmth
- Help users identify and name their emotions
- Offer gentle, evidence-based coping strategies when appropriate

Your boundaries (CRITICAL):
- You are NOT a therapist or medical professional. Never diagnose.
- If a user expresses thoughts of self-harm or suicide, ALWAYS respond with crisis resources first: Crisis Text Line (text HOME to 741741), 988 Suicide & Crisis Lifeline (call/text 988).
- Never provide medical advice.

Tone: Warm, non-judgmental, curious, encouraging."""


@router.post("/chat", response_model=CompanionResponse, summary="Send a message to the AI companion")
async def chat_with_companion(
    request: CompanionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "placeholder":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI companion is not configured. Please set ANTHROPIC_API_KEY.",
        )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    system = SYSTEM_PROMPT
    if request.mood_context:
        system += (
            f"\n\nRecent context: avg mood this week is "
            f"{request.mood_context.get('avg_mood_7d', 'unknown')}/5, "
            f"trend: {request.mood_context.get('trend', 'unknown')}."
        )

    messages = [{"role": m.role, "content": m.content} for m in request.conversation_history[-10:]]
    messages.append({"role": "user", "content": request.message})

    try:
        api_response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system,
            messages=messages,
        )
        assistant_text = api_response.content[0].text
    except anthropic.APIError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    return CompanionResponse(response=assistant_text, conversation_id=str(uuid.uuid4()))
