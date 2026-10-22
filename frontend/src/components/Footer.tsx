import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer
      style={{
        marginTop: '5rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        padding: '3rem 0 2.5rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}
        >
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.6rem', color: 'var(--brand-primary)' }}>
              ATELIER // INTEL
            </h4>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              Transforming women's clothing reviews into rigorous product recommendation intelligence using natural language processing and verified Bayesian inference.
            </p>
          </div>

          <div>
            <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem', color: 'var(--text-tertiary)' }}>
              Platform Navigation
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
              <li>
                <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate('overview')}>Overview & Hero</button>
              </li>
              <li>
                <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate('analyzer')}>Single-Review Analyzer</button>
              </li>
              <li>
                <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate('batch')}>Batch Review Intelligence</button>
              </li>
              <li>
                <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate('insights')}>Corpus Insights & Patterns</button>
              </li>
              <li>
                <button className="btn-ghost" style={{ padding: 0 }} onClick={() => onNavigate('lab')}>Model Evaluation Lab</button>
              </li>
            </ul>
          </div>

          <div>
            <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem', color: 'var(--text-tertiary)' }}>
              Model Governance
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
              <li>
                <button className="btn-ghost" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => onNavigate('methodology')}>
                  <BookOpen size={14} /> Full Methodology
                </button>
              </li>
              <li>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="var(--sentiment-recommended)" /> 88.76% Verified Test Accuracy
                </span>
              </li>
              <li style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                Zero Fabricated Confidence Metrics
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div>
            &copy; 2026 Atelier Review Intelligence &bull; Python Flask + scikit-learn + Vite React
          </div>
          <div>
            Binary Recommendation Model: <code>CountVectorizer + MultinomialNB</code>
          </div>
        </div>
      </div>
    </footer>
  );
};
