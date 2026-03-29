# Sentiment Analysis on Women's Clothing Reviews

A machine learning web application that performs sentiment analysis on women's clothing reviews to predict whether a customer recommends a product.

## Overview

This project applies Natural Language Processing (NLP) and machine learning techniques to analyze customer reviews from a women's clothing e-commerce dataset. Given a review text, the application predicts whether the customer recommends the product (binary classification: Recommended / Not Recommended).

The project was developed using Google Colab and several supervised ML and deep learning algorithms were evaluated before deploying the best-performing model as a REST API.

## Features

- Predict product recommendation from customer review text
- Clean and responsive web interface (Landing page, Review input, Result popup)
- Flask REST API backend for model inference
- Deployed API accessible at [https://sawcrep-api.onrender.com/predict](https://sawcrep-api.onrender.com/predict)

## Dataset

- **Source**: Women's clothing e-commerce reviews
- **Size**: ~22,641–23,486 rows, 10 feature variables
- **Target Variable**: `Recommended IND` (1 = Recommended, 0 = Not Recommended)
- **Feature Used for Modeling**: `Review Text`

## Machine Learning Algorithms Evaluated

| Algorithm | Type |
|---|---|
| Logistic Regression | Supervised ML |
| **Naive Bayes** *(deployed)* | Supervised ML |
| Support Vector Machine (SVM) | Supervised ML |
| Random Forest Classifier | Supervised ML |
| AdaBoost | Supervised ML |
| RNN with GRU | Deep Learning |

The **Naive Bayes** classifier with **CountVectorizer** (Bag of Words) feature extraction was selected for deployment.

## Tech Stack

**Backend**
- Python 3
- Flask
- flask-cors
- scikit-learn (`CountVectorizer`, `MultinomialNB`)
- joblib

**Frontend**
- HTML5 / CSS3
- JavaScript (Fetch API)
- Bootstrap 4

**Development**
- Google Colab (model training)
- Render (API deployment)

## Project Structure

```
├── app.py                    # Flask API backend
├── NB_model.joblib           # Trained Naive Bayes model
├── CountVectorizer_model.joblib  # Fitted CountVectorizer
├── index.html                # Landing page
├── homepage.html             # Review input interface
├── about.html                # Project description page
├── popup.html                # Prediction result modal
├── script.js                 # Frontend logic & API calls
├── style.css                 # Homepage styles
├── landing.css               # Landing page styles
└── popup.css                 # Popup modal styles
```

## API Usage

**Endpoint**: `POST /predict`

**Request** (JSON):
```json
{
  "review_text": "I love this dress! It fits perfectly and the material is very comfortable."
}
```

**Response** (JSON):
```json
{
  "recommended_ind": 1
}
```

| `recommended_ind` | Meaning |
|---|---|
| `1` | Product Recommended |
| `0` | Product Not Recommended |

## Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/tamim-shadman/sentiment_analysis_on_women_clothing_review.git
   cd sentiment_analysis_on_women_clothing_review
   ```

2. **Install dependencies**
   ```bash
   pip install flask flask-cors scikit-learn joblib
   ```

3. **Start the Flask API**
   ```bash
   python app.py
   ```

4. **Open the frontend**

   Open `index.html` in your browser and click **Get Started** to enter a review.

## Team

**Team Quantum Leap**

© 2024 Women's Clothing Reviews