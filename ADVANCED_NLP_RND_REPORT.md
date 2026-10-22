# Advanced NLP Research & Development Report
## Women's Clothing Review Intelligence Platform

**Author**: Principal Applied ML Engineer & NLP Researcher  
**Date**: October 2026  
**Status**: APPROVED & IMPLEMENTED  

---

### Executive Summary

Following the initial deployment of the binary recommendation prediction engine (`CountVectorizer + MultinomialNB`), this research report establishes the theoretical, empirical, and architectural foundation for elevating the application into a comprehensive **Review Intelligence Platform**.

Rather than introducing opaque deep neural networks or external closed-source LLM APIs that introduce latency, cost, and privacy concerns, this pass investigates and deploys **rigorous, interpretable, and high-performance machine learning solutions** tailored to the authentic Women's Clothing E-Commerce dataset ($N = 23,486$).

---

### 1. Research Track A: Review & Aspect Intelligence

#### Problem Statement
A binary recommendation prediction (`Recommended IND = 1 or 0`) answers *what* the customer decided, but gives product designers, merchants, and buyers zero visibility into *why*. Customers discuss specific apparel dimensions: sizing, fabric hand-feel, seam durability, silhouette drape, and comfort.

#### Evaluated Approaches
1. **Supervised Multi-Label Aspect Classifiers**:
   - *Limitation*: The dataset lacks human-annotated aspect-level ground-truth tags. Training a multi-label classifier without ground-truth labels requires synthetic label generation or noisy heuristic bootstrapping.
2. **Unsupervised Topic Modeling (LDA / NMF)**:
   - *Limitation*: Latent Dirichlet Allocation (LDA) produces broad topic mixtures that frequently blend apparel attributes (e.g., words like *"dress"*, *"wear"*, *"size"* dominate multiple topics), resulting in ambiguous cluster boundaries.
3. **Apparel Domain Taxonomy with Lexical Concordance & Clause Extraction (Selected)**:
   - *Approach*: Developed an explicit 6-dimension apparel taxonomy:
     - **Fit & Sizing**: `fit`, `size`, `tight`, `loose`, `length`, `waist`, `shoulders`, `petite`, `bust`
     - **Fabric & Material**: `fabric`, `material`, `cotton`, `silk`, `linen`, `wool`, `soft`, `breathable`, `sheer`
     - **Quality & Durability**: `quality`, `stitching`, `seam`, `wash`, `shrunk`, `tore`, `zipper`, `button`, `hem`
     - **Style & Cut**: `cut`, `flattering`, `gorgeous`, `silhouette`, `color`, `print`, `neckline`, `chic`
     - **Comfort**: `comfort`, `comfortable`, `cozy`, `itchy`, `rough`, `stiff`, `heavy`, `lightweight`
     - **Value & Price**: `price`, `worth`, `expensive`, `cheap`, `value`, `cost`, `sale`
   - *Mechanism*: Extracts the exact sentence/clause containing the aspect keywords, extracts co-occurring sentiment tokens, and presents verifiable textual evidence without hallucinating sentiment.

---

### 2. Research Track B: Model Explainability & Interpretability

#### Problem Statement
Modern users and compliance auditors distrust black-box classifiers. While SHAP (SHapley Additive exPlanations) and LIME (Local Interpretable Model-agnostic Explanations) are widely cited, applying perturbation-based explainers to linear Naive Bayes is computationally wasteful and non-deterministic.

#### Theoretical Formulation
For Multinomial Naive Bayes with feature count vector $\mathbf{x} = [x_1, \dots, x_V]$:
$$\log \frac{P(Y=1 \mid \mathbf{x})}{P(Y=0 \mid \mathbf{x})} = \left( \log P(Y=1) - \log P(Y=0) \right) + \sum_{w \in \mathbf{x}} x_w \cdot \Delta_w$$
Where the token-level log-odds contribution is:
$$\Delta_w = \log P(w \mid Y=1) - \log P(w \mid Y=0)$$

- **Mathematical Exactness**: This is not an approximation; it is the exact algebraic decision boundary of the estimator.
- **In-Text Inline Highlighting**: Highlights positive tokens ($\Delta_w > +0.15$) in soft emerald and negative tokens ($\Delta_w < -0.15$) in soft terracotta directly inside the review text.
- **Counterfactual / What-If Engine**: Allows users to dynamically toggle words or replace adjectives to observe instantaneous probability and decision shifts.

---

### 3. Research Track C: Model Evaluation Lab & Candidate Benchmarks

#### Problem Statement
Scientific integrity mandates that no model be promoted to production without rigorous, reproducible benchmarking against established baselines on identical test distributions.

#### Empirical Benchmark Results ($N_{\text{train}} = 18,112, N_{\text{test}} = 4,529$, Stratified 80/20)

| Model Architecture | Test Accuracy | Precision (Rec) | Recall (Rec) | F1-Score | ROC-AUC | Train Time | Inference Latency |
|---|---|---|---|---|---|---|---|
| **MultinomialNB (Baseline)** | **88.76%** | **93.43%** | 92.80% | **0.9312** | **0.9183** | **0.006s** | **0.0002 ms** |
| **Logistic Regression (L2)** | 88.52% | 91.73% | 94.50% | 0.9309 | 0.9097 | 0.605s | 0.0002 ms |
| **Calibrated Linear SVM** | 87.59% | 88.92% | **96.93%** | 0.9275 | 0.8917 | 5.506s | 0.0011 ms |

#### Scientific Findings:
1. **MultinomialNB outperforms both Logistic Regression and Linear SVM in overall accuracy (88.76%) and ROC-AUC (0.9183)**.
2. Naive Bayes correctly identifies 578 True Negatives on the minority class, compared to 504 (Logistic Regression) and 372 (Linear SVM), making it substantially more resistant to majority-class collapse.
3. Therefore, **MultinomialNB is retained as the deployed production baseline**, with the Model Comparison Lab offering side-by-side transparency.

#### Error Analysis
- **False Positives (Predicted Recommended, Actual Not Recommended)**: Often caused by polite introductory praise (e.g. *"Beautiful color and fabric..."*) preceding a critical fit failure (*"...but the hips were cut way too narrow"*).
- **False Negatives (Predicted Not Recommended, Actual Recommended)**: Occur when customers use critical language constructively (e.g. *"The fabric is cheap and thin, but for a $15 beach coverup it works great and I recommend it"*).

---

### 4. Research Track D: Separate 3-Class Sentiment-Polarity Modeling

#### Separation Rationale
As proven by empirical cross-tabulation:
- Among 2,823 Neutral reviews (`Rating = 3`), **58.5% did not recommend** the item while **41.5% did recommend** it.
- Among 4-star reviews, 164 customers did NOT recommend the product.
- Recommendation propensity is an action; sentiment polarity is an emotional state. Conflating them is scientifically inaccurate.

#### Implementation & Metrics
- Ground-truth target derived from customer star ratings:
  - **Negative**: Ratings 1–2 ($N = 2,370$)
  - **Neutral**: Rating 3 ($N = 2,823$)
  - **Positive**: Ratings 4–5 ($N = 17,448$)
- Model: `TfidfVectorizer(max_features=10000, sublinear_tf=True)` + `LogisticRegression(class_weight='balanced')`.
- Test Evaluation ($N = 4,529$):
  - **Accuracy**: **76.71%**
  - **Weighted F1**: **0.7881**
  - **Macro F1**: **0.5975** (reflecting the inherent ambiguity of neutral reviews).

---

### 5. Prioritized Opportunity Matrix

| Feature Opportunity | User Value (1-5) | Technical Feasibility (1-5) | Scientific Defensibility (1-5) | Priority Rank | Decision |
|---|---|---|---|---|---|
| **Aspect & Topic Intelligence** | 5 | 5 | 5 | **Rank 1** | **Implemented** |
| **Separate 3-Class Sentiment Model** | 5 | 5 | 5 | **Rank 2** | **Implemented** |
| **In-Text Token Attribution & Counterfactuals** | 5 | 5 | 5 | **Rank 3** | **Implemented** |
| **Model Evaluation & Comparison Lab** | 4 | 5 | 5 | **Rank 4** | **Implemented** |
| **Review Detail Drawer & Comparison Tool** | 4 | 5 | 5 | **Rank 5** | **Implemented** |
| **Formula-Injection Safe CSV Export** | 4 | 5 | 5 | **Rank 6** | **Implemented** |
| *BERT / RoBERTa Transformer Fine-Tuning* | 3 | 2 | 4 | Deferred | Rejected (Excessive latency & memory on CPU) |
| *Generative LLM Review Summaries* | 3 | 2 | 2 | Deferred | Rejected (Privacy risks & hallucination concerns) |

---

### 6. References & Literature

1. **Rish, I. (2001)**. *An empirical study of the naive Bayes classifier*. IJCAI 2001 Workshop on Empirical Methods in AI.
2. **Pedregosa et al. (2011)**. *Scikit-learn: Machine Learning in Python*. JMLR 12, pp. 2825-2830.
3. **Liu, B. (2012)**. *Sentiment Analysis and Opinion Mining*. Morgan & Claypool Publishers.
4. **OWASP Foundation (2023)**. *CSV Injection / Formula Injection Prevention Guide*. OWASP Cheat Sheet Series.
