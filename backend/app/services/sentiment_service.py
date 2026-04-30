# backend/app/services/sentiment_service.py
#
# Updated to load the trained ML model (from Milestone 4 training).
# Falls back to lexicon-based approach if model file doesn't exist yet.

import re
import os
from typing import Tuple

# ── Lazy model loading ────────────────────────────────────────────────────────
# We load the model once and cache it in memory.
# "Lazy" means we only load it on first use, not at import time.
# This prevents startup errors if the model hasn't been trained yet.

_model = None
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "../ml/models/sentiment_model.joblib"
)


def _get_model():
    """Load model once, cache in memory for subsequent calls."""
    global _model
    if _model is None and os.path.exists(_MODEL_PATH):
        try:
            import joblib
            _model = joblib.load(_MODEL_PATH)
            print(f"✅ Sentiment model loaded from {_MODEL_PATH}")
        except Exception as e:
            print(f"⚠️  Could not load sentiment model: {e}. Using lexicon fallback.")
    return _model


# ── Mental Health Lexicon (fallback) ─────────────────────────────────────────

POSITIVE_WORDS = {
    "good", "great", "happy", "joy", "joyful", "wonderful", "fantastic",
    "amazing", "excellent", "love", "loved", "grateful", "thankful", "blessed",
    "hopeful", "optimistic", "peaceful", "calm", "relaxed", "content", "satisfied",
    "pleased", "glad", "delighted", "motivated", "energised", "energized", "focused",
    "productive", "accomplished", "proud", "confident", "supported", "connected",
    "understood", "better", "improving", "progress", "resilient", "coping",
    "managing", "okay", "fine", "stable", "balanced", "refreshed", "rested",
    "laughed", "smiled", "enjoyed", "achieved", "succeeded", "fun", "positive",
}

NEGATIVE_WORDS = {
    "bad", "terrible", "awful", "horrible", "sad", "unhappy", "miserable",
    "angry", "frustrated", "upset", "worried", "scared", "afraid", "stressed",
    "anxious", "nervous", "depressed", "depression", "lonely", "alone",
    "numb", "empty", "hollow", "worthless", "hopeless", "helpless", "stuck",
    "overwhelmed", "exhausted", "drained", "burned", "burnout", "crying", "cried",
    "tears", "pain", "hurt", "suffering", "struggling", "dark", "darkness",
    "pointless", "meaningless", "failure", "failed", "guilt", "shame",
    "panic", "panicked", "crisis", "broken", "isolated", "withdrawn", "avoiding",
    "hiding", "tired", "fatigue", "regret", "disappointed", "disappointment",
}

INTENSIFIERS = {"very", "extremely", "really", "so", "absolutely", "completely"}
NEGATION_WORDS = {"not", "no", "never", "nothing", "nobody", "nowhere", "barely", "hardly"}


def analyse_sentiment(text: str) -> Tuple[str, float]:
    """
    Analyse sentiment of a mood check-in note.

    Priority:
    1. Use trained ML model (if available — after running train.py)
    2. Fall back to lexicon-based approach

    Returns:
        (label, confidence) where label is "positive"/"negative"/"neutral"
        and confidence is 0.0–1.0
    """
    if not text or not text.strip():
        return "neutral", 0.5

    model = _get_model()
    if model is not None:
        return _ml_sentiment(text, model)

    return _lexicon_sentiment(text)


def _ml_sentiment(text: str, model) -> Tuple[str, float]:
    """Use the trained scikit-learn pipeline."""
    try:
        label = model.predict([text])[0]
        probabilities = model.predict_proba([text])[0]
        confidence = float(max(probabilities))
        return str(label), round(confidence, 3)
    except Exception as e:
        print(f"⚠️  ML inference failed: {e}. Using lexicon.")
        return _lexicon_sentiment(text)


def _lexicon_sentiment(text: str) -> Tuple[str, float]:
    """Rule-based fallback using mental health word lexicon."""
    text_clean = re.sub(r"[^\w\s']", " ", text.lower())
    words = text_clean.split()

    if not words:
        return "neutral", 0.5

    positive_score = 0.0
    negative_score = 0.0

    for i, word in enumerate(words):
        context = words[max(0, i - 3):i]
        is_negated = any(w in NEGATION_WORDS for w in context)
        intensity = 1.5 if any(w in INTENSIFIERS for w in words[max(0, i - 2):i]) else 1.0

        if word in POSITIVE_WORDS:
            if is_negated:
                negative_score += 1.0 * intensity
            else:
                positive_score += 1.0 * intensity
        elif word in NEGATIVE_WORDS:
            if is_negated:
                positive_score += 0.5 * intensity
            else:
                negative_score += 1.0 * intensity

    total = positive_score + negative_score
    if total == 0:
        return "neutral", 0.5

    positive_ratio = positive_score / total

    if positive_ratio >= 0.65:
        label, confidence = "positive", min(0.95, 0.5 + positive_ratio * 0.5)
    elif positive_ratio <= 0.35:
        label, confidence = "negative", min(0.95, 0.5 + (1 - positive_ratio) * 0.5)
    else:
        label, confidence = "neutral", 0.5 + abs(positive_ratio - 0.5) * 0.3

    word_coverage = min(1.0, total / max(len(words) * 0.3, 1))
    return label, round(confidence * (0.6 + word_coverage * 0.4), 3)
