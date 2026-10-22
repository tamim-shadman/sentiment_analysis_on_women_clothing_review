"""
Comprehensive Model Training, Benchmarking & Evaluation Pipeline
Women's Clothing Review Intelligence

1. Baseline Binary Recommendation Model (MultinomialNB + CountVectorizer)
2. Model Comparison Lab (MultinomialNB vs Logistic Regression vs Calibrated Linear SVM)
3. Separate 3-Class Sentiment Polarity Model (TfidfVectorizer + Balanced Logistic Regression)
4. Error Analysis & Representative Failure Case Discovery
"""

import json
import os
import time
import urllib.request
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score
)

DATASET_URL = "https://raw.githubusercontent.com/gracenzmy/experiment/main/Womens%20Clothing%20E-Commerce%20Reviews.csv"
DATASET_PATH = "Womens_Clothing_E-Commerce_Reviews.csv"

def ensure_dataset():
    if os.path.exists(DATASET_PATH):
        return DATASET_PATH
    if os.path.exists("data_sample.csv"):
        return "data_sample.csv"
    print(f"Downloading dataset from {DATASET_URL}...")
    urllib.request.urlretrieve(DATASET_URL, DATASET_PATH)
    return DATASET_PATH

def train_and_benchmark():
    dataset_file = ensure_dataset()
    df = pd.read_csv(dataset_file)
    total_raw_rows = len(df)
    total_columns = len(df.columns)
    
    # Non-null reviews subset
    clean_df = df.dropna(subset=['Review Text']).copy()
    clean_df.rename(columns={'Review Text': 'review_text', 'Recommended IND': 'recommended_ind'}, inplace=True)
    clean_rows = len(clean_df)
    
    print(f"Total raw rows: {total_raw_rows}")
    print(f"Non-null review rows: {clean_rows}")
    
    # =========================================================================
    # PART 1: BINARY RECOMMENDATION MODEL (DEPLOYED BASELINE)
    # =========================================================================
    X = clean_df['review_text']
    y = clean_df['recommended_ind'].astype(int)
    
    # Fixed seed stratified 80/20 split
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, clean_df.index, test_size=0.2, random_state=42, stratify=y
    )
    
    vectorizer = CountVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    nb_model = MultinomialNB()
    t0 = time.time()
    nb_model.fit(X_train_vec, y_train)
    nb_train_time = time.time() - t0
    
    y_pred_nb = nb_model.predict(X_test_vec)
    y_proba_nb = nb_model.predict_proba(X_test_vec)[:, 1]
    
    acc_nb = float(accuracy_score(y_test, y_pred_nb))
    prec_nb = float(precision_score(y_test, y_pred_nb))
    rec_nb = float(recall_score(y_test, y_pred_nb))
    f1_nb = float(f1_score(y_test, y_pred_nb))
    auc_nb = float(roc_auc_score(y_test, y_proba_nb))
    cm_nb = confusion_matrix(y_test, y_pred_nb).tolist()
    report_nb = classification_report(y_test, y_pred_nb, output_dict=True)
    
    metrics = {
        "model_name": "MultinomialNB",
        "vectorizer": "CountVectorizer",
        "dataset_name": "Women's Clothing E-Commerce Reviews",
        "total_rows": int(total_raw_rows),
        "total_columns": int(total_columns),
        "valid_review_rows": int(clean_rows),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "vocabulary_size": int(len(vectorizer.vocabulary_)),
        "class_distribution": {
            "recommended_1": int((y == 1).sum()),
            "not_recommended_0": int((y == 0).sum())
        },
        "evaluation_metrics": {
            "accuracy": round(acc_nb, 4),
            "precision": round(prec_nb, 4),
            "recall": round(rec_nb, 4),
            "f1_score": round(f1_nb, 4),
            "roc_auc": round(auc_nb, 4),
            "confusion_matrix": {
                "true_negative": int(cm_nb[0][0]),
                "false_positive": int(cm_nb[0][1]),
                "false_negative": int(cm_nb[1][0]),
                "true_positive": int(cm_nb[1][1])
            },
            "class_0_metrics": {
                "precision": round(report_nb['0']['precision'], 4),
                "recall": round(report_nb['0']['recall'], 4),
                "f1_score": round(report_nb['0']['f1-score'], 4),
                "support": int(report_nb['0']['support'])
            },
            "class_1_metrics": {
                "precision": round(report_nb['1']['precision'], 4),
                "recall": round(report_nb['1']['recall'], 4),
                "f1_score": round(report_nb['1']['f1-score'], 4),
                "support": int(report_nb['1']['support'])
            }
        }
    }
    
    joblib.dump(nb_model, 'NB_model.joblib')
    joblib.dump(vectorizer, 'CountVectorizer_model.joblib')
    with open('model_evaluation.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    print("Baseline MultinomialNB saved.")

    # =========================================================================
    # PART 2: MODEL COMPARISON LAB (BENCHMARKING & ERROR ANALYSIS)
    # =========================================================================
    print("\nBenchmarking candidate models on identical test split...")
    candidate_models = {
        "MultinomialNB (Baseline)": nb_model,
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Calibrated Linear SVM": CalibratedClassifierCV(LinearSVC(random_state=42, dual='auto'))
    }
    
    comparison_data = {
        "test_split_size": len(X_test),
        "models": {}
    }
    
    for name, m in candidate_models.items():
        if name != "MultinomialNB (Baseline)":
            t0 = time.time()
            m.fit(X_train_vec, y_train)
            fit_time = time.time() - t0
        else:
            fit_time = nb_train_time
            
        t1 = time.time()
        y_pred_m = m.predict(X_test_vec)
        infer_ms = (time.time() - t1) / len(X_test) * 1000
        
        y_proba_m = m.predict_proba(X_test_vec)[:, 1]
        
        comparison_data["models"][name] = {
            "accuracy": round(float(accuracy_score(y_test, y_pred_m)), 4),
            "precision": round(float(precision_score(y_test, y_pred_m)), 4),
            "recall": round(float(recall_score(y_test, y_pred_m)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred_m)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_proba_m)), 4),
            "train_time_sec": round(float(fit_time), 3),
            "infer_ms_per_sample": round(float(infer_ms), 4),
            "confusion_matrix": confusion_matrix(y_test, y_pred_m).tolist()
        }
        print(f" -> {name}: Accuracy = {comparison_data['models'][name]['accuracy']}, F1 = {comparison_data['models'][name]['f1_score']}, AUC = {comparison_data['models'][name]['roc_auc']}")

    # Error Analysis on Baseline Naive Bayes (False Positives & False Negatives)
    test_df = clean_df.loc[idx_test].copy()
    test_df['predicted'] = y_pred_nb
    test_df['proba_recommended'] = y_proba_nb
    
    fps = test_df[(test_df['recommended_ind'] == 0) & (test_df['predicted'] == 1)].sort_values('proba_recommended', ascending=False)
    fns = test_df[(test_df['recommended_ind'] == 1) & (test_df['predicted'] == 0)].sort_values('proba_recommended', ascending=True)
    
    comparison_data["error_analysis"] = {
        "false_positive_count": len(fps),
        "false_negative_count": len(fns),
        "representative_false_positives": [
            {
                "id": int(r['Clothing ID']),
                "rating": int(r['Rating']),
                "department": str(r['Department Name']) if pd.notnull(r['Department Name']) else "General",
                "predicted_proba": round(float(r['proba_recommended']), 4),
                "review_snippet": str(r['review_text'])[:200] + ("..." if len(str(r['review_text'])) > 200 else "")
            }
            for _, r in fps.head(5).iterrows()
        ],
        "representative_false_negatives": [
            {
                "id": int(r['Clothing ID']),
                "rating": int(r['Rating']),
                "department": str(r['Department Name']) if pd.notnull(r['Department Name']) else "General",
                "predicted_proba": round(float(r['proba_recommended']), 4),
                "review_snippet": str(r['review_text'])[:200] + ("..." if len(str(r['review_text'])) > 200 else "")
            }
            for _, r in fns.head(5).iterrows()
        ]
    }
    
    with open('model_comparison.json', 'w') as f:
        json.dump(comparison_data, f, indent=2)
    print("Model comparison & error analysis saved to model_comparison.json.")

    # =========================================================================
    # PART 3: SEPARATE 3-CLASS SENTIMENT-POLARITY MODEL
    # =========================================================================
    print("\nTraining separate 3-class Sentiment Polarity model...")
    # 0 = Negative (Rating 1-2), 1 = Neutral (Rating 3), 2 = Positive (Rating 4-5)
    clean_df['sentiment_3class'] = clean_df['Rating'].apply(
        lambda r: 0 if r <= 2 else (1 if r == 3 else 2)
    )
    y_sent = clean_df['sentiment_3class']
    
    X_sent_train, X_sent_test, y_sent_train, y_sent_test = train_test_split(
        X, y_sent, test_size=0.2, random_state=42, stratify=y_sent
    )
    
    tfidf_vectorizer = TfidfVectorizer(max_features=10000, stop_words='english', sublinear_tf=True)
    X_sent_train_vec = tfidf_vectorizer.fit_transform(X_sent_train)
    X_sent_test_vec = tfidf_vectorizer.transform(X_sent_test)
    
    sentiment_clf = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
    sentiment_clf.fit(X_sent_train_vec, y_sent_train)
    
    y_sent_pred = sentiment_clf.predict(X_sent_test_vec)
    sent_acc = float(accuracy_score(y_sent_test, y_sent_pred))
    sent_f1_macro = float(f1_score(y_sent_test, y_sent_pred, average='macro'))
    sent_f1_weighted = float(f1_score(y_sent_test, y_sent_pred, average='weighted'))
    sent_cm = confusion_matrix(y_sent_test, y_sent_pred).tolist()
    sent_report = classification_report(y_sent_test, y_sent_pred, target_names=['Negative', 'Neutral', 'Positive'], output_dict=True)
    
    sentiment_metrics = {
        "model_name": "TfidfVectorizer + LogisticRegression (Balanced)",
        "task": "3-Class Sentiment Polarity (Derived from Ratings: Negative 1-2, Neutral 3, Positive 4-5)",
        "test_accuracy": round(sent_acc, 4),
        "f1_macro": round(sent_f1_macro, 4),
        "f1_weighted": round(sent_f1_weighted, 4),
        "class_distribution": {
            "Negative_1_2": int((y_sent == 0).sum()),
            "Neutral_3": int((y_sent == 1).sum()),
            "Positive_4_5": int((y_sent == 2).sum())
        },
        "confusion_matrix": {
            "labels": ["Negative", "Neutral", "Positive"],
            "matrix": sent_cm
        },
        "classification_report": {
            "Negative": {
                "precision": round(sent_report['Negative']['precision'], 4),
                "recall": round(sent_report['Negative']['recall'], 4),
                "f1_score": round(sent_report['Negative']['f1-score'], 4),
                "support": int(sent_report['Negative']['support'])
            },
            "Neutral": {
                "precision": round(sent_report['Neutral']['precision'], 4),
                "recall": round(sent_report['Neutral']['recall'], 4),
                "f1_score": round(sent_report['Neutral']['f1-score'], 4),
                "support": int(sent_report['Neutral']['support'])
            },
            "Positive": {
                "precision": round(sent_report['Positive']['precision'], 4),
                "recall": round(sent_report['Positive']['recall'], 4),
                "f1_score": round(sent_report['Positive']['f1-score'], 4),
                "support": int(sent_report['Positive']['support'])
            }
        }
    }
    
    joblib.dump(sentiment_clf, 'sentiment_model.joblib')
    joblib.dump(tfidf_vectorizer, 'sentiment_vectorizer.joblib')
    with open('sentiment_model_evaluation.json', 'w') as f:
        json.dump(sentiment_metrics, f, indent=2)
    print(f"Sentiment model saved. Test Accuracy: {sent_acc:.4f}, Weighted F1: {sent_f1_weighted:.4f}")

    # =========================================================================
    # PART 4: ENRICHED SAMPLE BATCH CSV
    # =========================================================================
    sample_df = clean_df.sample(n=25, random_state=42)[
        ['Clothing ID', 'Age', 'Department Name', 'Class Name', 'Rating', 'review_text', 'recommended_ind']
    ].copy()
    sample_df.rename(columns={'review_text': 'Review Text', 'recommended_ind': 'Recommended IND'}, inplace=True)
    sample_df.to_csv('sample_reviews_batch.csv', index=False)
    print("Enriched sample_reviews_batch.csv saved (25 diverse rows).")

if __name__ == '__main__':
    train_and_benchmark()
