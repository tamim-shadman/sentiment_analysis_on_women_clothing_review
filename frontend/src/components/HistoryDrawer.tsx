import React from 'react';
import { X, Trash2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, History } from 'lucide-react';
import type { HistoryItem } from '../api';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectReview: (text: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectReview,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Session Review History">
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Session History</h3>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-tertiary)',
              }}
            >
              {history.length}
            </span>
          </div>

          <button className="btn-ghost" onClick={onClose} aria-label="Close history drawer" style={{ padding: '0.3rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
              <History size={32} style={{ margin: '0 auto 0.8rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.92rem', marginBottom: '0.4rem' }}>No reviews analyzed yet in this session.</p>
              <span style={{ fontSize: '0.8rem' }}>Evaluated reviews will automatically appear here.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-warm)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    onSelectReview(item.review_text);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span
                      className={item.recommended_ind === 1 ? 'badge-rec' : 'badge-not-rec'}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                    >
                      {item.recommended_ind === 1 ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {item.sentiment_label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {item.timestamp}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4, margin: '0.5rem 0' }}>
                    "{item.review_text.length > 120 ? `${item.review_text.substring(0, 120)}...` : item.review_text}"
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                    <span>{(item.confidence * 100).toFixed(1)}% prob</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      Reload <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {history.length > 0 && (
            <button
              className="btn-secondary"
              style={{ width: '100%', marginBottom: '0.8rem', justifyContent: 'center', color: 'var(--sentiment-not-recommended)', borderColor: 'var(--sentiment-not-recommended-border)' }}
              onClick={onClearHistory}
            >
              <Trash2 size={14} /> Clear Session History
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            <ShieldCheck size={14} color="var(--sentiment-recommended)" />
            <span>Zero external tracking &bull; Stored exclusively in local browser memory</span>
          </div>
        </div>
      </div>
    </>
  );
};
