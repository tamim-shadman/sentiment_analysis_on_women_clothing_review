/**
 * API Client & Data Contracts for Women's Clothing Review Intelligence
 * Communicates with the Flask ML inference service.
 */

export interface TokenInfluence {
  token: string;
  count: number;
  weight: number;
}

export interface AspectEvidence {
  aspect: string;
  keywords: string[];
  mentions: number;
  snippets: string[];
}

export interface SinglePredictionResponse {
  recommended_ind: 0 | 1;
  sentiment_label: 'Recommended' | 'Not Recommended';
  probability: {
    recommended: number;
    not_recommended: number;
  };
  confidence: number;
  influential_tokens: {
    positive: TokenInfluence[];
    negative: TokenInfluence[];
  };
  token_weights_map: Record<string, number>;
  detected_aspects: AspectEvidence[];
  char_count: number;
  model_info: {
    classifier: string;
    vectorizer: string;
  };
}

export interface SentimentPolarityResponse {
  sentiment_polarity: 'Positive' | 'Neutral' | 'Negative';
  class_id: number;
  confidence: number;
  probability: {
    negative: number;
    neutral: number;
    positive: number;
  };
  model_info: {
    classifier: string;
    vectorizer: string;
  };
}

export interface CounterfactualResponse {
  status: string;
  original: {
    recommended_ind: 0 | 1;
    label: string;
    prob_recommended: number;
    prob_not_recommended: number;
  };
  modified: {
    recommended_ind: 0 | 1;
    label: string;
    prob_recommended: number;
    prob_not_recommended: number;
  };
  probability_delta: number;
  prediction_flipped: boolean;
}

export interface ModelScore {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  train_time_sec: number;
  infer_ms_per_sample: number;
  confusion_matrix: number[][];
}

export interface ErrorSample {
  id: number;
  rating: number;
  department: string;
  predicted_proba: number;
  review_snippet: string;
}

export interface ModelComparisonData {
  test_split_size: number;
  models: Record<string, ModelScore>;
  error_analysis: {
    false_positive_count: number;
    false_negative_count: number;
    representative_false_positives: ErrorSample[];
    representative_false_negatives: ErrorSample[];
  };
}

export interface BatchPredictionItem {
  row_id: number;
  review_text: string;
  metadata?: Record<string, any>;
  status: 'success' | 'invalid_empty_or_oversized';
  recommended_ind: 0 | 1 | null;
  sentiment_label: 'Recommended' | 'Not Recommended' | 'Unprocessed';
  sentiment_polarity?: string;
  detected_aspects?: string[];
  probability: {
    recommended: number;
    not_recommended: number;
  } | null;
  confidence: number | null;
}

export interface BatchPredictionResponse {
  status: string;
  total_submitted: number;
  valid_processed: number;
  invalid_count: number;
  summary: {
    recommended_count: number;
    not_recommended_count: number;
    recommended_pct: number;
    not_recommended_pct: number;
  };
  predictions: BatchPredictionItem[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  model_loaded: boolean;
  vectorizer_loaded: boolean;
  sentiment_model_loaded: boolean;
  model_type: string;
  vectorizer_type: string;
}

export interface ModelInfoData {
  model_name: string;
  vectorizer: string;
  dataset_name: string;
  total_rows: number;
  total_columns: number;
  valid_review_rows: number;
  train_samples: number;
  test_samples: number;
  vocabulary_size: number;
  class_distribution: {
    recommended_1: number;
    not_recommended_0: number;
  };
  evaluation_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: {
      true_negative: number;
      false_positive: number;
      false_negative: number;
      true_positive: number;
    };
    class_0_metrics: {
      precision: number;
      recall: number;
      f1_score: number;
      support: number;
    };
    class_1_metrics: {
      precision: number;
      recall: number;
      f1_score: number;
      support: number;
    };
  };
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  review_text: string;
  recommended_ind: 0 | 1;
  sentiment_label: 'Recommended' | 'Not Recommended';
  sentiment_polarity?: 'Positive' | 'Neutral' | 'Negative';
  confidence: number;
  aspects?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://127.0.0.1:5000');

export async function checkApiHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API health check returned status ${res.status}`);
  }
  return res.json();
}

export async function fetchModelInfo(): Promise<ModelInfoData> {
  const res = await fetch(`${API_BASE_URL}/api/model-info`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Model info returned status ${res.status}`);
  }
  const json = await res.json();
  if (json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'Failed to retrieve model info');
  }
  return json.data;
}

export async function fetchModelComparison(): Promise<ModelComparisonData> {
  const res = await fetch(`${API_BASE_URL}/api/model-comparison`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Model comparison returned status ${res.status}`);
  }
  const json = await res.json();
  if (json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'Failed to retrieve model comparisons');
  }
  return json.data;
}

export async function predictSingleReview(reviewText: string): Promise<SinglePredictionResponse> {
  const trimmed = reviewText.trim();
  if (!trimmed) {
    throw new Error('Please enter a review text.');
  }

  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ review_text: trimmed }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `Server responded with status ${res.status}`;
    throw new Error(errorMsg);
  }

  if (!data || typeof data.recommended_ind === 'undefined') {
    throw new Error('Invalid response structure received from prediction server.');
  }

  return data as SinglePredictionResponse;
}

export async function predictSentimentPolarity(reviewText: string): Promise<SentimentPolarityResponse> {
  const trimmed = reviewText.trim();
  if (!trimmed) {
    throw new Error('Please enter review text.');
  }

  const res = await fetch(`${API_BASE_URL}/predict/sentiment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ review_text: trimmed }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Sentiment service responded with status ${res.status}`);
  }

  return data as SentimentPolarityResponse;
}

export async function testCounterfactual(originalText: string, modifiedText: string): Promise<CounterfactualResponse> {
  const res = await fetch(`${API_BASE_URL}/predict/counterfactual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      original_text: originalText.trim(),
      modified_text: modifiedText.trim(),
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Counterfactual test failed with status ${res.status}`);
  }

  return data as CounterfactualResponse;
}

export async function predictBatchReviews(reviews: Array<string | { id: number; text: string; [key: string]: any }>): Promise<BatchPredictionResponse> {
  if (!reviews || reviews.length === 0) {
    throw new Error('No reviews provided for batch analysis.');
  }

  const res = await fetch(`${API_BASE_URL}/predict/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ reviews }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `Batch processing failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  if (!data || data.status !== 'success') {
    throw new Error('Invalid batch response format.');
  }

  return data as BatchPredictionResponse;
}

/**
 * Mitigates CSV spreadsheet formula injection vulnerabilities
 * by prefixing risky trigger characters (=, +, -, @) with a single quote.
 */
export function sanitizeForCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return `'${str}`;
  }
  return str;
}
