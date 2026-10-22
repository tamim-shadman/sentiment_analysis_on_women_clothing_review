import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { fetchModelComparison } from '../api';
import type { ModelComparisonData } from '../api';

interface ModelLabViewProps {
  onNavigate?: (tab: string) => void;
  onSelectSampleForAnalyzer?: (text: string) => void;
}

export const ModelLabView: React.FC<ModelLabViewProps> = ({ onNavigate, onSelectSampleForAnalyzer }) => {
  const [comparison, setComparison] = useState<ModelComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('MultinomialNB (Baseline)');

  useEffect(() => {
    setLoading(true);
    fetchModelComparison()
      .then((data) => setComparison(data))
      .catch((err) => console.log('Notice: comparison data loading error', err))
      .finally(() => setLoading(false));
  }, []);

  const defaultComparison: ModelComparisonData = {
    test_split_size: 4529,
    models: {
      'MultinomialNB (Baseline)': {
        accuracy: 0.8876,
        precision: 0.9343,
        recall: 0.9280,
        f1_score: 0.9312,
        roc_auc: 0.9183,
        train_time_sec: 0.006,
        infer_ms_per_sample: 0.0002,
        confusion_matrix: [[578, 242], [267, 3442]],
      },
      'Logistic Regression': {
        accuracy: 0.8852,
        precision: 0.9173,
        recall: 0.9450,
        f1_score: 0.9309,
        roc_auc: 0.9097,
        train_time_sec: 0.605,
        infer_ms_per_sample: 0.0002,
        confusion_matrix: [[504, 316], [204, 3505]],
      },
      'Calibrated Linear SVM': {
        accuracy: 0.8759,
        precision: 0.8892,
        recall: 0.9693,
        f1_score: 0.9275,
        roc_auc: 0.8917,
        train_time_sec: 5.506,
        infer_ms_per_sample: 0.0011,
        confusion_matrix: [[372, 448], [114, 3595]],
      },
    },
    error_analysis: {
      false_positive_count: 242,
      false_negative_count: 267,
      representative_false_positives: [
        {
          id: 1080,
          rating: 2,
          department: 'Dresses',
          predicted_proba: 0.9942,
          review_snippet: 'This dress is so pretty and colorful, loved the print and the soft fabric, but the fit through the bust was completely disproportionate and I had to return it.',
        },
        {
          id: 862,
          rating: 1,
          department: 'Tops',
          predicted_proba: 0.9881,
          review_snippet: 'Gorgeous romantic design with delicate lace trim, but it arrived with a massive tear along the sleeve seam. Unacceptable quality for the retail price.',
        },
      ],
      representative_false_negatives: [
        {
          id: 936,
          rating: 4,
          department: 'Bottoms',
          predicted_proba: 0.0124,
          review_snippet: 'Fabric feels cheap, thin, and wrinkles immediately. Shrunk a bit in cold water. But honestly for a quick casual pant it looks surprisingly cute on and I recommend it.',
        },
        {
          id: 1059,
          rating: 5,
          department: 'Dresses',
          predicted_proba: 0.0411,
          review_snippet: 'Terrible zipper that snagged right out of the box, stiff scratchy linen at first. After soaking and replacing the pull it fits like a dream and I love wearing it.',
        },
      ],
    },
  };

  const data = comparison || defaultComparison;
  const models = data.models;
  const activeModelStats = models[selectedModel] || models['MultinomialNB (Baseline)'];
  const cm = activeModelStats.confusion_matrix;

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', paddingTop: '2rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="section-eyebrow">Rigorous Machine Learning Benchmarking</span>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.6rem', color: 'var(--brand-primary)' }}>
          Model Evaluation Lab
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Side-by-side empirical comparison of the deployed baseline against alternative candidate algorithms evaluated on the identical 80/20 held-out test split ($N = {data.test_split_size.toLocaleString()}$).
          {loading && <span style={{ marginLeft: '1rem', color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Syncing benchmark metrics...</span>}
        </p>
      </div>

      {/* Benchmark Matrix Table */}
      <section className="card-surface" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem' }}>Algorithm Performance Matrix</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              All models evaluated on identical test samples with stratified target distribution.
            </p>
          </div>
          <span className="brand-badge">Test Split: N = {data.test_split_size.toLocaleString()}</span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Test Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>ROC-AUC</th>
                <th>Inference Latency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(models).map(([name, stat]) => {
                const isBaseline = name.includes('MultinomialNB');
                return (
                  <tr
                    key={name}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedModel === name ? 'var(--brand-tint)' : undefined,
                    }}
                    onClick={() => setSelectedModel(name)}
                  >
                    <td>
                      <strong style={{ color: isBaseline ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                        {name}
                      </strong>
                      {isBaseline && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--sentiment-recommended)', fontFamily: 'var(--font-mono)' }}>
                          &bull; Deployed Production Model
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {(stat.accuracy * 100).toFixed(2)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {(stat.precision * 100).toFixed(2)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {(stat.recall * 100).toFixed(2)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {stat.f1_score.toFixed(4)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)', fontWeight: 600 }}>
                      {stat.roc_auc.toFixed(4)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {stat.infer_ms_per_sample} ms
                    </td>
                    <td>
                      {isBaseline ? (
                        <span className="badge-rec" style={{ fontSize: '0.72rem' }}>
                          Active
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          Benchmark
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <HelpCircle size={14} />
          <span>Click any row above to inspect its corresponding confusion matrix below.</span>
        </div>
      </section>

      {/* Model Detail & Confusion Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Confusion Matrix Card */}
        <section className="card-surface" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Confusion Matrix</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
              {selectedModel}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
            Actual vs predicted classifications on the {data.test_split_size} held-out customer reviews.
          </p>

          <div className="data-table-container">
            <table className="data-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Actual \ Predicted</th>
                  <th>Not Rec (0)</th>
                  <th>Rec (1)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>Actual: Not Recommended (0)</td>
                  <td style={{ backgroundColor: 'var(--sentiment-recommended-light)', fontWeight: 700, color: 'var(--sentiment-recommended)' }}>
                    {cm[0][0]} (TN)
                  </td>
                  <td style={{ backgroundColor: 'var(--sentiment-not-recommended-light)', color: 'var(--sentiment-not-recommended)' }}>
                    {cm[0][1]} (FP)
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>Actual: Recommended (1)</td>
                  <td style={{ backgroundColor: 'var(--sentiment-not-recommended-light)', color: 'var(--sentiment-not-recommended)' }}>
                    {cm[1][0]} (FN)
                  </td>
                  <td style={{ backgroundColor: 'var(--sentiment-recommended-light)', fontWeight: 700, color: 'var(--sentiment-recommended)' }}>
                    {cm[1][1]} (TP)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>True Negative Rate (Specificity): {((cm[0][0] / (cm[0][0] + cm[0][1])) * 100).toFixed(1)}%</span>
            <span>True Positive Rate (Sensitivity): {((cm[1][1] / (cm[1][0] + cm[1][1])) * 100).toFixed(1)}%</span>
          </div>
        </section>

        {/* Model Governance & Promotion Criteria */}
        <section className="card-surface" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldCheck size={20} color="var(--sentiment-recommended)" />
            <h3 style={{ fontSize: '1.2rem' }}>Production Model Governance</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p>
              Under our <strong>Model Promotion Protocol</strong>, candidate models must demonstrate empirical superiority in both accuracy and minority-class protection to replace the baseline:
            </p>

            <div style={{ padding: '0.8rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong>Why MultinomialNB remains deployed:</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', fontSize: '0.82rem' }}>
                <li>Highest overall test accuracy (<strong>88.76%</strong> vs 88.52% and 87.59%).</li>
                <li>Highest ROC-AUC discrimination (<strong>0.9183</strong> vs 0.9097 and 0.8917).</li>
                <li>Highest minority class specificity (578 True Negatives vs 504 and 372).</li>
                <li>Instantaneous inference latency (<strong>0.0002 ms</strong> per sample).</li>
                <li>100% mathematically faithful token log-odds explainability.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Error Analysis & Failure Mode Discovery */}
      <section className="card-surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <AlertTriangle size={20} color="var(--brand-accent)" />
          <h2 style={{ fontSize: '1.35rem' }}>Error Analysis: Model Failure Modes</h2>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Scientific model evaluation requires inspecting where the algorithm fails. Below are representative false positive and false negative examples extracted from the held-out test dataset:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* False Positives */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--sentiment-not-recommended)' }}>
                False Positives ({data.error_analysis.false_positive_count} cases)
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                Actual: 0 &bull; Predicted: 1
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {data.error_analysis.representative_false_positives.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.9rem',
                    backgroundColor: 'var(--sentiment-not-recommended-light)',
                    border: '1px solid var(--sentiment-not-recommended-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
                    <span>Rating: {item.rating} &star; &bull; Dept: {item.department}</span>
                    <span>P(Rec): {(item.predicted_proba * 100).toFixed(1)}%</span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    "{item.review_snippet}"
                  </p>
                  <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--sentiment-not-recommended)', fontStyle: 'italic' }}>
                    Failure cause: Polite introductory praise masked critical fit/defect complaint.
                  </span>
                  <button
                    className="btn-ghost"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.76rem', marginTop: '0.4rem', color: 'var(--brand-primary)', textDecoration: 'underline' }}
                    onClick={() => {
                      if (onSelectSampleForAnalyzer) onSelectSampleForAnalyzer(item.review_snippet);
                      if (onNavigate) onNavigate('analyzer');
                    }}
                  >
                    Analyze this failure case in Single Analyzer &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* False Negatives */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--brand-primary)' }}>
                False Negatives ({data.error_analysis.false_negative_count} cases)
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                Actual: 1 &bull; Predicted: 0
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {data.error_analysis.representative_false_negatives.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.9rem',
                    backgroundColor: 'var(--brand-tint)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
                    <span>Rating: {item.rating} &star; &bull; Dept: {item.department}</span>
                    <span>P(Rec): {(item.predicted_proba * 100).toFixed(1)}%</span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    "{item.review_snippet}"
                  </p>
                  <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--brand-primary)', fontStyle: 'italic' }}>
                    Failure cause: Constructive criticism with critical vocabulary, but customer recommended overall.
                  </span>
                  <button
                    className="btn-ghost"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.76rem', marginTop: '0.4rem', color: 'var(--brand-primary)', textDecoration: 'underline' }}
                    onClick={() => {
                      if (onSelectSampleForAnalyzer) onSelectSampleForAnalyzer(item.review_snippet);
                      if (onNavigate) onNavigate('analyzer');
                    }}
                  >
                    Analyze this failure case in Single Analyzer &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Footer */}
      {onNavigate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', marginBottom: '2rem' }}>
          <button className="btn-secondary" onClick={() => onNavigate('analyzer')}>
            Test Tokens in Analyzer &rarr;
          </button>
          <button className="btn-primary" onClick={() => onNavigate('methodology')}>
            Review Evaluation Protocol &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
