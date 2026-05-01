# backend/app/routers/companion.py

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from openai import OpenAI

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


SYSTEM_PROMPT = """You are MindGuard, a warm and supportive companion for young people (ages 10-25).

RESPONSE RULES — follow these strictly:
- Keep responses SHORT: 2-4 sentences maximum. Never write long paragraphs.
- Be conversational, like texting a caring friend — not a formal counsellor.
- Ask ONE follow-up question at most. Never ask multiple questions at once.
- Never use bullet points or lists.
- Never repeat crisis resources unless the person is actually expressing they are in crisis.
- Mirror the energy of the user — if they're light and happy, be warm and celebratory. If serious, be gentle and calm.
- Use their name occasionally but not in every single message.
- Vary your openings — never start with "I'm so glad" or "I'm sorry to hear" every time.
- Do not over-explain or give lectures. Just listen and respond naturally.

Your role:
- Make the person feel heard and understood
- Reflect back what they share with empathy
- Offer one small practical idea or question when it feels right

Hard limits:
- You are NOT a therapist. Never diagnose anything.
- If someone mentions self-harm, suicide, or wanting to die, respond with:
  "That sounds really serious and I want you to get real support right now. Please call or text 988, or text HOME to 741741 — they're there for you 24/7."
- Never provide medical advice of any kind."""


@router.post("/chat", response_model=CompanionResponse, summary="Send a message to the AI companion")
async def chat_with_companion(
    request: CompanionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "placeholder":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI companion is not configured.",
        )

    client = OpenAI(
        api_key=settings.ANTHROPIC_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )

    system = SYSTEM_PROMPT
    if request.mood_context:
        avg = request.mood_context.get("avg_mood_7d", "unknown")
        trend = request.mood_context.get("trend", "unknown")
        system += f"\n\nContext: this user's average mood this week is {avg}/5 and their trend is {trend}. Use this subtly to inform your tone — don't mention it directly unless relevant."

    messages = [{"role": "system", "content": system}]
    for msg in request.conversation_history[-10:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": request.message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=200,
            temperature=0.8,
        )
        text = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    return CompanionResponse(response=text, conversation_id=str(uuid.uuid4()))