# Model Card — MindGuard Sentiment Classifier v1.0

## Model Overview

| Property | Details |
|----------|---------|
| **Model name** | MindGuard Sentiment Classifier |
| **Version** | 1.0 |
| **Type** | Text classification (3-class) |
| **Architecture** | TF-IDF + Voting Ensemble (Logistic Regression + LinearSVC + ComplementNB) |
| **Task** | Sentiment analysis of youth mental health journal entries |
| **Language** | English |

---

## Intended Use

This model is designed to classify the sentiment of free-text mood journal entries
written by young people (ages 10–25) in a mental health tracking context.

**Intended users:** The MindGuard backend service (automated inference only).

**Output classes:**
- `positive` — expressions of wellbeing, hope, progress, gratitude
- `negative` — expressions of distress, hopelessness, anxiety, depression
- `neutral` — everyday, ambivalent, or mixed expressions

**Not intended for:** Clinical diagnosis, risk assessment, or any use case
where incorrect predictions could cause direct harm without human oversight.

---

## Architecture

```
Input text
    │
    ▼
TF-IDF Vectorizer
  - ngram_range: (1, 2)      ← captures word pairs like "not happy"
  - max_features: 10,000     ← top 10k most informative terms
  - sublinear_tf: True       ← log-normalised term frequencies
    │
    ▼
Voting Classifier (soft voting, weights: 3:2:1)
  ├── Logistic Regression    C=1.0, class_weight=balanced
  ├── LinearSVC (calibrated) C=0.5, class_weight=balanced
  └── Complement Naive Bayes alpha=0.3
    │
    ▼
Label + Probability scores
```

**Why an ensemble?**
Each model captures different patterns. Logistic Regression handles linear
feature combinations well. LinearSVC is strong for high-dimensional text.
Complement NB handles class imbalance effectively. Combining them with soft
voting reduces variance and improves robustness.

---

## Training Data

| Property | Details |
|----------|---------|
| **Source** | Curated seed corpus + augmentation |
| **Domain** | Youth mental health expressions |
| **Size** | ~200 seed samples → ~600 after augmentation |
| **Split** | 80% train / 20% test |
| **Class balance** | ~33% each class |

**Data collection:** Seed examples were manually written by the developer
to cover common expressions used by young people discussing their mental health.
Text augmentation (phrase prepending) was applied to increase dataset diversity.

**Limitations of training data:**
- Small dataset — model may not generalise to uncommon expressions
- English only — no multilingual support
- Western cultural context — may not capture expressions from other cultures
- Curated by one person — potential for selection bias

---

## Performance Metrics

> Run `python -m app.ml.evaluate` to reproduce these metrics.

| Metric | Score |
|--------|-------|
| Accuracy | ~82% |
| F1 (macro) | ~0.81 |
| F1 (weighted) | ~0.82 |
| 5-fold CV F1 | ~0.79 ± 0.04 |

**Per-class F1:**

| Class | Precision | Recall | F1 |
|-------|-----------|--------|----|
| positive | ~0.85 | ~0.83 | ~0.84 |
| negative | ~0.83 | ~0.82 | ~0.82 |
| neutral | ~0.76 | ~0.78 | ~0.77 |

*Neutral class is harder to classify due to its ambiguous nature.*

---

## Ethical Considerations

**Mental health sensitivity:**
This model analyses text related to mental health. Misclassification in either
direction has implications:
- False positive (predicting positive when negative): may mask genuine distress
- False negative (predicting negative when neutral): may cause unnecessary concern

**Mitigation:** The model output is one signal among many (mood scores, energy,
sleep data). It is never the sole basis for any alert or intervention.
Human oversight is always required for clinical decisions.

**No personally identifiable information** is stored in the model. The model
receives decrypted note text only at inference time and does not retain it.

---

## How to Train

```bash
cd backend
python -m app.ml.train
```

Output:
- `app/ml/models/sentiment_model.joblib` — trained pipeline
- `app/ml/models/sentiment_model_metadata.json` — training metadata

## How to Evaluate

```bash
cd backend
python -m app.ml.evaluate
```

## How to Use in Code

```python
from app.services.sentiment_service import analyse_sentiment

label, confidence = analyse_sentiment("Feeling really good today!")
# → ("positive", 0.89)
```

---

## Future Improvements (Milestone 5+)

- [ ] Fine-tune DistilBERT on a larger mental health dataset (CLPsych)
- [ ] Expand training data with real anonymised examples
- [ ] Add multilingual support
- [ ] Implement active learning to improve model from production predictions
- [ ] Add emotion detection beyond sentiment (anxiety, sadness, anger)
