"""
Comprehensive Automated Test Suite for Women's Clothing Review Intelligence API
Verifies:
- Recommendation prediction & token log-odds attribution
- Separate 3-class sentiment polarity (Positive, Neutral, Negative)
- Aspect & topic extraction with sentence evidence
- Counterfactual / what-if testing
- Model comparison benchmarks & error analysis
- Bounded batch inference & validation errors
"""

import unittest
import json
from app import app

class TestReviewIntelligenceAPI(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_health_endpoint(self):
        """Verifies that /health returns 200, recommendation model, and sentiment model readiness."""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['model_loaded'])
        self.assertTrue(data['vectorizer_loaded'])
        self.assertTrue(data['sentiment_model_loaded'])
        self.assertEqual(data['model_type'], 'MultinomialNB')

    def test_model_info_endpoint(self):
        """Verifies /api/model-info returns authentic empirical metrics."""
        response = self.client.get('/api/model-info')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        metrics = data['data']['evaluation_metrics']
        self.assertGreaterEqual(metrics['accuracy'], 0.85)

    def test_model_comparison_endpoint(self):
        """Verifies /api/model-comparison returns benchmark comparisons and error analysis."""
        response = self.client.get('/api/model-comparison')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('models', data['data'])
        self.assertIn('MultinomialNB (Baseline)', data['data']['models'])
        self.assertIn('Logistic Regression', data['data']['models'])
        self.assertIn('Calibrated Linear SVM', data['data']['models'])
        self.assertIn('error_analysis', data['data'])
        self.assertIn('representative_false_positives', data['data']['error_analysis'])
        self.assertIn('representative_false_negatives', data['data']['error_analysis'])

    def test_sentiment_model_info_endpoint(self):
        """Verifies /api/sentiment-model-info returns 3-class sentiment metrics."""
        response = self.client.get('/api/sentiment-model-info')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('test_accuracy', data['data'])
        self.assertIn('confusion_matrix', data['data'])

    def test_predict_single_recommended(self):
        """Verifies positive review inference returns recommended_ind = 1 and token attribution."""
        payload = {
            "review_text": "I absolutely love this gorgeous dress! It fits perfectly and the fabric is flattering and soft."
        }
        response = self.client.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['recommended_ind'], 1)
        self.assertEqual(data['sentiment_label'], 'Recommended')
        self.assertGreater(data['probability']['recommended'], 0.5)
        self.assertIn('influential_tokens', data)
        self.assertIn('detected_aspects', data)
        self.assertGreater(len(data['influential_tokens']['positive']), 0)

    def test_predict_single_not_recommended(self):
        """Verifies critical review inference returns recommended_ind = 0 and negative token attribution."""
        payload = {
            "review_text": "Terrible quality. Cheap scratchy fabric, completely see-through, ripped at the seam immediately. Sending back."
        }
        response = self.client.post('/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['recommended_ind'], 0)
        self.assertEqual(data['sentiment_label'], 'Not Recommended')
        self.assertGreater(data['probability']['not_recommended'], 0.5)
        neg_tokens = [t['token'] for t in data['influential_tokens']['negative']]
        self.assertTrue(any(term in neg_tokens for term in ['cheap', 'poor', 'terrible', 'scratchy', 'ripped', 'back']))

    def test_predict_sentiment_positive(self):
        """Verifies separate 3-class sentiment endpoint returns Positive for enthusiastic review."""
        payload = {
            "review_text": "Stunning quality, beautiful color, highly impressed with this gorgeous sweater."
        }
        response = self.client.post('/predict/sentiment', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['sentiment_polarity'], 'Positive')
        self.assertEqual(data['class_id'], 2)
        self.assertGreater(data['probability']['positive'], 0.5)

    def test_predict_sentiment_negative(self):
        """Verifies separate 3-class sentiment endpoint returns Negative for critical review."""
        payload = {
            "review_text": "Horrible fit, scratchy fabric, ruined after one wash. Absolute waste of money."
        }
        response = self.client.post('/predict/sentiment', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['sentiment_polarity'], 'Negative')
        self.assertEqual(data['class_id'], 0)
        self.assertGreater(data['probability']['negative'], 0.5)

    def test_predict_aspects(self):
        """Verifies aspect extraction extracts dimensions and supporting sentence snippets."""
        payload = {
            "review_text": "The linen fabric breathes nicely in summer. However, the waist is too tight and the zipper snagged."
        }
        response = self.client.post('/predict/aspects', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        aspect_names = [a['aspect'] for a in data['aspects']]
        self.assertIn('Fabric & Material', aspect_names)
        self.assertIn('Fit & Sizing', aspect_names)
        self.assertIn('Quality & Durability', aspect_names)
        # Check snippet presence
        fit_aspect = next(a for a in data['aspects'] if a['aspect'] == 'Fit & Sizing')
        self.assertTrue(len(fit_aspect['snippets']) > 0)

    def test_predict_counterfactual(self):
        """Verifies what-if endpoint computes probability delta between original and edited text."""
        payload = {
            "original_text": "The fabric is terrible and ripped at the zipper.",
            "modified_text": "The fabric is gorgeous and fits true to size."
        }
        response = self.client.post('/predict/counterfactual', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('probability_delta', data)
        self.assertGreater(data['modified']['prob_recommended'], data['original']['prob_recommended'])

    def test_predict_batch_success(self):
        """Verifies bounded batch prediction transforms together with sentiment and aspect tags."""
        reviews = [
            "This jumpsuit is divine, fits true to size and feels very high quality.",
            "Disappointed with this blouse. Poor stitching and shrunk after first wash.",
            "A flattering skirt that gets compliments everywhere I wear it."
        ]
        response = self.client.post('/predict/batch', json={"reviews": reviews})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['total_submitted'], 3)
        self.assertEqual(len(data['predictions']), 3)
        self.assertEqual(data['predictions'][0]['recommended_ind'], 1)
        self.assertEqual(data['predictions'][1]['recommended_ind'], 0)
        self.assertIn('detected_aspects', data['predictions'][0])
        self.assertIn('sentiment_polarity', data['predictions'][0])

    def test_predict_batch_with_invalid_rows(self):
        """Verifies that invalid rows within a batch are flagged without failing the entire batch."""
        payload = {
            "reviews": [
                "Wonderful dress, highly recommended!",
                "",
                "Awful material, terrible fit."
            ]
        }
        response = self.client.post('/predict/batch', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['total_submitted'], 3)
        self.assertEqual(data['valid_processed'], 2)
        self.assertEqual(data['invalid_count'], 1)
        self.assertEqual(data['predictions'][1]['status'], 'invalid_empty_or_oversized')

    def test_predict_validation_errors(self):
        """Verifies safe error handling for missing/invalid payloads."""
        res1 = self.client.post('/predict', json={})
        self.assertEqual(res1.status_code, 400)
        res2 = self.client.post('/predict', json={"review_text": "   "})
        self.assertEqual(res2.status_code, 400)
        res3 = self.client.post('/predict', json={"review_text": 12345})
        self.assertEqual(res3.status_code, 400)

if __name__ == '__main__':
    unittest.main()
