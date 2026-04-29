# backend/app/ml/evaluate.py
#
# Run this after training to get a full evaluation report.
# This is what you show interviewers when they ask "how did you validate your model?"
#
# HOW TO RUN:
#   cd backend
#   python -m app.ml.evaluate

import os
import json
import joblib
import numpy as np
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
    accuracy_score,
)
from sklearn.model_selection import cross_val_score, StratifiedKFold

from app.ml.dataset import build_dataset, get_train_test_split


def evaluate_model(model_path: str = "app/ml/models/sentiment_model.joblib"):
    """
    Full evaluation suite:
    - Hold-out test set metrics
    - 5-fold cross-validation
    - Per-class breakdown
    - Example predictions
    """
    if not os.path.exists(model_path):
        print("❌ No trained model found. Run train.py first.")
        return

    print("=" * 60)
    print("MindGuard Sentiment Classifier — Evaluation Report")
    print("=" * 60)

    # Load model
    pipeline = joblib.load(model_path)
    print(f"✅ Loaded model from {model_path}")

    # Load data
    train_df, test_df = get_train_test_split(test_size=0.2, random_seed=42)
    full_df = build_dataset(augment=True)

    X_test = test_df["text"].tolist()
    y_test = test_df["label"].tolist()
    X_all = full_df["text"].tolist()
    y_all = full_df["label"].tolist()

    # ── Hold-out Test Set ─────────────────────────────────────────
    print("\n── Hold-out Test Set ─────────────────────────────────────")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    print(classification_report(y_test, y_pred))
    print(f"Accuracy:    {accuracy_score(y_test, y_pred):.4f}")
    print(f"F1 (macro):  {f1_score(y_test, y_pred, average='macro'):.4f}")

    # ── 5-Fold Cross-Validation ───────────────────────────────────
    print("\n── 5-Fold Cross-Validation (on full dataset) ─────────────")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_all, y_all, cv=cv, scoring="f1_macro")
    print(f"F1 scores per fold: {[round(s, 4) for s in cv_scores]}")
    print(f"Mean F1: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # ── Example Predictions ───────────────────────────────────────
    print("\n── Example Predictions ───────────────────────────────────")
    examples = [
        "I feel amazing today, had such a wonderful time",
        "Everything is terrible and I can't stop crying",
        "Just a regular day, nothing special happened",
        "Feeling really anxious and overwhelmed by everything",
        "Made progress on my goals today, feeling proud",
        "Numb and empty, don't see the point of anything",
        "Had okay day, bit tired but managing fine",
    ]

    classes = pipeline.classes_
    for text in examples:
        pred = pipeline.predict([text])[0]
        proba = pipeline.predict_proba([text])[0]
        confidence = max(proba)
        print(f"\n  Text: '{text[:60]}...' " if len(text) > 60 else f"\n  Text: '{text}'")
        print(f"  → {pred.upper()} (confidence: {confidence:.2f})")
        for cls, p in zip(classes, proba):
            bar = "█" * int(p * 20)
            print(f"    {cls:10} {p:.3f} {bar}")

    # ── Confusion Matrix ──────────────────────────────────────────
    print("\n── Confusion Matrix (rows=actual, cols=predicted) ────────")
    labels = ["negative", "neutral", "positive"]
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    print(f"  {'':12} {'neg':>6} {'neu':>6} {'pos':>6}")
    for label, row in zip(labels, cm):
        print(f"  {label:12} {row[0]:>6} {row[1]:>6} {row[2]:>6}")


if __name__ == "__main__":
    evaluate_model()
