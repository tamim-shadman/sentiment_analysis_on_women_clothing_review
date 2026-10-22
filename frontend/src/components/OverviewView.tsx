import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Cpu,
  UploadCloud,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { predictSingleReview } from '../api';
import type { SinglePredictionResponse } from '../api';
import { TokenHighlightText } from './TokenHighlightText';

interface OverviewViewProps {
  onNavigate: (tab: string) => void;
  onSelectSampleForAnalyzer: (text: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onSelectSampleForAnalyzer,
}) => {
  const [quickInput, setQuickInput] = useState(
    'I absolutely love this linen wrap dress! The cut is flattering, the fabric breathes nicely, and the stitching is top tier.'
  );
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<SinglePredictionResponse | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  const sampleSnippets = [
    {
      label: '5-Star Fit & Fabric',
      text: 'I absolutely love this linen wrap dress! The cut is flattering, the fabric breathes nicely, and the stitching is top tier.',
    },
    {
      label: '1-Star Defect & Sizing',
      text: 'Very disappointed with the quality. Thin, scratchy synthetic material that tore at the waist seam after one wear. Returning it.',
    },
    {
      label: 'Mixed Petite Feedback',
      text: 'Gorgeous color and soft fabric, but the bust sizing runs very tight and the straps are awkwardly long. Had to return.',
    },
  ];

  const handleQuickEvaluate = async () => {
    if (!quickInput.trim()) return;
    setQuickLoading(true);
    setQuickError(null);
    try {
      const res = await predictSingleReview(quickInput);
      setQuickResult(res);
    } catch (err: any) {
      setQuickError(err.message || 'Inference error');
      setQuickResult(null);
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem', paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      {/* Editorial Hero Section */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <div>
            <span className="section-eyebrow">Fashion Editorial Meets Review Analytics</span>
            <h1 style={{ fontSize: 'clamp(2.4rem, 4.2vw, 3.6rem)', letterSpacing: '-0.025em', color: 'var(--brand-primary)', marginBottom: '1rem', lineHeight: 1.12 }}>
              Every Review Has a Story. Find the Signal.
            </h1>
            <p style={{ fontSize: '1.12rem', lineHeight: 1.65, color: 'var(--text-secondary)', maxWidth: '580px' }}>
              Explore how machine learning interprets women's clothing reviews and predicts whether customers recommend a product. Decompose customer feedback into exact additive token log-odds, fashion aspect dimensions, and calibrated decision boundaries.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
            <button className="btn-primary" onClick={() => onNavigate('analyzer')}>
              Analyze a Review <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('batch')}>
              <UploadCloud size={16} /> Batch CSV Workspace
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('lab')}>
              <Cpu size={16} /> Model Evaluation Lab
            </button>
            <button className="btn-ghost" onClick={() => onNavigate('methodology')}>
              <BookOpen size={16} /> Methodology
            </button>
          </div>

          {/* 4-Metric Empirical KPI Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '1.2rem',
              paddingTop: '1.2rem',
              borderTop: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div>
              <strong style={{ color: 'var(--brand-primary)', display: 'block', fontSize: '1.25rem', fontWeight: 700 }}>22,641</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Dataset Reviews</span>
            </div>
            <div>
              <strong style={{ color: 'var(--sentiment-recommended)', display: 'block', fontSize: '1.25rem', fontWeight: 700 }}>88.76%</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Test Accuracy</span>
            </div>
            <div>
              <strong style={{ color: 'var(--brand-primary)', display: 'block', fontSize: '1.25rem', fontWeight: 700 }}>0.9183</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Test ROC-AUC</span>
            </div>
            <div>
              <strong style={{ color: 'var(--brand-primary)', display: 'block', fontSize: '1.25rem', fontWeight: 700 }}>0.9312</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Recommended F1</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Hero Preview Card */}
        <div className="card-surface" style={{ padding: '2rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span className="section-eyebrow" style={{ marginBottom: '0.2rem' }}>Live Model Sandbox</span>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--brand-primary)' }}>Test Instant Inference</h3>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                backgroundColor: 'var(--brand-tint)',
                color: 'var(--brand-primary)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
              }}
            >
              MultinomialNB Active
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            {sampleSnippets.map((s, idx) => (
              <button
                key={idx}
                className="preset-chip"
                onClick={() => {
                  setQuickInput(s.text);
                  setQuickResult(null);
                  setQuickError(null);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            className="review-textarea"
            style={{ minHeight: '110px', fontSize: '0.92rem', marginBottom: '0.8rem' }}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Type or paste a women's clothing review..."
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {quickInput.length} chars &bull; {quickInput.trim().split(/\s+/).length} words
            </span>
            <button
              className="btn-primary"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem' }}
              onClick={handleQuickEvaluate}
              disabled={quickLoading || !quickInput.trim()}
            >
              {quickLoading ? (
                <>Evaluating Tokens...</>
              ) : (
                <>
                  <Sparkles size={14} /> Run Live Prediction
                </>
              )}
            </button>
          </div>

          {/* Quick Result Drawer with Inline Token Attribution */}
          {quickResult && (
            <div
              style={{
                marginTop: '1.2rem',
                padding: '1.2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: `1px solid ${quickResult.recommended_ind === 1 ? 'var(--sentiment-recommended-border)' : 'var(--sentiment-not-recommended-border)'}`,
                animation: 'fadeIn 200ms ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: quickResult.recommended_ind === 1 ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)',
                  }}
                >
                  {quickResult.recommended_ind === 1 ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  PREDICTED: {quickResult.sentiment_label.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Posterior: {(quickResult.confidence * 100).toFixed(1)}%
                </span>
              </div>

              {/* Inline Token Attribution in Preview */}
              {quickResult.token_weights_map && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', marginBottom: '0.8rem', fontSize: '0.9rem' }}>
                  <TokenHighlightText text={quickInput} tokenWeightsMap={quickResult.token_weights_map} />
                </div>
              )}

              {/* Probability bar */}
              <div className="prob-bar-container" style={{ margin: '0.5rem 0' }}>
                <div className="prob-segment-rec" style={{ width: `${quickResult.probability.recommended * 100}%` }} />
                <div className="prob-segment-not-rec" style={{ width: `${quickResult.probability.not_recommended * 100}%` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Decision Threshold: P &ge; 0.50
                </span>
                <button
                  className="btn-ghost"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.82rem', color: 'var(--brand-primary)', textDecoration: 'underline' }}
                  onClick={() => {
                    onSelectSampleForAnalyzer(quickInput);
                    onNavigate('analyzer');
                  }}
                >
                  Explore in Deep Analyzer & What-If &rarr;
                </button>
              </div>
            </div>
          )}

          {quickError && (
            <div
              style={{
                marginTop: '1.2rem',
                padding: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--sentiment-not-recommended-light)',
                border: '1px solid var(--sentiment-not-recommended-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--sentiment-not-recommended)',
              }}
            >
              <AlertCircle size={16} />
              <span>{quickError}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3-Step Inference Architecture Lifecycle */}
      <section>
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          <span className="section-eyebrow">Inference Lifecycle</span>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.6rem', color: 'var(--brand-primary)' }}>
            How Customer Language Becomes Intelligence
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            A transparent machine learning architecture that avoids black-box ambiguity in favor of mathematically exact additive text attribution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.8rem' }}>
          <div className="card-surface" style={{ padding: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--brand-tint)', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
              <Layers size={22} />
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>STAGE 01</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>Term Frequency Vectorization</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The review text is mapped into term frequencies across 13,673 fitted vocabulary unigrams using <code>CountVectorizer</code>, strictly isolated from held-out test splits.
            </p>
          </div>

          <div className="card-surface" style={{ padding: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--brand-tint)', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
              <Cpu size={22} />
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>STAGE 02</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>Multinomial Naive Bayes</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Computes log-prior distributions combined with class-conditional token likelihoods, applying Laplace smoothing to reliably classify recommendation propensity with 88.76% accuracy.
            </p>
          </div>

          <div className="card-surface" style={{ padding: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--brand-tint)', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
              <BarChart3 size={22} />
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>STAGE 03</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>Faithful Log-Odds Attribution</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Decomposes decision boundaries into mathematically exact token weights: <code>log P(w | Rec) - log P(w | Not Rec)</code>, revealing which linguistic features drove the outcome.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Exploration Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.8rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="section-eyebrow">Platform Capabilities</span>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--brand-primary)' }}>Engineered for Merchandising Insights</h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            4 core workspaces
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div
            className="card-surface"
            style={{ padding: '1.8rem', cursor: 'pointer' }}
            onClick={() => onNavigate('analyzer')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="brand-badge">Interactive</span>
              <ArrowRight size={16} color="var(--brand-primary)" />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--brand-primary)' }}>Single-Review Analyzer</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Dual-model classification, inline token highlights, apparel aspect quotes, and interactive What-If sandbox.
            </p>
          </div>

          <div
            className="card-surface"
            style={{ padding: '1.8rem', cursor: 'pointer' }}
            onClick={() => onNavigate('batch')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="brand-badge">High Throughput</span>
              <ArrowRight size={16} color="var(--brand-primary)" />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--brand-primary)' }}>Batch Intelligence</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Process up to 1,000 reviews at once. Filter by department or polarity, inspect in drawers, and compare reviews side-by-side.
            </p>
          </div>

          <div
            className="card-surface"
            style={{ padding: '1.8rem', cursor: 'pointer' }}
            onClick={() => onNavigate('insights')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="brand-badge">Corpus Analytics</span>
              <ArrowRight size={16} color="var(--brand-primary)" />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--brand-primary)' }}>Insights & Patterns</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Aspect mention frequencies, recommendation vs sentiment cross-tabulation matrix, and department feedback breakdowns.
            </p>
          </div>

          <div
            className="card-surface"
            style={{ padding: '1.8rem', cursor: 'pointer' }}
            onClick={() => onNavigate('lab')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="brand-badge">Model R&D</span>
              <ArrowRight size={16} color="var(--brand-primary)" />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--brand-primary)' }}>Evaluation Lab</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Benchmark MultinomialNB against Logistic Regression and SVM with confusion matrices and diagnostic false positive/negative cases.
            </p>
          </div>
        </div>
      </section>

      {/* Responsible Model Banner */}
      <section
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-warm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '720px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={20} color="var(--sentiment-recommended)" />
            <h4 style={{ fontSize: '1.1rem', color: 'var(--brand-primary)' }}>Responsible AI & Empirical Verification</h4>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every score and metric displayed is grounded in verified evaluation on 4,529 held-out test reviews. Predictions model historical customer recommendation propensity (Recommended IND) rather than an infallible guarantee of individual apparel satisfaction.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => onNavigate('methodology')}>
          Read Full Methodology &rarr;
        </button>
      </section>
    </div>
  );
};
