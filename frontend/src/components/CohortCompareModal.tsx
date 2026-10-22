import React, { useState, useMemo } from 'react';
import { X, Scale, Eye } from 'lucide-react';
import type { BatchPredictionResponse, BatchPredictionItem } from '../api';

interface CohortCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchData: BatchPredictionResponse | null;
  onApplyCohortFilter: (filter: {
    recommendation?: '1' | '0' | 'all';
    polarity?: 'Positive' | 'Neutral' | 'Negative' | 'all';
    department?: string;
    aspect?: string;
  }) => void;
}

type DimensionType = 'recommendation' | 'polarity' | 'department' | 'aspect';

export const CohortCompareModal: React.FC<CohortCompareModalProps> = ({
  isOpen,
  onClose,
  batchData,
  onApplyCohortFilter,
}) => {
  const [dimension, setDimension] = useState<DimensionType>('recommendation');
  const [cohortAValue, setCohortAValue] = useState<string>('1');
  const [cohortBValue, setCohortBValue] = useState<string>('0');

  // Extract unique departments and aspects from dataset
  const availableDepartments = useMemo(() => {
    if (!batchData) return [];
    const depts = new Set<string>();
    batchData.predictions.forEach((p) => {
      const dept =
        p.metadata?.['Department Name'] ||
        p.metadata?.['department_name'] ||
        p.metadata?.['Department'] ||
        p.metadata?.['department'];
      if (dept) depts.add(String(dept).trim());
    });
    return Array.from(depts);
  }, [batchData]);

  const aspectsList = [
    'Fit & Sizing',
    'Fabric & Material',
    'Quality & Durability',
    'Style & Cut',
    'Comfort & Wearability',
    'Value & Pricing',
  ];

  // Sync default options when dimension changes
  const handleDimensionChange = (newDim: DimensionType) => {
    setDimension(newDim);
    if (newDim === 'recommendation') {
      setCohortAValue('1');
      setCohortBValue('0');
    } else if (newDim === 'polarity') {
      setCohortAValue('Positive');
      setCohortBValue('Negative');
    } else if (newDim === 'department') {
      setCohortAValue(availableDepartments[0] || 'Tops');
      setCohortBValue(availableDepartments[1] || availableDepartments[0] || 'Dresses');
    } else if (newDim === 'aspect') {
      setCohortAValue(aspectsList[0]);
      setCohortBValue(aspectsList[1]);
    }
  };

  // Helper function to test if a review belongs to a cohort
  const matchesCohort = (item: BatchPredictionItem, dim: DimensionType, val: string): boolean => {
    if (dim === 'recommendation') {
      return String(item.recommended_ind) === val;
    }
    if (dim === 'polarity') {
      return item.sentiment_polarity === val;
    }
    if (dim === 'department') {
      const dept =
        item.metadata?.['Department Name'] ||
        item.metadata?.['department_name'] ||
        item.metadata?.['Department'] ||
        item.metadata?.['department'];
      return String(dept).trim().toLowerCase() === val.toLowerCase();
    }
    if (dim === 'aspect') {
      if (item.detected_aspects && item.detected_aspects.includes(val)) return true;
      const text = item.review_text.toLowerCase();
      if (val === 'Fit & Sizing' && /fit|sizing|size|tight|loose|length|small|large/i.test(text)) return true;
      if (val === 'Fabric & Material' && /fabric|material|cotton|linen|silk|wool/i.test(text)) return true;
      if (val === 'Quality & Durability' && /quality|stitching|durable|tear|defect|seam/i.test(text)) return true;
      if (val === 'Style & Cut' && /style|cut|flattering|silhouette|look|design/i.test(text)) return true;
      if (val === 'Comfort & Wearability' && /comfort|cozy|itchy|scratchy|breathable/i.test(text)) return true;
      if (val === 'Value & Pricing' && /price|worth|value|expensive|cost/i.test(text)) return true;
      return false;
    }
    return false;
  };

  // Compute empirical cohort statistics
  const computeStats = (cohortItems: BatchPredictionItem[]) => {
    const total = cohortItems.length;
    if (total === 0) {
      return {
        count: 0,
        recRate: 0,
        recCount: 0,
        notRecCount: 0,
        avgLength: 0,
        avgConfidence: 0,
        polarityCounts: { Positive: 0, Neutral: 0, Negative: 0 },
        topAspects: [] as { aspect: string; count: number }[],
      };
    }

    let recCount = 0;
    let totalLen = 0;
    let totalConf = 0;
    const polarities = { Positive: 0, Neutral: 0, Negative: 0 };
    const aspectCounts: Record<string, number> = {};

    cohortItems.forEach((r) => {
      if (r.recommended_ind === 1) recCount++;
      totalLen += r.review_text.length;
      totalConf += r.confidence ?? 0;

      if (r.sentiment_polarity && (r.sentiment_polarity in polarities)) {
        polarities[r.sentiment_polarity as keyof typeof polarities]++;
      }

      const aspects = r.detected_aspects || [];
      aspects.forEach((asp) => {
        aspectCounts[asp] = (aspectCounts[asp] || 0) + 1;
      });
    });

    const topAspects = Object.entries(aspectCounts)
      .map(([aspect, count]) => ({ aspect, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      count: total,
      recRate: (recCount / total) * 100,
      recCount,
      notRecCount: total - recCount,
      avgLength: Math.round(totalLen / total),
      avgConfidence: (totalConf / total) * 100,
      polarityCounts: polarities,
      topAspects,
    };
  };

  const allPredictions = batchData?.predictions || [];
  const cohortAItems = useMemo(
    () => allPredictions.filter((p) => matchesCohort(p, dimension, cohortAValue)),
    [allPredictions, dimension, cohortAValue]
  );
  const cohortBItems = useMemo(
    () => allPredictions.filter((p) => matchesCohort(p, dimension, cohortBValue)),
    [allPredictions, dimension, cohortBValue]
  );

  const statsA = useMemo(() => computeStats(cohortAItems), [cohortAItems]);
  const statsB = useMemo(() => computeStats(cohortBItems), [cohortBItems]);

  const recRateDiff = statsA.recRate - statsB.recRate;
  const lengthDiff = statsA.avgLength - statsB.avgLength;

  if (!isOpen) return null;

  return (
    <div
      className="drawer-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cohort-compare-title"
    >
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-dropdown)',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--brand-tint)',
                color: 'var(--brand-primary)',
              }}
            >
              <Scale size={20} />
            </span>
            <div>
              <h3 id="cohort-compare-title" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                Interactive Cohort Comparison Workspace
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Evaluate empirical metric divergence across review subsets in the active dataset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
            aria-label="Close comparison workspace"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {/* Dimension Selector */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-surface-warm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Comparison Dimension:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['recommendation', 'polarity', 'department', 'aspect'] as DimensionType[]).map((dim) => (
                <button
                  key={dim}
                  type="button"
                  onClick={() => handleDimensionChange(dim)}
                  className={`preset-chip ${dimension === dim ? 'active' : ''}`}
                  style={{
                    backgroundColor: dimension === dim ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: dimension === dim ? 'white' : 'var(--text-secondary)',
                    borderColor: dimension === dim ? 'var(--brand-primary)' : 'var(--border-medium)',
                    fontWeight: dimension === dim ? 600 : 400,
                  }}
                >
                  {dim === 'recommendation' && 'Recommendation Decision'}
                  {dim === 'polarity' && 'Sentiment Polarity'}
                  {dim === 'department' && 'Product Department'}
                  {dim === 'aspect' && 'Apparel Aspect'}
                </button>
              ))}
            </div>
          </div>

          {/* Cohort Selectors & Side-by-Side Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'stretch', marginBottom: '1.5rem' }}>
            {/* Cohort A Card */}
            <div
              className="card-surface"
              style={{
                padding: '1.25rem',
                border: '1px solid var(--border-medium)',
                borderTop: '4px solid var(--brand-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cohort A
                </span>
                <div style={{ marginTop: '0.4rem' }}>
                  {dimension === 'recommendation' && (
                    <select
                      value={cohortAValue}
                      onChange={(e) => setCohortAValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      <option value="1">Recommended (Class 1)</option>
                      <option value="0">Not Recommended (Class 0)</option>
                    </select>
                  )}
                  {dimension === 'polarity' && (
                    <select
                      value={cohortAValue}
                      onChange={(e) => setCohortAValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      <option value="Positive">Positive Polarity</option>
                      <option value="Neutral">Neutral Polarity</option>
                      <option value="Negative">Negative Polarity</option>
                    </select>
                  )}
                  {dimension === 'department' && (
                    <select
                      value={cohortAValue}
                      onChange={(e) => setCohortAValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {availableDepartments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                  {dimension === 'aspect' && (
                    <select
                      value={cohortAValue}
                      onChange={(e) => setCohortAValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {aspectsList.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sample Size:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {statsA.count} reviews ({allPredictions.length > 0 ? ((statsA.count / allPredictions.length) * 100).toFixed(0) : 0}%)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Recommendation Rate:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: statsA.recRate >= 50 ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)' }}>
                    {statsA.recRate.toFixed(1)}%
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Avg Review Length:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{statsA.avgLength} chars</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Avg Confidence:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{statsA.avgConfidence.toFixed(1)}%</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Polarity Breakdown:
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--sentiment-recommended)' }}>+{statsA.polarityCounts.Positive}</span>
                    <span style={{ color: 'var(--sentiment-neutral)' }}>~{statsA.polarityCounts.Neutral}</span>
                    <span style={{ color: 'var(--sentiment-not-recommended)' }}>-{statsA.polarityCounts.Negative}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onApplyCohortFilter({
                    recommendation: dimension === 'recommendation' ? (cohortAValue as '1' | '0') : undefined,
                    polarity: dimension === 'polarity' ? (cohortAValue as 'Positive' | 'Neutral' | 'Negative') : undefined,
                    department: dimension === 'department' ? cohortAValue : undefined,
                    aspect: dimension === 'aspect' ? cohortAValue : undefined,
                  });
                  onClose();
                }}
                style={{ marginTop: '1rem', width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
              >
                <Eye size={14} /> Filter Table to Cohort A
              </button>
            </div>

            {/* VS Divider with Delta */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'var(--text-tertiary)',
                  marginBottom: '1rem',
                }}
              >
                VS
              </div>

              <div
                style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  minWidth: '120px',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase' }}>
                  Δ Rec Rate
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: recRateDiff >= 0 ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)',
                  }}
                >
                  {recRateDiff >= 0 ? `+${recRateDiff.toFixed(1)}%` : `${recRateDiff.toFixed(1)}%`}
                </span>

                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'block', marginTop: '0.4rem', textTransform: 'uppercase' }}>
                  Δ Length
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {lengthDiff >= 0 ? `+${lengthDiff} ch` : `${lengthDiff} ch`}
                </span>
              </div>
            </div>

            {/* Cohort B Card */}
            <div
              className="card-surface"
              style={{
                padding: '1.25rem',
                border: '1px solid var(--border-medium)',
                borderTop: '4px solid var(--sentiment-neutral)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--sentiment-neutral)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cohort B
                </span>
                <div style={{ marginTop: '0.4rem' }}>
                  {dimension === 'recommendation' && (
                    <select
                      value={cohortBValue}
                      onChange={(e) => setCohortBValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      <option value="1">Recommended (Class 1)</option>
                      <option value="0">Not Recommended (Class 0)</option>
                    </select>
                  )}
                  {dimension === 'polarity' && (
                    <select
                      value={cohortBValue}
                      onChange={(e) => setCohortBValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      <option value="Positive">Positive Polarity</option>
                      <option value="Neutral">Neutral Polarity</option>
                      <option value="Negative">Negative Polarity</option>
                    </select>
                  )}
                  {dimension === 'department' && (
                    <select
                      value={cohortBValue}
                      onChange={(e) => setCohortBValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {availableDepartments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                  {dimension === 'aspect' && (
                    <select
                      value={cohortBValue}
                      onChange={(e) => setCohortBValue(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {aspectsList.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sample Size:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {statsB.count} reviews ({allPredictions.length > 0 ? ((statsB.count / allPredictions.length) * 100).toFixed(0) : 0}%)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Recommendation Rate:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: statsB.recRate >= 50 ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)' }}>
                    {statsB.recRate.toFixed(1)}%
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Avg Review Length:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{statsB.avgLength} chars</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Avg Confidence:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{statsB.avgConfidence.toFixed(1)}%</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                    Polarity Breakdown:
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--sentiment-recommended)' }}>+{statsB.polarityCounts.Positive}</span>
                    <span style={{ color: 'var(--sentiment-neutral)' }}>~{statsB.polarityCounts.Neutral}</span>
                    <span style={{ color: 'var(--sentiment-not-recommended)' }}>-{statsB.polarityCounts.Negative}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onApplyCohortFilter({
                    recommendation: dimension === 'recommendation' ? (cohortBValue as '1' | '0') : undefined,
                    polarity: dimension === 'polarity' ? (cohortBValue as 'Positive' | 'Neutral' | 'Negative') : undefined,
                    department: dimension === 'department' ? cohortBValue : undefined,
                    aspect: dimension === 'aspect' ? cohortBValue : undefined,
                  });
                  onClose();
                }}
                style={{ marginTop: '1rem', width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
              >
                <Eye size={14} /> Filter Table to Cohort B
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-subtle)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Comparing {statsA.count + statsB.count} total reviews across selected dimensions
          </span>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.45rem 1.25rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
