"""
Flask REST API Backend for Women's Clothing Review Intelligence
Provides endpoints for:
1. Binary recommendation prediction (MultinomialNB) with token-level log-odds attribution
2. Separate 3-class sentiment polarity analysis (Negative, Neutral, Positive)
3. Aspect & topic intelligence with sentence evidence extraction
4. Counterfactual / what-if prediction testing
5. High-throughput bounded batch inference
6. Model comparison benchmarks & health monitoring
"""

import os
import re
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('review_intel_api')

app = Flask(__name__)

cors_origin = os.environ.get('CORS_ORIGIN', '*')
CORS(app, resources={r"/*": {"origins": cors_origin}})

# Paths
MODEL_PATH = os.environ.get('MODEL_PATH', 'NB_model.joblib')
VECTORIZER_PATH = os.environ.get('VECTORIZER_PATH', 'CountVectorizer_model.joblib')
METRICS_PATH = os.environ.get('METRICS_PATH', 'model_evaluation.json')
COMPARISON_PATH = os.environ.get('COMPARISON_PATH', 'model_comparison.json')

SENTIMENT_MODEL_PATH = os.environ.get('SENTIMENT_MODEL_PATH', 'sentiment_model.joblib')
SENTIMENT_VEC_PATH = os.environ.get('SENTIMENT_VEC_PATH', 'sentiment_vectorizer.joblib')
SENTIMENT_METRICS_PATH = os.environ.get('SENTIMENT_METRICS_PATH', 'sentiment_model_evaluation.json')

# Global references
model = None
vectorizer = None
model_metrics = None
model_comparison = None
vocabulary_words = None

sentiment_model = None
sentiment_vectorizer = None
sentiment_metrics = None

ASPECT_TAXONOMY = {
    'Fit & Sizing': ['fit', 'fits', 'fitted', 'fitting', 'size', 'sizing', 'tight', 'loose', 'small', 'large', 'length', 'waist', 'shoulder', 'shoulders', 'sleeve', 'sleeves', 'petite', 'bust', 'hips', 'torso', 'inseam', 'short', 'tall', 'snug'],
    'Fabric & Material': ['fabric', 'material', 'cotton', 'silk', 'linen', 'wool', 'soft', 'scratchy', 'synthetic', 'breathable', 'lining', 'sheer', 'drape', 'texture', 'knit', 'polyester', 'rayon', 'chiffon', 'jersey', 'denim'],
    'Quality & Durability': ['quality', 'stitch', 'stitches', 'stitching', 'seam', 'seams', 'durable', 'durability', 'shrunk', 'shrink', 'wash', 'washed', 'tore', 'tear', 'zipper', 'button', 'buttons', 'hem', 'rip', 'pilling', 'frayed'],
    'Style & Cut': ['style', 'cut', 'flattering', 'gorgeous', 'pretty', 'cute', 'chic', 'pattern', 'print', 'color', 'colors', 'silhouette', 'neckline', 'vibrant', 'compliments', 'elegant', 'design', 'v-neck', 'waisted'],
    'Comfort': ['comfort', 'comfortable', 'comfy', 'cozy', 'itchy', 'rough', 'stiff', 'heavy', 'lightweight', 'breathable', 'softness', 'uncomfortable', 'scratchy'],
    'Value & Price': ['price', 'worth', 'expensive', 'cheap', 'value', 'cost', 'sale', 'overpriced', 'deal', 'bargain', 'penny', 'discount']
}

def load_artifacts():
    global model, vectorizer, model_metrics, model_comparison, vocabulary_words
    global sentiment_model, sentiment_vectorizer, sentiment_metrics
    try:
        # 1. Recommendation Model
        if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
            model = joblib.load(MODEL_PATH)
            vectorizer = joblib.load(VECTORIZER_PATH)
            vocabulary_words = np.array(vectorizer.get_feature_names_out())
            logger.info("Successfully loaded Recommendation model & CountVectorizer.")
            
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'r') as f:
                model_metrics = json.load(f)

        if os.path.exists(COMPARISON_PATH):
            with open(COMPARISON_PATH, 'r') as f:
                model_comparison = json.load(f)
                
        # 2. Sentiment Polarity Model
        if os.path.exists(SENTIMENT_MODEL_PATH) and os.path.exists(SENTIMENT_VEC_PATH):
            sentiment_model = joblib.load(SENTIMENT_MODEL_PATH)
            sentiment_vectorizer = joblib.load(SENTIMENT_VEC_PATH)
            logger.info("Successfully loaded 3-Class Sentiment model & TfidfVectorizer.")
            
        if os.path.exists(SENTIMENT_METRICS_PATH):
            with open(SENTIMENT_METRICS_PATH, 'r') as f:
                sentiment_metrics = json.load(f)

    except Exception as e:
        logger.error(f"Error loading artifacts: {e}", exc_info=True)

load_artifacts()

def compute_token_influence(review_vector, max_tokens=10):
    """
    Computes mathematically exact token-level log-odds contribution for MultinomialNB:
    Delta_w = log P(w | class 1) - log P(w | class 0)
    """
    if model is None or vectorizer is None or vocabulary_words is None:
        return {"positive": [], "negative": [], "all_tokens_map": {}}
    
    indices = review_vector.indices
    if len(indices) == 0:
        return {"positive": [], "negative": [], "all_tokens_map": {}}
        
    counts = review_vector.data
    log_diff = model.feature_log_prob_[1][indices] - model.feature_log_prob_[0][indices]
    
    token_weights = []
    token_map = {}
    for idx, token_idx in enumerate(indices):
        token_str = str(vocabulary_words[token_idx])
        w = round(float(log_diff[idx]), 3)
        c = int(counts[idx])
        token_weights.append({
            "token": token_str,
            "count": c,
            "weight": w
        })
        token_map[token_str] = w
        
    positives = sorted([t for t in token_weights if t["weight"] > 0.05], key=lambda x: x["weight"], reverse=True)[:max_tokens]
    negatives = sorted([t for t in token_weights if t["weight"] < -0.05], key=lambda x: x["weight"])[:max_tokens]
    
    return {
        "positive": positives,
        "negative": negatives,
        "all_tokens_map": token_map
    }

def extract_aspect_evidence(text):
    """
    Extracts apparel domain aspects with matched keywords and sentence-level evidence snippets.
    """
    sentences = [s.strip() for s in re.split(r'[.!?\n]+', text) if s.strip()]
    detected = []
    
    for aspect, keywords in ASPECT_TAXONOMY.items():
        matches = []
        snippets = []
        for s in sentences:
            s_lower = s.lower()
            matched_in_sent = [k for k in keywords if re.search(r'\b' + re.escape(k) + r'\b', s_lower)]
            if matched_in_sent:
                matches.extend(matched_in_sent)
                snippets.append(s)
                
        if matches:
            detected.append({
                "aspect": aspect,
                "keywords": sorted(list(set(matches))),
                "mentions": len(matches),
                "snippets": snippets[:3] # Up to 3 supporting snippets
            })
            
    return detected

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Readiness probe checking server, recommendation model, and sentiment model."""
    model_ready = (model is not None and vectorizer is not None)
    sentiment_ready = (sentiment_model is not None and sentiment_vectorizer is not None)
    status_code = 200 if model_ready else 503
    return jsonify({
        "status": "healthy" if model_ready else "degraded",
        "service": "womens_clothing_review_intelligence",
        "version": "2.2.0",
        "model_loaded": model_ready,
        "vectorizer_loaded": model_ready,
        "sentiment_model_loaded": sentiment_ready,
        "model_type": "MultinomialNB",
        "vectorizer_type": "CountVectorizer"
    }), status_code

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Returns verified dataset metadata, baseline metrics, and confusion matrix."""
    if model_metrics is not None:
        return jsonify({
            "status": "success",
            "model_ready": model is not None,
            "data": model_metrics
        })
    return jsonify({
        "status": "partial",
        "model_ready": model is not None,
        "message": "Evaluation metrics not found. Run train_model.py."
    }), 200

@app.route('/api/model-comparison', methods=['GET'])
def get_model_comparison():
    """Returns empirical benchmark comparisons across MultinomialNB, Logistic Regression, and Linear SVM, with error analysis."""
    if model_comparison is not None:
        return jsonify({
            "status": "success",
            "data": model_comparison
        })
    return jsonify({
        "status": "error",
        "message": "Model comparison data not found. Run train_model.py."
    }), 404

@app.route('/api/sentiment-model-info', methods=['GET'])
def get_sentiment_model_info():
    """Returns evaluation metrics for the separate 3-class sentiment polarity model."""
    if sentiment_metrics is not None:
        return jsonify({
            "status": "success",
            "data": sentiment_metrics
        })
    return jsonify({
        "status": "error",
        "message": "Sentiment model metrics not found. Run train_model.py."
    }), 404

@app.route('/predict', methods=['POST'])
def predict():
    """
    Single-review recommendation prediction endpoint.
    Maintains 100% backward compatibility: receives {"review_text": "..."}, returns {"recommended_ind": 0|1}.
    Provides rich extensions: probabilities, confidence, token-level log-odds attribution, aspect tags.
    """
    if model is None or vectorizer is None:
        return jsonify({"error": "Model artifacts not loaded."}), 503

    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Malformed or empty JSON body'}), 400

        review_text = data.get('review_text')
        if review_text is None or not isinstance(review_text, str):
            return jsonify({'error': 'review_text must be a non-empty string'}), 400

        clean_text = review_text.strip()
        if not clean_text:
            return jsonify({'error': 'review_text cannot be empty'}), 400

        if len(clean_text) > 10000:
            return jsonify({'error': 'Review text exceeds maximum allowed length (10,000 characters)'}), 400

        # Vectorize & Predict Recommendation
        review_vector = vectorizer.transform([clean_text])
        predicted_recommendation = model.predict(review_vector)
        predicted_proba = model.predict_proba(review_vector)[0]
        rec_val = int(predicted_recommendation[0])
        
        # Exact Token Attribution
        token_info = compute_token_influence(review_vector)
        
        # Aspect Discovery
        aspects = extract_aspect_evidence(clean_text)

        return jsonify({
            'recommended_ind': rec_val,
            'sentiment_label': 'Recommended' if rec_val == 1 else 'Not Recommended',
            'probability': {
                'recommended': round(float(predicted_proba[1]), 4),
                'not_recommended': round(float(predicted_proba[0]), 4)
            },
            'confidence': round(float(max(predicted_proba)), 4),
            'influential_tokens': {
                'positive': token_info['positive'],
                'negative': token_info['negative']
            },
            'token_weights_map': token_info['all_tokens_map'],
            'detected_aspects': aspects,
            'char_count': len(clean_text),
            'model_info': {
                'classifier': 'MultinomialNB',
                'vectorizer': 'CountVectorizer'
            }
        }), 200

    except Exception as e:
        logger.error(f"Error in /predict: {e}", exc_info=True)
        return jsonify({'error': 'An internal error occurred during prediction.'}), 500

@app.route('/predict/sentiment', methods=['POST'])
def predict_sentiment():
    """
    Separate 3-Class Sentiment Polarity Prediction (Negative, Neutral, Positive).
    Trained on customer rating labels (1-2: Negative, 3: Neutral, 4-5: Positive).
    Completely separate from binary recommendation prediction.
    """
    if sentiment_model is None or sentiment_vectorizer is None:
        return jsonify({"error": "Sentiment model artifacts not loaded."}), 503

    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Malformed or empty JSON body'}), 400

        review_text = data.get('review_text')
        if not review_text or not isinstance(review_text, str):
            return jsonify({'error': 'review_text must be a non-empty string'}), 400

        clean_text = review_text.strip()
        if not clean_text:
            return jsonify({'error': 'review_text cannot be empty'}), 400

        vec = sentiment_vectorizer.transform([clean_text])
        pred_class = int(sentiment_model.predict(vec)[0])
        probas = sentiment_model.predict_proba(vec)[0]

        class_map = {0: 'Negative', 1: 'Neutral', 2: 'Positive'}
        sentiment_label = class_map[pred_class]

        return jsonify({
            'sentiment_polarity': sentiment_label,
            'class_id': pred_class,
            'confidence': round(float(max(probas)), 4),
            'probability': {
                'negative': round(float(probas[0]), 4),
                'neutral': round(float(probas[1]), 4),
                'positive': round(float(probas[2]), 4)
            },
            'model_info': {
                'classifier': 'LogisticRegression (Balanced)',
                'vectorizer': 'TfidfVectorizer'
            }
        }), 200

    except Exception as e:
        logger.error(f"Error in /predict/sentiment: {e}", exc_info=True)
        return jsonify({'error': 'An error occurred during sentiment classification.'}), 500

@app.route('/predict/aspects', methods=['POST'])
def predict_aspects():
    """
    Dedicated Aspect & Topic Extraction endpoint.
    Extracts clothing dimensions (Fit, Fabric, Quality, Style, Comfort, Price) with textual evidence.
    """
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Malformed or empty JSON body'}), 400

        review_text = data.get('review_text')
        if not review_text or not isinstance(review_text, str):
            return jsonify({'error': 'review_text must be a non-empty string'}), 400

        aspects = extract_aspect_evidence(review_text.strip())
        return jsonify({
            "status": "success",
            "aspect_count": len(aspects),
            "aspects": aspects
        }), 200

    except Exception as e:
        logger.error(f"Error in /predict/aspects: {e}", exc_info=True)
        return jsonify({'error': 'An error occurred during aspect extraction.'}), 500

@app.route('/predict/counterfactual', methods=['POST'])
def predict_counterfactual():
    """
    Counterfactual / What-If Testing endpoint.
    Compares baseline review prediction against a user-modified version in real time.
    """
    if model is None or vectorizer is None:
        return jsonify({"error": "Model artifacts not loaded."}), 503

    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Malformed or empty JSON body'}), 400

        orig_text = data.get('original_text', '').strip()
        mod_text = data.get('modified_text', '').strip()

        if not orig_text or not mod_text:
            return jsonify({'error': 'Both original_text and modified_text are required'}), 400

        # Run inference on both
        orig_vec = vectorizer.transform([orig_text])
        mod_vec = vectorizer.transform([mod_text])

        orig_pred = int(model.predict(orig_vec)[0])
        orig_proba = model.predict_proba(orig_vec)[0]

        mod_pred = int(model.predict(mod_vec)[0])
        mod_proba = model.predict_proba(mod_vec)[0]

        prob_delta = round(float(mod_proba[1] - orig_proba[1]), 4)

        return jsonify({
            "status": "success",
            "original": {
                "recommended_ind": orig_pred,
                "label": "Recommended" if orig_pred == 1 else "Not Recommended",
                "prob_recommended": round(float(orig_proba[1]), 4),
                "prob_not_recommended": round(float(orig_proba[0]), 4)
            },
            "modified": {
                "recommended_ind": mod_pred,
                "label": "Recommended" if mod_pred == 1 else "Not Recommended",
                "prob_recommended": round(float(mod_proba[1]), 4),
                "prob_not_recommended": round(float(mod_proba[0]), 4)
            },
            "probability_delta": prob_delta,
            "prediction_flipped": orig_pred != mod_pred
        }), 200

    except Exception as e:
        logger.error(f"Error in /predict/counterfactual: {e}", exc_info=True)
        return jsonify({'error': 'An error occurred during counterfactual analysis.'}), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Bounded batch prediction endpoint.
    Transforms up to 1,000 reviews together for sub-50ms vectorization.
    Optionally computes 3-class sentiment and aspect tags for full batch rows.
    """
    if model is None or vectorizer is None:
        return jsonify({"error": "Model artifacts not loaded."}), 503

    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.get_json(silent=True)
        if not data:
            return jsonify({'error': 'Malformed JSON body'}), 400

        raw_reviews = data.get('reviews') or data.get('items')
        if not isinstance(raw_reviews, list):
            return jsonify({'error': "Expected a list under 'reviews' key"}), 400

        if len(raw_reviews) == 0:
            return jsonify({'error': 'Empty reviews list provided'}), 400

        if len(raw_reviews) > 1000:
            return jsonify({'error': 'Batch size exceeds maximum limit of 1,000 reviews'}), 400

        processed_inputs = []
        for idx, item in enumerate(raw_reviews):
            text = ""
            row_id = idx + 1
            meta = {}
            if isinstance(item, str):
                text = item
            elif isinstance(item, dict):
                text = str(item.get('review_text', item.get('text', '')))
                row_id = item.get('id', item.get('row_id', idx + 1))
                meta = {k: v for k, v in item.items() if k not in ['review_text', 'text', 'id', 'row_id']}
            
            clean = text.strip() if text else ""
            processed_inputs.append({
                "row_id": row_id,
                "text": clean,
                "meta": meta,
                "is_valid": len(clean) > 0 and len(clean) <= 10000
            })

        valid_indices = [i for i, r in enumerate(processed_inputs) if r["is_valid"]]
        valid_texts = [processed_inputs[i]["text"] for i in valid_indices]

        results = [None] * len(processed_inputs)

        if valid_texts:
            # Batch Recommendation Transform
            batch_vectors = vectorizer.transform(valid_texts)
            batch_preds = model.predict(batch_vectors)
            batch_probas = model.predict_proba(batch_vectors)

            # Batch Sentiment Transform if model available
            sent_preds = None
            if sentiment_model is not None and sentiment_vectorizer is not None:
                sent_vectors = sentiment_vectorizer.transform(valid_texts)
                sent_preds = sentiment_model.predict(sent_vectors)

            sentiment_labels = {0: 'Negative', 1: 'Neutral', 2: 'Positive'}

            for local_idx, orig_idx in enumerate(valid_indices):
                rec_val = int(batch_preds[local_idx])
                proba = batch_probas[local_idx]
                row_text = processed_inputs[orig_idx]["text"]
                
                # Aspect tags
                row_aspects = [a["aspect"] for a in extract_aspect_evidence(row_text)]

                results[orig_idx] = {
                    "row_id": processed_inputs[orig_idx]["row_id"],
                    "review_text": row_text,
                    "metadata": processed_inputs[orig_idx]["meta"],
                    "status": "success",
                    "recommended_ind": rec_val,
                    "sentiment_label": "Recommended" if rec_val == 1 else "Not Recommended",
                    "sentiment_polarity": sentiment_labels[int(sent_preds[local_idx])] if sent_preds is not None else "Unclassified",
                    "detected_aspects": row_aspects,
                    "probability": {
                        "recommended": round(float(proba[1]), 4),
                        "not_recommended": round(float(proba[0]), 4)
                    },
                    "confidence": round(float(max(proba)), 4)
                }

        for i, item in enumerate(processed_inputs):
            if not item["is_valid"]:
                results[i] = {
                    "row_id": item["row_id"],
                    "review_text": item["text"],
                    "metadata": item["meta"],
                    "status": "invalid_empty_or_oversized",
                    "recommended_ind": None,
                    "sentiment_label": "Unprocessed",
                    "sentiment_polarity": "Unprocessed",
                    "detected_aspects": [],
                    "probability": None,
                    "confidence": None
                }

        valid_count = len(valid_indices)
        rec_count = sum(1 for r in results if r["recommended_ind"] == 1)
        not_rec_count = sum(1 for r in results if r["recommended_ind"] == 0)

        return jsonify({
            "status": "success",
            "total_submitted": len(processed_inputs),
            "valid_processed": valid_count,
            "invalid_count": len(processed_inputs) - valid_count,
            "summary": {
                "recommended_count": rec_count,
                "not_recommended_count": not_rec_count,
                "recommended_pct": round((rec_count / valid_count * 100), 2) if valid_count > 0 else 0,
                "not_recommended_pct": round((not_rec_count / valid_count * 100), 2) if valid_count > 0 else 0
            },
            "predictions": results
        }), 200

    except Exception as e:
        logger.error(f"Error in /predict/batch: {e}", exc_info=True)
        return jsonify({'error': 'An internal error occurred during batch processing.'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
