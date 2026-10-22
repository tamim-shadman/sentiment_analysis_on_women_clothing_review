import React, { useState, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertCircle,
  Sliders,
  HelpCircle,
  Tag,
  Shuffle,
  Eye
} from 'lucide-react';
import { predictSingleReview, predictSentimentPolarity } from '../api';
import type { SinglePredictionResponse, SentimentPolarityResponse, HistoryItem } from '../api';
import { TokenHighlightText } from './TokenHighlightText';
import { CounterfactualModal } from './CounterfactualModal';

interface AnalyzerViewProps {
  initialText?: string;
  onSaveToHistory: (item: HistoryItem) => void;
  onNavigate: (tab: string) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  initialText = '',
  onSaveToHistory,
  onNavigate,
}) => {
  const [reviewText, setReviewText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SinglePredictionResponse | null>(null);
  const [sentimentResult, setSentimentResult] = useState<SentimentPolarityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedReview, setCopiedReview] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [showCounterfactual, setShowCounterfactual] = useState(false);
  const [showInlineHighlights, setShowInlineHighlights] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync if initialText changes from outside
  React.useEffect(() => {
    if (initialText) {
      setReviewText(initialText);
      setResult(null);
      setSentimentResult(null);
      setError(null);
    }
  }, [initialText]);

  const presets = [
    {
      label: '5-Star Fit & Fabric',
      text: 'I love this dress! The cut is extremely flattering and the linen fabric breathes wonderfully in hot weather. Fits true to size and looks gorgeous.',
    },
    {
      label: '1-Star Defect & Returns',
      text: 'Terrible quality. Shrunk after one cold wash, seams came undone, and the fabric feels like cheap synthetic paper. Returning it immediately.',
    },
    {
      label: 'Mixed Review (Tight Bust)',
      text: 'The color is gorgeous and vibrant, but the bust sizing runs very small and the material wrinkles instantly. Had to send it back unfortunately.',
    },
    {
      label: 'Petite Proportions',
      text: 'Perfect petite proportions! Fits comfortably across shoulders without needing any alterations at all. Very happy with this purchase.',
    },
  ];

  const handleEvaluate = async () => {
    const trimmed = reviewText.trim();
    if (!trimmed) {
      setError('Please enter review text before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    setCopiedReview(false);
    setCopiedSummary(false);
    setSavedToHistory(false);

    try {
      const [recData, sentData] = await Promise.all([
        predictSingleReview(trimmed),
        predictSentimentPolarity(trimmed).catch(() => null),
      ]);
      setResult(recData);
      setSentimentResult(sentData);

      // Auto add to session history
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        review_text: trimmed,
        recommended_ind: recData.recommended_ind,
        sentiment_label: recData.sentiment_label,
        confidence: recData.confidence,
      };
      onSaveToHistory(historyItem);
      setSavedToHistory(true);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'An error occurred while contacting the prediction service.');
      setResult(null);
      setSentimentResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleEvaluate();
    }
  };

  const handleCopyReview = () => {
    navigator.clipboard.writeText(reviewText);
    setCopiedReview(true);
    setTimeout(() => setCopiedReview(false), 2000);
  };

  const handleCopySummary = () => {
    if (!result) return;
    const summary = `Model Prediction: ${result.sentiment_label} (${(result.confidence * 100).toFixed(1)}% confidence)\nSentiment Polarity: ${sentimentResult ? sentimentResult.sentiment_polarity : 'N/A'}\nReview: "${reviewText}"\nModel: Multinomial Naive Bayes`;
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleClear = () => {
    setReviewText('');
    setResult(null);
    setSentimentResult(null);
    setError(null);
    setSavedToHistory(false);
  };

  const wordCount = reviewText.trim() ? reviewText.trim().split(/\s+/).length : 0;
  const isOverLimit = reviewText.length > 10000;

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-eyebrow">Interactive Review Workspace</span>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.6rem', color: 'var(--brand-primary)' }}>
          Single-Review Analyzer
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '780px' }}>
          Evaluate customer reviews with dual-model intelligence: inspect binary recommendation probability with exact mathematical token log-odds, evaluate separate 3-class sentiment polarity, and discover apparel aspect evidence.
        </p>
      </div>

      {/* Editor Surface */}
      <div className="card-surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label htmlFor="review-input" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            Customer Review Body
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Curated Presets:
            </span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-chip"
                onClick={() => {
                  setReviewText(preset.text);
                  setError(null);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          id="review-input"
          className="review-textarea"
          value={reviewText}
          onChange={(e) => {
            setReviewText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste or write a customer review of a dress, blouse, jacket, knit, or intimate apparel..."
          aria-label="Customer review text input"
          rows={6}
          disabled={loading}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.8rem',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: isOverLimit ? 'var(--sentiment-not-recommended)' : 'var(--text-tertiary)' }}>
            <span>{reviewText.length.toLocaleString()} / 10,000 characters</span>
            <span>&bull;</span>
            <span>{wordCount} words</span>
            <span style={{ color: 'var(--text-muted)' }}>(Ctrl+Enter to evaluate)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {reviewText && (
              <button className="btn-ghost" onClick={handleClear} disabled={loading}>
                <RotateCcw size={14} /> Clear
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleEvaluate}
              disabled={loading || !reviewText.trim() || isOverLimit}
            >
              {loading ? (
                <>Evaluating Models...</>
              ) : (
                <>
                  <Sparkles size={16} /> Evaluate Review
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--sentiment-not-recommended-light)',
              border: '1px solid var(--sentiment-not-recommended-border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <AlertCircle size={18} color="var(--sentiment-not-recommended)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--sentiment-not-recommended)' }}>
                Analysis Request Error
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--sentiment-not-recommended)', marginTop: '0.2rem' }}>
                {error}
              </p>
              <button
                className="btn-ghost"
                style={{ marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.8rem', textDecoration: 'underline' }}
                onClick={handleEvaluate}
              >
                Retry Request
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton Transition */}
      {loading && !result && (
        <div className="card-surface" style={{ padding: '2.5rem', animation: 'fadeIn 200ms ease', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="skeleton-box" style={{ width: '240px', height: '28px' }} />
            <div className="skeleton-box" style={{ width: '120px', height: '32px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '100%', height: '80px', marginBottom: '1.5rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
            <div className="skeleton-box" style={{ height: '90px' }} />
            <div className="skeleton-box" style={{ height: '90px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '100%', height: '120px' }} />
        </div>
      )}

      {/* Result Panel */}
      {result && (
        <div
          ref={resultsRef}
          className="card-surface"
          style={{
            padding: '2.5rem',
            borderTop: `4px solid ${result.recommended_ind === 1 ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)'}`,
            animation: 'fadeIn 300ms ease',
          }}
        >
          {/* Header Action Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span className="section-eyebrow">Verified Dual-Model Outputs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                <span className={result.recommended_ind === 1 ? 'badge-rec' : 'badge-not-rec'} style={{ fontSize: '1.05rem', padding: '0.45rem 1rem' }}>
                  {result.recommended_ind === 1 ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  PREDICTED: {result.sentiment_label.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  (Target: <code>Recommended IND = {result.recommended_ind}</code>)
                </span>

                {/* Separate 3-Class Sentiment Badge */}
                {sentimentResult && (
                  <span
                    className={
                      sentimentResult.sentiment_polarity === 'Positive'
                        ? 'badge-rec'
                        : sentimentResult.sentiment_polarity === 'Negative'
                        ? 'badge-not-rec'
                        : 'badge-neutral'
                    }
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.85rem' }}
                    title="Independent 3-Class Sentiment Polarity Model trained on customer ratings"
                  >
                    POLARITY: {sentimentResult.sentiment_polarity.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                onClick={() => setShowCounterfactual(true)}
              >
                <Shuffle size={14} /> What-If Sandbox
              </button>
              <button className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }} onClick={handleCopyReview}>
                {copiedReview ? <Check size={14} /> : <Copy size={14} />} {copiedReview ? 'Copied' : 'Copy Text'}
              </button>
              <button className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }} onClick={handleCopySummary}>
                {copiedSummary ? <Check size={14} /> : <Copy size={14} />} {copiedSummary ? 'Summary Copied' : 'Copy Summary'}
              </button>
              {savedToHistory && (
                <span style={{ fontSize: '0.78rem', color: 'var(--sentiment-recommended)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  <Check size={12} /> Saved in Session
                </span>
              )}
            </div>
          </div>

          {/* Model Posterior Balance Meters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
            {/* Primary Recommendation Probability Meter */}
            <div
              style={{
                padding: '1.2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Recommendation Posterior</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>MultinomialNB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                <span style={{ color: 'var(--sentiment-recommended)' }}>
                  Rec: {(result.probability.recommended * 100).toFixed(1)}%
                </span>
                <span style={{ color: 'var(--sentiment-not-recommended)' }}>
                  Not Rec: {(result.probability.not_recommended * 100).toFixed(1)}%
                </span>
              </div>

              <div className="prob-bar-container" style={{ margin: '0.5rem 0' }}>
                <div
                  className="prob-segment-rec"
                  style={{ width: `${result.probability.recommended * 100}%` }}
                  title={`Recommended: ${(result.probability.recommended * 100).toFixed(1)}%`}
                />
                <div
                  className="prob-segment-not-rec"
                  style={{ width: `${result.probability.not_recommended * 100}%` }}
                  title={`Not Recommended: ${(result.probability.not_recommended * 100).toFixed(1)}%`}
                />
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Threshold: P &ge; 0.50</span>
                <span>Prior: 81.9% Class 1</span>
              </div>
            </div>

            {/* Separate 3-Class Sentiment Distribution */}
            {sentimentResult && (
              <div
                style={{
                  padding: '1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>3-Class Sentiment Polarity</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>Rating-Derived Logistic</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--sentiment-not-recommended)' }}>
                    Neg: {(sentimentResult.probability.negative * 100).toFixed(1)}%
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Neu: {(sentimentResult.probability.neutral * 100).toFixed(1)}%
                  </span>
                  <span style={{ color: 'var(--sentiment-recommended)' }}>
                    Pos: {(sentimentResult.probability.positive * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="prob-bar-container" style={{ margin: '0.5rem 0', display: 'flex', overflow: 'hidden' }}>
                  <div
                    style={{ width: `${sentimentResult.probability.negative * 100}%`, backgroundColor: 'var(--sentiment-not-recommended)' }}
                    title={`Negative: ${(sentimentResult.probability.negative * 100).toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${sentimentResult.probability.neutral * 100}%`, backgroundColor: '#94A3B8' }}
                    title={`Neutral: ${(sentimentResult.probability.neutral * 100).toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${sentimentResult.probability.positive * 100}%`, backgroundColor: 'var(--sentiment-recommended)' }}
                    title={`Positive: ${(sentimentResult.probability.positive * 100).toFixed(1)}%`}
                  />
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Separate research model</span>
                  <span>Predicted: {sentimentResult.sentiment_polarity}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive In-Text Attribution */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.15rem' }}>Linguistic Token Attribution in Context</h3>
              </div>
              <button
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setShowInlineHighlights(!showInlineHighlights)}
              >
                {showInlineHighlights ? 'Hide Highlights' : 'Show Token Highlights'}
              </button>
            </div>

            <div
              style={{
                padding: '1.2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                marginBottom: '1rem',
              }}
            >
              {showInlineHighlights && result.token_weights_map ? (
                <TokenHighlightText text={reviewText} tokenWeightsMap={result.token_weights_map} />
              ) : (
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {reviewText}
                </p>
              )}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'rgba(30, 107, 71, 0.5)', borderRadius: '2px' }} />
                Green: Pulls toward Recommended (+ log-odds)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'rgba(150, 40, 40, 0.5)', borderRadius: '2px' }} />
                Red: Pulls toward Not Recommended (&minus; log-odds)
              </span>
              <span>Hover tokens to inspect mathematically exact log-likelihood difference.</span>
            </div>
          </div>

          {/* Discriminative Vocabulary Chips */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Sliders size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '1.15rem' }}>Influential Vocabulary Attribution</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Mathematically exact log-likelihood difference: <code>log P(token | Recommended) &minus; log P(token | Not Recommended)</code>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
              {/* Positive Tokens */}
              <div
                style={{
                  padding: '1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--sentiment-recommended-light)',
                  border: '1px solid var(--sentiment-recommended-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sentiment-recommended)' }}>
                    Pulling Toward "Recommended"
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--sentiment-recommended)' }}>
                    + log-odds
                  </span>
                </div>

                {result.influential_tokens.positive.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {result.influential_tokens.positive.map((item, idx) => (
                      <span key={idx} className="token-chip pos" title={`Word: "${item.token}", Count: ${item.count}, Weight: +${item.weight}`}>
                        {item.token}
                        <strong style={{ marginLeft: '0.2rem' }}>+{item.weight}</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                    No strong positive discriminating terms found in this review text.
                  </p>
                )}
              </div>

              {/* Negative Tokens */}
              <div
                style={{
                  padding: '1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--sentiment-not-recommended-light)',
                  border: '1px solid var(--sentiment-not-recommended-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--sentiment-not-recommended)' }}>
                    Pulling Toward "Not Recommended"
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--sentiment-not-recommended)' }}>
                    &minus; log-odds
                  </span>
                </div>

                {result.influential_tokens.negative.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {result.influential_tokens.negative.map((item, idx) => (
                      <span key={idx} className="token-chip neg" title={`Word: "${item.token}", Count: ${item.count}, Weight: ${item.weight}`}>
                        {item.token}
                        <strong style={{ marginLeft: '0.2rem' }}>{item.weight}</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                    No strong critical terms detected in this review text.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detected Apparel Aspect Intelligence */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <Tag size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '1.15rem' }}>Apparel Aspect & Feedback Evidence</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Exploratory apparel domain lexicon matching across 6 key product dimensions with supporting contextual sentence snippets.
            </p>

            {result.detected_aspects && result.detected_aspects.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {result.detected_aspects.map((aspectItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.2rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--brand-primary)' }}>
                        {aspectItem.aspect}
                      </span>
                      <span className="brand-badge" style={{ fontSize: '0.72rem' }}>
                        {aspectItem.mentions} {aspectItem.mentions === 1 ? 'mention' : 'mentions'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {aspectItem.keywords.map((kw, kwIdx) => (
                        <span
                          key={kwIdx}
                          style={{
                            fontSize: '0.74rem',
                            fontFamily: 'var(--font-mono)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '3px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>

                    {aspectItem.snippets.length > 0 && (
                      <div style={{ marginTop: '0.5rem', borderLeft: '2px solid var(--brand-accent)', paddingLeft: '0.65rem' }}>
                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          "{aspectItem.snippets[0]}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                No explicit keywords for fit, fabric, quality, style, comfort, or value were detected in this review.
              </div>
            )}
          </div>

          {/* Model Credibility & Method CTA */}
          <div
            style={{
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              <HelpCircle size={14} />
              <span>Production Baseline: scikit-learn <code>MultinomialNB</code> on 13,673 terms</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate('lab')}>
                Compare in Model Evaluation Lab &rarr;
              </button>
              <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate('methodology')}>
                Methodology & Assumptions &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counterfactual What-If Sandbox Modal */}
      <CounterfactualModal
        isOpen={showCounterfactual}
        onClose={() => setShowCounterfactual(false)}
        originalText={reviewText}
        onApplyModifiedText={(newText) => {
          setReviewText(newText);
          // Auto evaluate after apply
          setTimeout(() => {
            handleEvaluate();
          }, 50);
        }}
      />
    </div>
  );
};

