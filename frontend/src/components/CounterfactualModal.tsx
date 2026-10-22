import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { testCounterfactual } from '../api';
import type { CounterfactualResponse } from '../api';

interface CounterfactualModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApplyModifiedText: (newText: string) => void;
}

export const CounterfactualModal: React.FC<CounterfactualModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApplyModifiedText,
}) => {
  const [modifiedText, setModifiedText] = useState(originalText);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CounterfactualResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync when original text changes
  React.useEffect(() => {
    setModifiedText(originalText);
    setResult(null);
    setError(null);
  }, [originalText]);

  if (!isOpen) return null;

  const handleTestCounterfactual = async () => {
    if (!modifiedText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await testCounterfactual(originalText, modifiedText);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Counterfactual analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubstitute = (findWord: string, replaceWith: string) => {
    const regex = new RegExp('\\b' + findWord + '\\b', 'gi');
    const updated = modifiedText.replace(regex, replaceWith);
    setModifiedText(updated);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(4px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
          animation: 'fadeIn 200ms ease',
        }}
      >
        <button
          className="btn-ghost"
          style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', padding: '0.4rem' }}
          onClick={onClose}
          aria-label="Close Counterfactual Modal"
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <span className="section-eyebrow">Explainable Machine Learning</span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-primary)', marginBottom: '0.4rem' }}>
            What-If & Counterfactual Sandbox
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Modify words in real-time to observe how the Naive Bayes decision boundary and recommendation probability respond.
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            Quick Experiments:
          </span>
          <button
            className="preset-chip"
            onClick={() => handleQuickSubstitute('cheap', 'high quality')}
          >
            "cheap" &rarr; "high quality"
          </button>
          <button
            className="preset-chip"
            onClick={() => handleQuickSubstitute('terrible', 'wonderful')}
          >
            "terrible" &rarr; "wonderful"
          </button>
          <button
            className="preset-chip"
            onClick={() => handleQuickSubstitute('tight', 'flattering')}
          >
            "tight" &rarr; "flattering"
          </button>
          <button
            className="preset-chip"
            onClick={() => setModifiedText(originalText)}
          >
            Reset to Original
          </button>
        </div>

        {/* Comparison Editors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
              ORIGINAL REVIEW
            </label>
            <div
              style={{
                padding: '0.85rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                minHeight: '120px',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {originalText}
            </div>
          </div>

          <div>
            <label htmlFor="counterfactual-input" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.4rem' }}>
              MODIFIED COUNTERFACTUAL TEXT
            </label>
            <textarea
              id="counterfactual-input"
              className="review-textarea"
              style={{ minHeight: '120px', fontSize: '0.9rem' }}
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder="Edit the review text here..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <button
            className="btn-primary"
            onClick={handleTestCounterfactual}
            disabled={loading || !modifiedText.trim()}
          >
            {loading ? <><RefreshCw size={14} className="animate-spin" /> Calculating Shift...</> : <><Sparkles size={14} /> Calculate What-If Shift</>}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--sentiment-not-recommended-light)',
              color: 'var(--sentiment-not-recommended)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Counterfactual Results Card */}
        {result && (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: result.prediction_flipped ? 'var(--brand-tint)' : 'var(--bg-surface-subtle)',
              border: `1px solid ${result.prediction_flipped ? 'var(--brand-primary)' : 'var(--border-medium)'}`,
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--brand-primary)' }}>
                Counterfactual Decision Comparison
              </span>
              {result.prediction_flipped && (
                <span className="brand-badge" style={{ backgroundColor: 'var(--brand-primary)', color: 'white' }}>
                  Decision Flipped!
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>ORIGINAL OUTCOME</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  {result.original.recommended_ind === 1 ? <CheckCircle2 size={16} color="var(--sentiment-recommended)" /> : <XCircle size={16} color="var(--sentiment-not-recommended)" />}
                  <strong style={{ fontSize: '1rem' }}>{result.original.label}</strong>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  P(Rec): {(result.original.prob_recommended * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>MODIFIED OUTCOME</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  {result.modified.recommended_ind === 1 ? <CheckCircle2 size={16} color="var(--sentiment-recommended)" /> : <XCircle size={16} color="var(--sentiment-not-recommended)" />}
                  <strong style={{ fontSize: '1rem' }}>{result.modified.label}</strong>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  P(Rec): {(result.modified.prob_recommended * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>PROBABILITY SHIFT (&Delta;)</span>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '1.3rem',
                    color: result.probability_delta >= 0 ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)',
                    marginTop: '0.2rem',
                  }}
                >
                  {result.probability_delta >= 0 ? '+' : ''}{(result.probability_delta * 100).toFixed(1)}%
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Likelihood adjustment
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
                onClick={() => {
                  onApplyModifiedText(modifiedText);
                  onClose();
                }}
              >
                Apply Modified Text to Analyzer <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
