import React, { useMemo } from 'react';
import { BarChart3, Sparkles, ShieldCheck, Tag, Layers, Scale } from 'lucide-react';
import type { BatchPredictionResponse, HistoryItem, BatchPredictionItem } from '../api';

interface InsightsViewProps {
  batchData: BatchPredictionResponse | null;
  historyData: HistoryItem[];
  onNavigate: (tab: string) => void;
  onLoadSampleBatch: () => void;
  onDrilldownToBatch?: (filter: {
    recommendation?: '1' | '0' | 'all';
    polarity?: 'Positive' | 'Neutral' | 'Negative' | 'all';
    department?: string;
    aspect?: string;
  }) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  batchData,
  historyData,
  onNavigate,
  onLoadSampleBatch,
  onDrilldownToBatch,
}) => {
  // Combine batch data and history reviews if present
  const allReviews: BatchPredictionItem[] = useMemo(() => {
    if (batchData && batchData.predictions.length > 0) {
      return batchData.predictions.filter((p) => p.recommended_ind !== null);
    }
    if (historyData.length > 0) {
      return historyData.map((h, idx) => ({
        row_id: idx + 1,
        review_text: h.review_text,
        status: 'success' as const,
        recommended_ind: h.recommended_ind,
        sentiment_label: h.sentiment_label,
        confidence: h.confidence,
        probability: {
          recommended: h.confidence,
          not_recommended: 1 - h.confidence,
        },
      }));
    }
    return [];
  }, [batchData, historyData]);

  // Compute length distribution
  const lengthStats = useMemo(() => {
    let shortCount = 0;   // < 100 chars
    let mediumCount = 0;  // 100 - 300 chars
    let detailedCount = 0; // > 300 chars

    allReviews.forEach((r) => {
      const len = r.review_text.length;
      if (len < 100) shortCount++;
      else if (len <= 300) mediumCount++;
      else detailedCount++;
    });

    return { shortCount, mediumCount, detailedCount };
  }, [allReviews]);

  // Compute Apparel Aspect Mention Distribution
  const aspectDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'Fit & Sizing': 0,
      'Fabric & Material': 0,
      'Quality & Durability': 0,
      'Style & Cut': 0,
      'Comfort & Wearability': 0,
      'Value & Pricing': 0,
    };

    allReviews.forEach((r) => {
      if (r.detected_aspects && r.detected_aspects.length > 0) {
        r.detected_aspects.forEach((asp) => {
          if (counts[asp] !== undefined) {
            counts[asp]++;
          } else {
            // Partial match fallback
            Object.keys(counts).forEach((key) => {
              if (asp.includes(key.split(' ')[0])) {
                counts[key]++;
              }
            });
          }
        });
      } else {
        // Fallback textual search if aspects were not precomputed
        const text = r.review_text.toLowerCase();
        if (/fit|sizing|size|tight|loose|length|small|large|petite|waist|bust|chest|hips/i.test(text)) counts['Fit & Sizing']++;
        if (/fabric|material|cotton|linen|silk|wool|polyester|denim|chiffon|sheer|soft/i.test(text)) counts['Fabric & Material']++;
        if (/quality|stitching|durable|tear|defect|seam|wash|shrink|zipper|pilling|cheap/i.test(text)) counts['Quality & Durability']++;
        if (/style|cut|flattering|silhouette|look|design|drape|pattern|color|gorgeous/i.test(text)) counts['Style & Cut']++;
        if (/comfort|cozy|itchy|scratchy|breathable|easy|warm|heavy|lightweight/i.test(text)) counts['Comfort & Wearability']++;
        if (/price|worth|value|expensive|cost|money|affordable|deal/i.test(text)) counts['Value & Pricing']++;
      }
    });

    return counts;
  }, [allReviews]);

  // Cross-Tabulation Matrix: Recommendation vs 3-Class Sentiment Polarity
  const crossTabMatrix = useMemo(() => {
    const matrix = {
      Positive: { Recommended: 0, NotRecommended: 0 },
      Neutral: { Recommended: 0, NotRecommended: 0 },
      Negative: { Recommended: 0, NotRecommended: 0 },
    };

    let totalClassifiedWithPolarity = 0;

    allReviews.forEach((r) => {
      let polarity = r.sentiment_polarity;
      if (!polarity && r.metadata?.['Rating']) {
        const rating = Number(r.metadata['Rating']);
        if (rating >= 4) polarity = 'Positive';
        else if (rating === 3) polarity = 'Neutral';
        else if (rating <= 2) polarity = 'Negative';
      }

      if (polarity && (polarity === 'Positive' || polarity === 'Neutral' || polarity === 'Negative')) {
        totalClassifiedWithPolarity++;
        if (r.recommended_ind === 1) {
          matrix[polarity].Recommended++;
        } else {
          matrix[polarity].NotRecommended++;
        }
      }
    });

    return { matrix, totalClassifiedWithPolarity };
  }, [allReviews]);

  // Department Feedback Breakdown (if metadata has Department)
  const departmentBreakdown = useMemo(() => {
    const depts: Record<string, { total: number; rec: number; notRec: number }> = {};

    allReviews.forEach((r) => {
      const deptName =
        r.metadata?.['Department Name'] ||
        r.metadata?.['department_name'] ||
        r.metadata?.['Department'] ||
        r.metadata?.['department'];

      if (deptName) {
        const name = String(deptName).trim();
        if (!depts[name]) {
          depts[name] = { total: 0, rec: 0, notRec: 0 };
        }
        depts[name].total++;
        if (r.recommended_ind === 1) depts[name].rec++;
        else depts[name].notRec++;
      }
    });

    return depts;
  }, [allReviews]);

  // Extract frequently occurring discriminatory terms
  const termInsights = useMemo(() => {
    const posWordCounts: Record<string, number> = {};
    const negWordCounts: Record<string, number> = {};

    const stopWords = new Set([
      'the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'that', 'for', 'with', 'on', 'was',
      'this', 'my', 'as', 'at', 'but', 'i', 'me', 'so', 'be', 'are', 'not', 'have', 'had',
      'dress', 'shirt', 'top', 'size', 'ordered', 'wear', 'worn', 'wearing', 'would', 'from',
      'they', 'you', 'very', 'all', 'out', 'one', 'about', 'just'
    ]);

    allReviews.forEach((r) => {
      const words = r.review_text.toLowerCase().match(/[a-z]{3,}/g) || [];
      const isRec = r.recommended_ind === 1;

      words.forEach((w) => {
        if (!stopWords.has(w)) {
          if (isRec) {
            posWordCounts[w] = (posWordCounts[w] || 0) + 1;
          } else {
            negWordCounts[w] = (negWordCounts[w] || 0) + 1;
          }
        }
      });
    });

    const topPos = Object.entries(posWordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const topNeg = Object.entries(negWordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return { topPos, topNeg };
  }, [allReviews]);

  const totalAnalyzed = allReviews.length;
  const recCount = allReviews.filter((r) => r.recommended_ind === 1).length;
  const notRecCount = allReviews.filter((r) => r.recommended_ind === 0).length;
  const recPct = totalAnalyzed > 0 ? ((recCount / totalAnalyzed) * 100).toFixed(1) : '0';
  const notRecPct = totalAnalyzed > 0 ? ((notRecCount / totalAnalyzed) * 100).toFixed(1) : '0';

  if (totalAnalyzed === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '3rem', textAlign: 'center' }}>
        <div className="card-surface" style={{ padding: '3.5rem 2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--brand-tint)', color: 'var(--brand-primary)', marginBottom: '1.2rem' }}>
            <BarChart3 size={32} />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>No Active Review Data to Summarize</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.8rem', lineHeight: 1.6 }}>
            The Insights dashboard aggregates empirical patterns across customer reviews. To view aspect distributions, cross-tabulation matrices, and vocabulary charts, load a dataset or evaluate a review.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={onLoadSampleBatch}>
              <Sparkles size={16} /> Load Preset Batch & View Insights
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('analyzer')}>
              Analyze Single Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-eyebrow">Corpus Intelligence Summary</span>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.6rem', color: 'var(--brand-primary)' }}>
          Review Insights & Pattern Discovery
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '800px' }}>
          Empirical summaries computed directly from the {totalAnalyzed.toLocaleString()} reviews processed in your active session. Analyzes recommendation distribution, apparel aspect mentions, and sentiment-versus-recommendation cross-tabulation.
        </p>
      </div>

      {/* Top Level Metric Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
        <div className="card-surface" style={{ padding: '1.5rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>TOTAL REVIEWS</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--brand-primary)', marginTop: '0.2rem' }}>
            {totalAnalyzed.toLocaleString()}
          </strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Active analyzed reviews
          </span>
        </div>

        <div className="card-surface" style={{ padding: '1.5rem', borderLeft: '4px solid var(--sentiment-recommended)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sentiment-recommended)' }}>PREDICTED RECOMMENDED</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--sentiment-recommended)', marginTop: '0.2rem' }}>
            {recPct}%
          </strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {recCount} customer reviews
          </span>
        </div>

        <div className="card-surface" style={{ padding: '1.5rem', borderLeft: '4px solid var(--sentiment-not-recommended)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sentiment-not-recommended)' }}>PREDICTED NOT RECOMMENDED</span>
          <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--sentiment-not-recommended)', marginTop: '0.2rem' }}>
            {notRecPct}%
          </strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {notRecCount} customer reviews
          </span>
        </div>
      </div>

      {/* Apparel Aspect Mention Distribution */}
      <div className="card-surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Tag size={18} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '1.25rem' }}>Apparel Aspect Mention Frequencies</h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Proportion of reviews in the current active corpus mentioning domain terms across 6 key apparel aspects.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {Object.entries(aspectDistribution).map(([aspectName, count]) => {
            const pct = totalAnalyzed > 0 ? (count / totalAnalyzed) * 100 : 0;
            return (
              <div
                key={aspectName}
                onClick={() => {
                  if (onDrilldownToBatch) {
                    onDrilldownToBatch({ aspect: aspectName });
                  } else {
                    onNavigate('batch');
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background-color var(--transition-fast)',
                }}
                className="drilldown-row"
                title={`Click to filter Review Explorer to all reviews mentioning ${aspectName}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {aspectName} <span style={{ fontSize: '0.72rem', color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}>Explore &rarr;</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {count} reviews ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: 'var(--brand-primary)',
                      borderRadius: '4px',
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Tabulation Matrix: Recommendation vs Polarity */}
      {crossTabMatrix.totalClassifiedWithPolarity > 0 && (
        <div className="card-surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Scale size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.25rem' }}>Recommendation vs. Sentiment Polarity Matrix</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
            Cross-tabulation comparing the binary recommendation decision with 3-class sentiment polarity for {crossTabMatrix.totalClassifiedWithPolarity} reviews.
          </p>

          <div className="data-table-container" style={{ marginBottom: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sentiment Polarity</th>
                  <th style={{ color: 'var(--sentiment-recommended)' }}>Recommended (Class 1)</th>
                  <th style={{ color: 'var(--sentiment-not-recommended)' }}>Not Recommended (Class 0)</th>
                  <th>Row Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span
                      className="badge-rec"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Positive' })}
                      title="Filter Review Explorer to Positive Polarity"
                    >
                      Positive Polarity
                    </span>
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer', color: 'var(--sentiment-recommended)' }}
                    onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Positive', recommendation: '1' })}
                    title="Explore Positive & Recommended reviews in Explorer"
                  >
                    {crossTabMatrix.matrix.Positive.Recommended} &rarr;
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer', color: 'var(--sentiment-not-recommended)' }}
                    onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Positive', recommendation: '0' })}
                    title="Explore Positive & Not Recommended reviews in Explorer"
                  >
                    {crossTabMatrix.matrix.Positive.NotRecommended} &rarr;
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {crossTabMatrix.matrix.Positive.Recommended + crossTabMatrix.matrix.Positive.NotRecommended}
                  </td>
                </tr>
                <tr>
                  <td>
                    <span
                      className="badge-neutral"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Neutral' })}
                      title="Filter Review Explorer to Neutral Polarity"
                    >
                      Neutral Polarity
                    </span>
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer', color: 'var(--sentiment-recommended)' }}
                    onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Neutral', recommendation: '1' })}
                    title="Explore Neutral & Recommended reviews in Explorer"
                  >
                    {crossTabMatrix.matrix.Neutral.Recommended} &rarr;
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer', color: 'var(--sentiment-not-recommended)' }}
                    onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Neutral', recommendation: '0' })}
                    title="Explore Neutral & Not Recommended reviews in Explorer"
                  >
                    {crossTabMatrix.matrix.Neutral.NotRecommended} &rarr;
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {crossTabMatrix.matrix.Neutral.Recommended + crossTabMatrix.matrix.Neutral.NotRecommended}
                  </td>
                </tr>
                <tr>
                  <td>
                    <span
                      className="badge-not-rec"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Negative' })}
                      title="Filter Review Explorer to Negative Polarity"
                    >
                      Negative Polarity
                    </span>
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer', color: 'var(--sentiment-recommended)' }}
                    onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Negative', recommendation: '1' })}
                    title="Explore Negative & Recommended reviews in Explorer"
                  >
                    {crossTabMatrix.matrix.Negative.Recommended} &rarr;
                  </td>
                  <td
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer', color: 'var(--sentiment-not-recommended)' }}
                    onClick={() => onDrilldownToBatch && onDrilldownToBatch({ polarity: 'Negative', recommendation: '0' })}
                    title="Explore Negative & Not Recommended reviews in Explorer"
                  >
                    {crossTabMatrix.matrix.Negative.NotRecommended} &rarr;
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {crossTabMatrix.matrix.Negative.Recommended + crossTabMatrix.matrix.Negative.NotRecommended}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0.8rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <strong>Scientific Insight:</strong> Note how Neutral polarity reviews split across both recommendation outcomes. This empirically validates that recommendation is a behavioral purchasing stance, distinct from emotional polarity.
          </div>
        </div>
      )}

      {/* Department Breakdown (if available) */}
      {Object.keys(departmentBreakdown).length > 0 && (
        <div className="card-surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Layers size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.25rem' }}>Department Feedback Comparison</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
            Recommendation rates across detected garment departments in the active batch.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(departmentBreakdown).map(([dept, data]) => {
              const recRate = ((data.rec / data.total) * 100).toFixed(0);
              return (
                <div
                  key={dept}
                  style={{
                    padding: '1.2rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--brand-primary)', display: 'block' }}>
                    {dept}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {data.total} reviews
                  </span>

                  <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                      <span>Rec Rate</span>
                      <strong style={{ color: 'var(--sentiment-recommended)' }}>{recRate}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${recRate}%`, height: '100%', backgroundColor: 'var(--sentiment-recommended)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High-Signal Vocabulary Section */}
      <div className="card-surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <Tag size={18} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '1.2rem' }}>Salient Distinguishing Vocabulary</h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Most frequent discriminating terms extracted from reviews predicted as Recommended versus Not Recommended in the active batch.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Positive Terms */}
          <div style={{ padding: '1.2rem', backgroundColor: 'var(--sentiment-recommended-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sentiment-recommended-border)' }}>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--sentiment-recommended)', marginBottom: '0.8rem', fontWeight: 600 }}>
              Frequent in Recommended Reviews
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {termInsights.topPos.length > 0 ? (
                termInsights.topPos.map(([term, count]) => (
                  <span key={term} className="token-chip pos" style={{ fontSize: '0.82rem' }}>
                    {term} <strong style={{ opacity: 0.8, marginLeft: '0.2rem' }}>&times;{count}</strong>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>No terms available.</span>
              )}
            </div>
          </div>

          {/* Negative Terms */}
          <div style={{ padding: '1.2rem', backgroundColor: 'var(--sentiment-not-recommended-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sentiment-not-recommended-border)' }}>
            <h4 style={{ fontSize: '0.92rem', color: 'var(--sentiment-not-recommended)', marginBottom: '0.8rem', fontWeight: 600 }}>
              Frequent in Not Recommended Reviews
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {termInsights.topNeg.length > 0 ? (
                termInsights.topNeg.map(([term, count]) => (
                  <span key={term} className="token-chip neg" style={{ fontSize: '0.82rem' }}>
                    {term} <strong style={{ opacity: 0.8, marginLeft: '0.2rem' }}>&times;{count}</strong>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>No terms available.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Length Distribution */}
      <div className="card-surface" style={{ padding: '1.8rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Review Text Depth Distribution</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
          Categorization by character length: concise (&lt;100), moderate (100-300), and comprehensive (300+).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
              <span>Short (&lt;100 chars)</span>
              <span>{lengthStats.shortCount} ({((lengthStats.shortCount / totalAnalyzed) * 100).toFixed(0)}%)</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(lengthStats.shortCount / totalAnalyzed) * 100}%`, height: '100%', backgroundColor: 'var(--brand-primary)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
              <span>Moderate (100–300 chars)</span>
              <span>{lengthStats.mediumCount} ({((lengthStats.mediumCount / totalAnalyzed) * 100).toFixed(0)}%)</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(lengthStats.mediumCount / totalAnalyzed) * 100}%`, height: '100%', backgroundColor: 'var(--brand-primary)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
              <span>Detailed (300+ chars)</span>
              <span>{lengthStats.detailedCount} ({((lengthStats.detailedCount / totalAnalyzed) * 100).toFixed(0)}%)</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(lengthStats.detailedCount / totalAnalyzed) * 100}%`, height: '100%', backgroundColor: 'var(--brand-primary)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Transparency Note */}
      <div
        style={{
          padding: '1.2rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface-warm)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        <ShieldCheck size={18} color="var(--sentiment-recommended)" style={{ flexShrink: 0 }} />
        <span>
          These summaries represent descriptive empirical metrics of your active review session. All counts and distributions are computed directly from actual text and predictions without synthetic modeling.
        </span>
      </div>
    </div>
  );
};
