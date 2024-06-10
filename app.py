import joblib
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import CountVectorizer
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model
model = joblib.load('NB_model.joblib')

# Load the CountVectorizer
vectorizer = joblib.load('CountVectorizer_model.joblib')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Ensure the request contains JSON data
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        # Get review text from request
        review_text = request.json.get('review_text')
        if not review_text:
            return jsonify({'error': 'No review_text provided'}), 400

        # Transform the review text using the loaded CountVectorizer
        review_vector = vectorizer.transform([review_text])

        # Make prediction
        predicted_recommendation = model.predict(review_vector)

        # Return prediction as JSON
        return jsonify({'recommended_ind': int(predicted_recommendation[0])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
