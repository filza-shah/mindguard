# backend/app/routers/companion.py
#
# The AI companion uses the Anthropic API to power a supportive chat interface.
# This is the "Claude API layer" mentioned in the project spec.
#
# Key design decision: We add a SYSTEM PROMPT that constrains Claude's behaviour
# for a youth mental health context — empathetic, not diagnostic, crisis-aware.

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import anthropic

from app.core.config import get_settings
from app.core.database import get_db

settings = get_settings()
router = APIRouter(prefix="/companion", tags=["AI Companion"])


# ── Request / Response Schemas (inline for simplicity) ───────────────────────

class ChatMessage(BaseModel):
    role: str           # "user" or "assistant"
    content: str


class CompanionRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []   # last N turns for context
    mood_context: Optional[dict] = None            # optional: recent mood scores to inform responses


class CompanionResponse(BaseModel):
    response: str
    conversation_id: str


# ── System Prompt ─────────────────────────────────────────────────────────────
# This is critical for safety. The system prompt defines the persona and limits.
SYSTEM_PROMPT = """You are MindGuard, a warm and supportive AI companion designed to help young people (ages 10-25) reflect on their feelings and emotional wellbeing.

Your role:
- Listen actively and respond with empathy and warmth
- Help users identify and name their emotions
- Offer gentle, evidence-based coping strategies when appropriate (breathing exercises, grounding techniques, journaling prompts)
- Celebrate small wins and positive moments

Your boundaries (CRITICAL):
- You are NOT a therapist, psychologist, or medical professional. Never diagnose.
- If a user expresses thoughts of self-harm, suicide, or immediate danger, ALWAYS respond with crisis resources first: Crisis Text Line (text HOME to 741741), 988 Suicide & Crisis Lifeline (call/text 988), and encourage them to speak with a trusted adult immediately.
- Never provide medical advice or prescribe coping strategies as treatment.
- Do not engage in roleplay scenarios or topics unrelated to emotional wellbeing.
- Keep responses concise (2-4 paragraphs max) and conversational, not clinical.

Tone: Warm, non-judgmental, curious, encouraging. Talk like a caring older sibling, not a textbook.

If mood context is provided, subtly acknowledge it without being intrusive."""


@router.post(
    "/chat",
    response_model=CompanionResponse,
    summary="Send a message to the AI companion",
)
async def chat_with_companion(
    request: CompanionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message and receive an AI response.
    
    The client sends the full conversation history so we maintain context
    across turns. We keep the last 10 messages to stay within token limits.
    
    If mood_context is provided (recent check-in data), we inject it into
    the system prompt so Claude can give contextually aware responses.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI companion is not configured. Please set ANTHROPIC_API_KEY.",
        )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    # Build system prompt — inject mood context if available
    system = SYSTEM_PROMPT
    if request.mood_context:
        mood_info = (
            f"\n\nRecent context about this user: "
            f"Their average mood this week is {request.mood_context.get('avg_mood_7d', 'unknown')}/5. "
            f"Trend: {request.mood_context.get('trend', 'unknown')}. "
            f"Use this gently to inform your responses, but don't make them feel monitored."
        )
        system += mood_info

    # Truncate history to last 10 messages to control token usage
    history = request.conversation_history[-10:]

    # Format messages for the API
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in history
    ]
    # Add the new user message
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
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI companion unavailable: {str(e)}",
        )

    return CompanionResponse(
        response=assistant_text,
        conversation_id=str(uuid.uuid4()),  # TODO: persist conversations to DB
    )
