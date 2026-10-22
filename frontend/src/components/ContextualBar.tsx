import React from 'react';
import { FileSpreadsheet, X, Scale, BarChart3, Layers } from 'lucide-react';
import type { BatchPredictionResponse } from '../api';

export interface ActiveFiltersState {
  recommendation: 'all' | '1' | '0';
  polarity: 'all' | 'Positive' | 'Neutral' | 'Negative';
  department: string;
  aspect: string;
  rating: string;
  searchQuery: string;
}

interface ContextualBarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  batchData: BatchPredictionResponse | null;
  activeFilters: ActiveFiltersState;
  onUpdateFilter: (updates: Partial<ActiveFiltersState>) => void;
  onClearAllFilters: () => void;
  onOpenCohortCompare: () => void;
}

export const ContextualBar: React.FC<ContextualBarProps> = ({
  activeTab,
  onNavigate,
  batchData,
  activeFilters,
  onUpdateFilter,
  onClearAllFilters,
  onOpenCohortCompare,
}) => {
  // If no dataset loaded, don't show contextual bar
  if (!batchData || batchData.predictions.length === 0) {
    return null;
  }

  const activePills: { label: string; onRemove: () => void }[] = [];

  if (activeFilters.recommendation === '1') {
    activePills.push({
      label: 'Recommended (Class 1)',
      onRemove: () => onUpdateFilter({ recommendation: 'all' }),
    });
  } else if (activeFilters.recommendation === '0') {
    activePills.push({
      label: 'Not Recommended (Class 0)',
      onRemove: () => onUpdateFilter({ recommendation: 'all' }),
    });
  }

  if (activeFilters.polarity !== 'all') {
    activePills.push({
      label: `Polarity: ${activeFilters.polarity}`,
      onRemove: () => onUpdateFilter({ polarity: 'all' }),
    });
  }

  if (activeFilters.department !== 'all') {
    activePills.push({
      label: `Dept: ${activeFilters.department}`,
      onRemove: () => onUpdateFilter({ department: 'all' }),
    });
  }

  if (activeFilters.aspect !== 'all') {
    activePills.push({
      label: `Aspect: ${activeFilters.aspect}`,
      onRemove: () => onUpdateFilter({ aspect: 'all' }),
    });
  }

  if (activeFilters.rating !== 'all') {
    activePills.push({
      label: `Rating: ${activeFilters.rating}★`,
      onRemove: () => onUpdateFilter({ rating: 'all' }),
    });
  }

  if (activeFilters.searchQuery.trim().length > 0) {
    activePills.push({
      label: `Search: "${activeFilters.searchQuery}"`,
      onRemove: () => onUpdateFilter({ searchQuery: '' }),
    });
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.55rem 0',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Left: Active Dataset & Scope */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--brand-tint)',
              color: 'var(--brand-primary)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <FileSpreadsheet size={13} />
            <span>Active Batch Corpus: {batchData.valid_processed} Reviews</span>
          </div>

          {/* Active Filter Pills */}
          {activePills.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Active Filters:
              </span>
              {activePills.map((pill, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {pill.label}
                  <button
                    type="button"
                    onClick={pill.onRemove}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                    title="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={onClearAllFilters}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--brand-accent)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0.1rem 0.3rem',
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Cross-View Jump Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn-ghost ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => onNavigate('batch')}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
          >
            <Layers size={13} />
            <span>Review Explorer</span>
          </button>

          <button
            type="button"
            className={`btn-ghost ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => onNavigate('insights')}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
          >
            <BarChart3 size={13} />
            <span>Corpus Insights</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenCohortCompare}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
            title="Open Cohort Comparison Workspace"
          >
            <Scale size={13} />
            <span>Compare Cohorts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
