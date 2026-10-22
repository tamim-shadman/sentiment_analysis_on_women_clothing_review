# Atelier Review Intelligence
### Machine Learning Product Recommendation Platform for Women's Clothing Reviews

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black.svg)](https://flask.palletsprojects.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4.2-orange.svg)](https://scikit-learn.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![Test Accuracy](https://img.shields.io/badge/Test%20Accuracy-88.76%25-green.svg)](./MODEL_METHODOLOGY.md)

A machine learning web application that transforms unstructured customer clothing reviews into product-recommendation predictions using **Multinomial Naive Bayes** with unigram **CountVectorizer** feature extraction.

Combines a contemporary **Editorial Fashion Intelligence** design with an explainable ML inference engine, batch CSV processing, real-time token attribution, and session analytics.

---

## Key Features

- **Single-Review Analyzer**: Multiline text editor with live character counters, curated dataset presets, posterior probability distributions, and mathematically exact token attribution chips showing which words pulled toward recommendation or rejection.
- **Batch CSV Engine**: Drag-and-drop CSV upload with automatic review column detection, row validation, high-throughput vector batch inference, interactive sortable/filterable data table, and enriched CSV export.
- **Insights & Pattern Dashboard**: Aggregated recommendation distributions, review depth categorization, and salient vocabulary extraction computed from active session reviews.
- **Model Transparency & Governance**: Complete empirical evaluation reports (88.76% accuracy, 0.9312 F1), verified confusion matrix, mathematical log-odds formulation, and responsible AI interpretation guidelines.
- **Client Session History**: Local browser session tracking with zero third-party telemetry, allowing instant query reloading and history management.
- **Backend Reliability & Health Checks**: Hardened Flask REST API supporting backward-compatible `POST /predict`, bounded `POST /predict/batch`, readiness check `/health`, and empirical metadata endpoint `/api/model-info`.

---

## Verified Machine Learning Performance

Evaluated on an **80/20 stratified train/test split** ($N_{\text{train}} = 18,112$, $N_{\text{test}} = 4,529$) on the 22,641 non-null reviews from the Women's Clothing E-Commerce Reviews dataset:

| Metric | Score | Detail |
|---|---|---|
| **Test Accuracy** | **88.76%** | Overall correct classifications |
| **Precision (Rec)** | **93.43%** | Positive predictive value for recommendation |
| **Recall (Rec)** | **92.80%** | Sensitivity on recommended reviews |
| **F1-Score (Rec)** | **0.9312** | Harmonic mean of precision and recall |
| **ROC-AUC** | **0.9168** | Area under the ROC curve |
| **Vocabulary Size** | **13,673 terms** | Extracted by CountVectorizer |

See [MODEL_METHODOLOGY.md](./MODEL_METHODOLOGY.md) for the complete evaluation breakdown and confusion matrix.

---

## Project Structure

```
├── app.py                         # Hardened Flask REST API backend
├── train_model.py                 # Reproducible model training & evaluation pipeline
├── NB_model.joblib                # Trained Multinomial Naive Bayes model
├── CountVectorizer_model.joblib   # Fitted CountVectorizer unigram dictionary
├── model_evaluation.json          # Verified empirical evaluation metrics
├── sample_reviews_batch.csv       # Curated 30-review sample dataset for testing
├── requirements.txt               # Pinned Python backend dependencies
├── .env.example                   # Environment configuration template
│
├── tests/
│   ├── __init__.py
│   └── test_api.py                # Automated API test suite (7 tests)
│
├── frontend/                      # Modern React + TypeScript + Vite web app
│   ├── src/
│   │   ├── api.ts                 # Typed API client and data contracts
│   │   ├── App.tsx                # Application shell and tab router
│   │   ├── index.css              # Editorial Fashion Intelligence design system
│   │   └── components/
│   │       ├── Header.tsx         # Navigation, health status pill, history trigger
│   │       ├── Footer.tsx         # Editorial footer & governance links
│   │       ├── OverviewView.tsx   # Hero, live sandbox card, workflow steps
│   │       ├── AnalyzerView.tsx   # Multiline editor, token chips, probability bar
│   │       ├── BatchView.tsx      # CSV uploader, batch table, search, export
│   │       ├── InsightsView.tsx   # Distribution charts & salient vocabulary
│   │       ├── MethodologyView.tsx# Dataset stats, confusion matrix, math specs
│   │       └── HistoryDrawer.tsx  # Session history slide-over panel
│   ├── package.json
│   └── vite.config.ts
│
├── PROJECT_IMPLEMENTATION_ROADMAP.md # Detailed tracking across all 12 phases
├── DESIGN_SYSTEM.md                  # Visual tokens, typography, and responsive rules
├── MODEL_METHODOLOGY.md              # Machine learning mathematics & limitations
└── TESTING_AND_DEPLOYMENT.md         # Deployment & testing runbook
```

---

## Quickstart Guide

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/tamim-shadman/sentiment_analysis_on_women_clothing_review.git
cd sentiment_analysis_on_women_clothing_review

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Retrain or regenerate artifacts
python train_model.py

# Run automated tests
python -m unittest discover tests -v

# Start Flask API server
python app.py
```
Backend API will be listening at `http://127.0.0.1:5000`.

### 2. Frontend Setup
```bash
# In a separate terminal window
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## API Reference

### 1. `POST /predict`
Predicts product recommendation for a single review. Maintains full backward compatibility with the legacy API.

**Request**:
```json
{
  "review_text": "I love this gorgeous linen dress! It fits perfectly and breathes nicely."
}
```

**Response**:
```json
{
  "recommended_ind": 1,
  "sentiment_label": "Recommended",
  "probability": {
    "recommended": 0.9985,
    "not_recommended": 0.0015
  },
  "confidence": 0.9985,
  "influential_tokens": {
    "positive": [
      { "token": "perfectly", "count": 1, "weight": 1.649 },
      { "token": "fits", "count": 1, "weight": 1.380 },
      { "token": "love", "count": 1, "weight": 0.756 }
    ],
    "negative": []
  },
  "char_count": 76,
  "model_info": {
    "classifier": "MultinomialNB",
    "vectorizer": "CountVectorizer"
  }
}
```

### 2. `POST /predict/batch`
Vectorizes and predicts multiple reviews simultaneously (up to 1,000 reviews).

**Request**:
```json
{
  "reviews": [
    "Fabulous silhouette and soft fabric.",
    "Tore immediately at zipper, horrible cheap material."
  ]
}
```

### 3. `GET /health`
Returns server reachability and model artifact readiness status (HTTP 200 when ready, HTTP 503 if artifacts missing).

### 4. `GET /api/model-info`
Returns verified empirical evaluation metrics, dataset parameters, and confusion matrix.

---

## Documentation

- [Project Roadmap](./PROJECT_IMPLEMENTATION_ROADMAP.md): Phase-by-phase implementation log.
- [Design System](./DESIGN_SYSTEM.md): Visual direction, color tokens, typography scales, accessibility rules.
- [Model Methodology](./MODEL_METHODOLOGY.md): Mathematical formulation, dataset details, evaluation matrix.
- [Testing & Deployment Guide](./TESTING_AND_DEPLOYMENT.md): Containerization, Vercel, and Render deployment runbook.

---

## License & Credits

Developed with modern Natural Language Processing and Bayesian machine learning techniques.  
Dataset: *Women's Clothing E-Commerce Reviews*.