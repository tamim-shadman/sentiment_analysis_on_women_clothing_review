# Model Evaluation & Reproducibility Protocol
## Women's Clothing Review Intelligence

A rigorous engineering protocol defining dataset partitioning, leakage safeguards, performance metrics, and model promotion criteria.

---

### 1. Data Partitioning & Leakage Safeguards

#### Dataset Specification
- **Dataset**: Women's Clothing E-Commerce Reviews
- **Total Rows**: 23,486
- **Valid Review Subset**: 22,641 non-null textual reviews ($845$ null review texts excluded prior to partitioning).

#### Splitting Methodology
- **Split Ratio**: 80% Training ($N = 18,112$), 20% Held-Out Testing ($N = 4,529$).
- **Stratification**: Partitioned using `stratify=y` where $y$ represents the binary recommendation target `Recommended IND` (or the 3-class sentiment label for the polarity model).
- **Random Seed**: Fixed at `random_state=42` to guarantee 100% deterministic reproducibility across training runs.

#### Leakage Prevention Protocol
1. **Vocabulary Isolation**: The `CountVectorizer` and `TfidfVectorizer` are fit **exclusively** on `X_train`. The test set `X_test` is strictly transformed (`vectorizer.transform()`) using the pre-fitted dictionary.
2. **Feature Isolation**: No test-set statistics (mean word counts, TF-IDF document frequencies, or prior odds) inform feature selection or hyperparameter tuning.
3. **Temporal & Identifiers**: Review IDs, clothing item numbers, and departmental metadata are decoupled from the NLP vectorizer to avoid synthetic overfitting on specific garment SKUs.

---

### 2. Multi-Metric Benchmark Suite

Every evaluated model is scored against six complementary performance metrics on the exact same $N = 4,529$ test split:

1. **Accuracy**:
   $$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$
2. **Precision (Class 1 & Class 0)**:
   $$\text{Precision}_c = \frac{TP_c}{TP_c + FP_c}$$
3. **Recall (Sensitivity)**:
   $$\text{Recall}_c = \frac{TP_c}{TP_c + FN_c}$$
4. **F1-Score (Macro & Weighted)**:
   $$F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$
5. **Area Under the ROC Curve (ROC-AUC)**:
   Evaluates rank-ordering discrimination across all probability classification thresholds.
6. **Inference Latency & Computational Overhead**:
   Wall-clock training duration (seconds) and per-sample inference latency (milliseconds).

---

### 3. Model Promotion Criteria

A candidate model (e.g. Logistic Regression, Support Vector Machine, or Neural Network) can **only** replace the deployed production baseline (`MultinomialNB`) if it satisfies all four criteria:

1. **Overall Accuracy Superiority**:
   Candidate test accuracy must exceed the baseline by $\ge 0.5\%$ ($> 89.26\%$).
2. **Minority Class Protection (Class 0 / Not Recommended)**:
   Candidate recall and precision on Class 0 must not drop below baseline levels ($65.1\%$ recall, $70.8\%$ precision), preventing majority-class bias.
3. **Inference Latency Boundary**:
   Per-sample CPU inference latency must remain $< 5.0\text{ ms}$, ensuring responsive real-time web execution.
4. **Explainability Compliance**:
   The candidate must support mathematically sound, non-approximated feature attribution.

*Current Status*: In benchmark testing, **MultinomialNB achieved 88.76% accuracy and 0.9183 AUC**, outperforming Logistic Regression (88.52%, 0.9097 AUC) and Linear SVM (87.59%, 0.8917 AUC). Consequently, **MultinomialNB remains the default deployed baseline**.

---

### 4. Reproducibility Command

To execute the protocol and regenerate all artifacts:
```bash
python train_model.py
```
Outputs generated:
- `NB_model.joblib`
- `CountVectorizer_model.joblib`
- `model_evaluation.json`
- `model_comparison.json`
- `sentiment_model.joblib`
- `sentiment_vectorizer.joblib`
- `sentiment_model_evaluation.json`
