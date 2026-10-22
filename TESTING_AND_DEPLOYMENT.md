# Testing & Deployment Guide
## Women's Clothing Review Intelligence

Comprehensive guide for local development, automated testing, containerization, and production deployment across Vercel and Render/Cloud Run.

---

### 1. Prerequisites & Environment Setup

#### Requirements
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ (tested on Node.js 24 LTS)
- **Package Managers**: `pip` and `npm`

#### Python Dependencies
Install backend dependencies:
```bash
pip install -r requirements.txt
```

Where `requirements.txt` includes:
```
Flask>=3.0.0
Flask-Cors>=4.0.0
scikit-learn>=1.4.0
joblib>=1.3.0
numpy>=1.26.0
pandas>=2.2.0
pytest>=8.0.0
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

---

### 2. Environment Variables

Create `.env` in the root (for backend) and `frontend/.env` (for frontend):

#### Backend (`.env`)
```bash
PORT=5000
FLASK_ENV=development
CORS_ORIGIN=*
MODEL_PATH=NB_model.joblib
VECTORIZER_PATH=CountVectorizer_model.joblib
```

#### Frontend (`frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000
```

For production deployment on Vercel, set `VITE_API_BASE_URL` to the public URL of your deployed Flask API (e.g. `https://your-flask-api.onrender.com`).

---

### 3. Local Development

#### A. Starting the Flask API Server
In a terminal window from project root:
```bash
python app.py
```
The API server will start at `http://127.0.0.1:5000`.
Health endpoint: `http://127.0.0.1:5000/health`.

#### B. Starting the React Vite Development Server
In another terminal window:
```bash
cd frontend
npm run dev
```
The frontend dev server will launch at `http://localhost:5173`.

---

### 4. Automated Testing

#### Run Backend API & Inference Tests
From repository root:
```bash
python -m pytest tests/ -v
```
Tests verify:
- `POST /predict`: Normal flow, backward compatibility, probability calculation, token influence extraction.
- `POST /predict/batch`: Bounded array inputs, high-throughput vectorization, row mapping integrity.
- `GET /health`: Model and vectorizer readiness, service status.
- `GET /api/model-info`: Accurate empirical metrics from `model_evaluation.json`.
- Validation errors: Empty inputs, malformed JSON, strings exceeding max length, non-string review text.

#### Run Frontend Build & Typechecks
```bash
cd frontend
npm run build
```
Runs `tsc -b` and `vite build` to verify zero type errors and asset packaging.

---

### 5. Production Deployment

#### Frontend Deployment (Vercel)
The repository includes a modern React Vite frontend located in `frontend/`.
To deploy to Vercel:
1. Connect repository on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: The URL of your live Flask backend.

#### Backend Deployment (Render / Docker / Google Cloud Run)
1. **Model Artifacts**: Ensure `NB_model.joblib` and `CountVectorizer_model.joblib` are present in the build or downloaded during Docker build/start.
2. **Start Command**:
   ```bash
   gunicorn -w 2 -b 0.0.0.0:$PORT app:app
   ```
3. Set Environment Variables:
   - `CORS_ORIGIN`: `https://your-vercel-domain.vercel.app` (or `*` during initial verification).
