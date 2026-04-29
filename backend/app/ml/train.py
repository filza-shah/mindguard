# backend/app/ml/train.py
#
# WHAT THIS TRAINS:
# A text classification pipeline for mental health sentiment.
#
# PIPELINE ARCHITECTURE:
#   Raw text
#     → TF-IDF Vectorizer (converts text to numerical features)
#     → Voting Classifier (ensemble of 3 models)
#         ├── Logistic Regression  (good baseline, interpretable)
#         ├── Linear SVC           (strong for text classification)
#         └── Naive Bayes          (fast, works well with TF-IDF)
#     → Label (positive / negative / neutral)
#
# WHY AN ENSEMBLE?
# Each model has different strengths. Voting combines them — if 2/3 agree
# on "negative", that's more reliable than any single model alone.
# This is a standard technique used in production ML systems.
#
# HOW TO RUN:
#   cd backend
#   python -m app.ml.train
#
# OUTPUT:
#   app/ml/models/sentiment_model.joblib  ← the trained pipeline
#   app/ml/models/model_metadata.json     ← metrics for model card

import os
import json
import joblib
import numpy as np
from datetime import datetime, timezone

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import ComplementNB
from sklearn.ensemble import VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    accuracy_score,
)

from app.ml.dataset import get_train_test_split


def train_model(save_path: str = "app/ml/models/sentiment_model.joblib") -> dict:
    """
    Train the sentiment classification pipeline and save it to disk.

    Returns a dict of evaluation metrics.
    """
    print("=" * 60)
    print("MindGuard Sentiment Classifier Training")
    print("=" * 60)

    # ── 1. Load Data ──────────────────────────────────────────────
    print("\n📦 Loading dataset...")
    train_df, test_df = get_train_test_split(test_size=0.2, random_seed=42)

    X_train = train_df["text"].tolist()
    y_train = train_df["label"].tolist()
    X_test = test_df["text"].tolist()
    y_test = test_df["label"].tolist()

    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples:     {len(X_test)}")
    print(f"  Classes: {sorted(set(y_train))}")

    # ── 2. Build Pipeline ─────────────────────────────────────────
    print("\n🔧 Building pipeline...")

    # TF-IDF converts text to numerical feature vectors.
    # ngram_range=(1,2) means it captures both single words AND pairs of words.
    # "not happy" as a bigram is much more informative than "not" + "happy" separately.
    tfidf = TfidfVectorizer(
        ngram_range=(1, 2),          # unigrams + bigrams
        max_features=10_000,         # top 10k most informative features
        min_df=1,                    # include terms appearing in at least 1 doc
        sublinear_tf=True,           # apply log normalization to term frequencies
        strip_accents="unicode",
        analyzer="word",
        token_pattern=r"\w{2,}",     # only tokens with 2+ characters
    )

    # Three classifiers — each handles different patterns well
    lr = LogisticRegression(
        C=1.0,
        max_iter=1000,
        class_weight="balanced",     # handles class imbalance
        random_state=42,
    )

    # LinearSVC doesn't natively support predict_proba, so we wrap it
    svc = CalibratedClassifierCV(
        LinearSVC(C=0.5, max_iter=2000, class_weight="balanced", random_state=42)
    )

    nb = ComplementNB(alpha=0.3)     # Complement NB works better than standard NB for imbalanced text

    # Voting ensemble — "soft" voting averages the predicted probabilities
    ensemble = VotingClassifier(
        estimators=[
            ("lr", lr),
            ("svc", svc),
            ("nb", nb),
        ],
        voting="soft",               # average probabilities (better than hard majority vote)
        weights=[3, 2, 1],           # LR gets more weight (best individual performance)
    )

    # Full pipeline: TF-IDF → Ensemble
    pipeline = Pipeline([
        ("tfidf", tfidf),
        ("classifier", ensemble),
    ])

    # ── 3. Train ──────────────────────────────────────────────────
    print("\n🏋️  Training...")
    pipeline.fit(X_train, y_train)
    print("  Training complete!")

    # ── 4. Evaluate ───────────────────────────────────────────────
    print("\n📊 Evaluating on test set...")
    y_pred = pipeline.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average="macro")
    f1_weighted = f1_score(y_test, y_pred, average="weighted")

    print(f"\n  Accuracy:    {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"  F1 (macro):  {f1_macro:.4f}")
    print(f"  F1 (weighted): {f1_weighted:.4f}")
    print("\n  Per-class report:")
    print(classification_report(y_test, y_pred, target_names=["negative", "neutral", "positive"]))

    print("  Confusion Matrix (rows=actual, cols=predicted):")
    cm = confusion_matrix(y_test, y_pred, labels=["negative", "neutral", "positive"])
    print(f"  {'':10} {'neg':>6} {'neu':>6} {'pos':>6}")
    for label, row in zip(["negative", "neutral", "positive"], cm):
        print(f"  {label:10} {row[0]:>6} {row[1]:>6} {row[2]:>6}")

    # ── 5. Save Model ─────────────────────────────────────────────
    print(f"\n💾 Saving model to {save_path}...")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    joblib.dump(pipeline, save_path)
    print(f"  Model size: {os.path.getsize(save_path) / 1024:.1f} KB")

    # ── 6. Save Metadata (for Model Card) ─────────────────────────
    metadata = {
        "model_name": "MindGuard Sentiment Classifier v1.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "architecture": "TF-IDF + Voting Ensemble (LR + LinearSVC + ComplementNB)",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": ["negative", "neutral", "positive"],
        "metrics": {
            "accuracy": round(accuracy, 4),
            "f1_macro": round(f1_macro, 4),
            "f1_weighted": round(f1_weighted, 4),
        },
        "hyperparameters": {
            "tfidf_ngram_range": "(1, 2)",
            "tfidf_max_features": 10000,
            "lr_C": 1.0,
            "svc_C": 0.5,
            "nb_alpha": 0.3,
            "ensemble_weights": [3, 2, 1],
        },
        "intended_use": "Sentiment analysis of free-text mood journal entries for youth mental health tracking",
        "limitations": "Trained on a small curated dataset. May not generalise to all dialects or expressions.",
    }

    metadata_path = save_path.replace(".joblib", "_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Metadata saved to {metadata_path}")

    print("\n✅ Training complete!")
    return metadata


if __name__ == "__main__":
    metadata = train_model()

    print("\n" + "=" * 60)
    print("MODEL CARD SUMMARY")
    print("=" * 60)
    print(f"Model:      {metadata['model_name']}")
    print(f"Accuracy:   {metadata['metrics']['accuracy']*100:.1f}%")
    print(f"F1 (macro): {metadata['metrics']['f1_macro']:.4f}")
    print(f"Trained on: {metadata['training_samples']} samples")
    print(f"Tested on:  {metadata['test_samples']} samples")
