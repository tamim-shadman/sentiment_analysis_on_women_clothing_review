import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  AlertCircle,
  FileCheck,
  Sparkles,
  SlidersHorizontal,
  Eye,
  Columns,
  X,
  ExternalLink,
  Tag,
  Scale
} from 'lucide-react';
import { predictBatchReviews, sanitizeForCsv } from '../api';
import type { BatchPredictionResponse, BatchPredictionItem } from '../api';
import type { ActiveFiltersState } from './ContextualBar';

interface BatchViewProps {
  batchData?: BatchPredictionResponse | null;
  onAnalyzeSuccess?: (batch: BatchPredictionResponse) => void;
  onNavigate: (tab: string) => void;
  onSelectReviewForAnalyzer?: (text: string) => void;
  activeFilters?: ActiveFiltersState;
  onUpdateFilter?: (updates: Partial<ActiveFiltersState>) => void;
  onClearAllFilters?: () => void;
  pageSize?: number;
  onOpenCohortCompare?: () => void;
}

export const BatchView: React.FC<BatchViewProps> = ({
  batchData,
  onAnalyzeSuccess,
  onNavigate,
  onSelectReviewForAnalyzer,
  activeFilters,
  onUpdateFilter,
  onClearAllFilters,
  pageSize = 10,
  onOpenCohortCompare,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [allParsedRows, setAllParsedRows] = useState<Record<string, string>[]>([]);

  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchPredictionResponse | null>(batchData || null);
  const [error, setError] = useState<string | null>(null);

  // Sync batchResult when parent batchData changes
  useEffect(() => {
    if (batchData) {
      setBatchResult(batchData);
    }
  }, [batchData]);

  // Unified Multi-Facet Filter State
  const [localFilters, setLocalFilters] = useState<ActiveFiltersState>({
    recommendation: 'all',
    polarity: 'all',
    department: 'all',
    aspect: 'all',
    rating: 'all',
    searchQuery: '',
  });

  const currentFilters = activeFilters || localFilters;
  const updateFilter = (updates: Partial<ActiveFiltersState>) => {
    if (onUpdateFilter) {
      onUpdateFilter(updates);
    } else {
      setLocalFilters((prev) => ({ ...prev, ...updates }));
    }
    setCurrentPage(1);
  };

  const filterClass = currentFilters.recommendation;
  const filterPolarity = currentFilters.polarity;
  const filterDepartment = currentFilters.department;
  const filterAspect = currentFilters.aspect;
  const filterRating = currentFilters.rating;
  const searchQuery = currentFilters.searchQuery;

  const [sortField, setSortField] = useState<'row_id' | 'length' | 'confidence'>('row_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Slide-Over Detail Drawer & Side-by-Side Comparison State
  const [drawerRow, setDrawerRow] = useState<BatchPredictionItem | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV text safely RFC 4180
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row.');
    }

    const headers = parseCSVLine(lines[0]);
    if (headers.length === 0) {
      throw new Error('No valid headers detected in CSV.');
    }

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length && rows.length < 1000; i++) {
      const values = parseCSVLine(lines[i]);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }

    return { headers, rows };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const processFile = (fileObj: File) => {
    if (!fileObj.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a valid .csv file.');
      return;
    }
    if (fileObj.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    setFile(fileObj);
    setError(null);
    setBatchResult(null);
    setDrawerRow(null);
    setSelectedForCompare([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const { headers, rows } = parseCSV(text);
        setCsvHeaders(headers);
        setAllParsedRows(rows);
        setPreviewRows(rows.slice(0, 5));

        // Auto-detect review text column
        const matchedCol =
          headers.find((h) => /review|text|comment|body|feedback|content/i.test(h)) || headers[0];
        setSelectedColumn(matchedCol);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => setError('Error reading the selected file.');
    reader.readAsText(fileObj);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // 1-Click Load Sample Batch CSV (with real department, rating, and class metadata)
  const handleLoadSampleBatch = async () => {
    setLoading(true);
    setError(null);
    try {
      let csvText = '';
      try {
        const res = await fetch('/sample_reviews_batch.csv');
        if (res.ok) {
          csvText = await res.text();
        }
      } catch {}

      if (!csvText || csvText.length < 50) {
        // Fallback embedded batch
        csvText = `Clothing ID,Age,Department Name,Class Name,Rating,Review Text,Recommended IND
948,24,Tops,Sweaters,5,"This sweater is so beautiful on. It is thick material, but does not make you look boxy. Fits true to size and flattering.",1
875,63,Tops,Knits,4,"This piece is almost what I want... The buttercup yellow behind lace is pretty, but texture of spandex on back looks cheap.",1
829,42,Tops,Blouses,4,"Really like this blouse but returning for a larger size. Much too tight in upper arms and somewhat tight in chest.",1
1068,39,Bottoms,Pants,5,"These are the perfect lightweight summer pants! The fabric is soft and light with comfortable stretch.",1
1030,44,Bottoms,Jeans,2,"These look nothing like the picture! They fit terribly, unflattering cut and fabric feels rough.",0
831,47,Tops,Blouses,5,"I love the rusty orange and pale blue contrast with navy. Flattering cut and feminine sheer sleeves.",1
1078,40,Dresses,Dresses,2,"On the hanger looks great, but bell shape made it appear carrying extra weight. Returning.",0
251,36,Intimate,Lounge,5,"Love this cardigan! Soft and cozy lounge sweater, perfect for cold evenings.",1
1094,41,Dresses,Dresses,5,"Gorgeous ochre yellow color and stitch pleat details. Flattering silhouette and top quality.",1
939,31,Tops,Sweaters,5,"Warm and versatile jacket without being itchy at all. Received a bunch of compliments!",1
880,58,Tops,Knits,3,"Top looks pretty online, but sizing is bizarre. Even XS was huge and boxy.",0
1095,39,Dresses,Dresses,1,"Terrible fabric tore at zipper seam on first day. Poorly constructed dress.",0
1008,74,Bottoms,Skirts,5,"Love the style and quality of this skirt. Thick material works well in cooler months.",1
868,34,Tops,Knits,1,"Horrible chemical odor when opened package. Fabric is stiff and rough against skin.",0
1059,28,Dresses,Dresses,5,"Lightweight linen perfection! Ordered in two colors because it fits so gracefully.",1`;
      }

      const { headers, rows } = parseCSV(csvText);
      setCsvHeaders(headers);
      setAllParsedRows(rows);
      setPreviewRows(rows.slice(0, 5));

      const matchedCol =
        headers.find((h) => /review|text/i.test(h)) || headers[0];
      setSelectedColumn(matchedCol);
      setFile(new File([csvText], 'sample_reviews_batch.csv', { type: 'text/csv' }));
    } catch (err: any) {
      setError(err.message || 'Failed to load sample dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatchInference = async () => {
    if (!selectedColumn) {
      setError('Please select which column contains the review text.');
      return;
    }

    if (allParsedRows.length === 0) {
      setError('No data rows found to process.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const items = allParsedRows.map((r, idx) => ({
        id: idx + 1,
        text: r[selectedColumn] || '',
        metadata: r,
      }));

      const response = await predictBatchReviews(items);
      setBatchResult(response);
      setCurrentPage(1);
      if (onAnalyzeSuccess) {
        onAnalyzeSuccess(response);
      }
    } catch (err: any) {
      setError(err.message || 'Batch inference request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvHeaders([]);
    setSelectedColumn('');
    setPreviewRows([]);
    setAllParsedRows([]);
    setBatchResult(null);
    setError(null);
    setDrawerRow(null);
    setSelectedForCompare([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Distinct departments present in dataset
  const availableDepartments = useMemo(() => {
    if (!batchResult) return [];
    const depts = new Set<string>();
    batchResult.predictions.forEach((p) => {
      const dept =
        p.metadata?.['Department Name'] ||
        p.metadata?.['department_name'] ||
        p.metadata?.['department'] ||
        p.metadata?.['Department'];
      if (dept) depts.add(String(dept).trim());
    });
    return Array.from(depts);
  }, [batchResult]);

  // Distinct ratings present in dataset metadata
  const availableRatings = useMemo(() => {
    if (!batchResult) return [];
    const ratings = new Set<string>();
    batchResult.predictions.forEach((p) => {
      const r = p.metadata?.['Rating'] || p.metadata?.['rating'];
      if (r) ratings.add(String(r).trim());
    });
    return Array.from(ratings).sort().reverse();
  }, [batchResult]);

  // Filter & Sort Predictions
  const filteredPredictions = useMemo(() => {
    if (!batchResult) return [];
    let list = [...batchResult.predictions];

    // Filter by Recommendation
    if (filterClass === '1') {
      list = list.filter((p) => p.recommended_ind === 1);
    } else if (filterClass === '0') {
      list = list.filter((p) => p.recommended_ind === 0);
    }

    // Filter by Sentiment Polarity
    if (filterPolarity !== 'all') {
      list = list.filter((p) => p.sentiment_polarity === filterPolarity);
    }

    // Filter by Department
    if (filterDepartment !== 'all') {
      list = list.filter((p) => {
        const dept =
          p.metadata?.['Department Name'] ||
          p.metadata?.['department_name'] ||
          p.metadata?.['department'] ||
          p.metadata?.['Department'];
        return String(dept).trim().toLowerCase() === filterDepartment.toLowerCase();
      });
    }

    // Filter by Aspect
    if (filterAspect !== 'all') {
      list = list.filter((p) => {
        if (p.detected_aspects && p.detected_aspects.includes(filterAspect)) return true;
        const t = p.review_text.toLowerCase();
        if (filterAspect === 'Fit & Sizing' && /fit|sizing|size|tight|loose|length|small|large/i.test(t)) return true;
        if (filterAspect === 'Fabric & Material' && /fabric|material|cotton|linen|silk|wool/i.test(t)) return true;
        if (filterAspect === 'Quality & Durability' && /quality|stitching|durable|tear|defect|seam/i.test(t)) return true;
        if (filterAspect === 'Style & Cut' && /style|cut|flattering|silhouette|look|design/i.test(t)) return true;
        if (filterAspect === 'Comfort & Wearability' && /comfort|cozy|itchy|scratchy|breathable/i.test(t)) return true;
        if (filterAspect === 'Value & Pricing' && /price|worth|value|expensive|cost/i.test(t)) return true;
        return false;
      });
    }

    // Filter by Rating
    if (filterRating !== 'all') {
      list = list.filter((p) => {
        const r = p.metadata?.['Rating'] || p.metadata?.['rating'];
        return String(r) === filterRating;
      });
    }

    // Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.review_text.toLowerCase().includes(q));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortField === 'row_id') {
        return sortAsc ? a.row_id - b.row_id : b.row_id - a.row_id;
      }
      if (sortField === 'length') {
        return sortAsc
          ? a.review_text.length - b.review_text.length
          : b.review_text.length - a.review_text.length;
      }
      if (sortField === 'confidence') {
        const confA = a.confidence ?? 0;
        const confB = b.confidence ?? 0;
        return sortAsc ? confA - confB : confB - confA;
      }
      return 0;
    });

    return list;
  }, [batchResult, filterClass, filterPolarity, filterDepartment, filterAspect, filterRating, searchQuery, sortField, sortAsc]);

  const effectivePageSize = pageSize || 10;
  const totalPages = Math.ceil(filteredPredictions.length / effectivePageSize) || 1;
  const paginatedPredictions = filteredPredictions.slice(
    (currentPage - 1) * effectivePageSize,
    currentPage * effectivePageSize
  );

  const toggleExpand = (rowId: number) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  // Toggle comparison selection
  const handleToggleCompare = (rowId: number) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(rowId)) {
        return prev.filter((id) => id !== rowId);
      }
      if (prev.length >= 2) {
        return [prev[1], rowId];
      }
      return [...prev, rowId];
    });
  };

  // Export Enriched CSV with Formula Injection Mitigation
  const handleExportCSV = () => {
    if (!batchResult) return;
    const header = [
      'Row ID',
      'Review Text',
      'Predicted Recommendation',
      'Recommended IND',
      'Sentiment Polarity',
      'Detected Aspects',
      'Confidence',
      'P(Recommended)',
      'P(Not Recommended)',
      'Department',
      'Rating',
      'Status',
    ];

    const rows = batchResult.predictions.map((p) => {
      const dept =
        p.metadata?.['Department Name'] ||
        p.metadata?.['department_name'] ||
        p.metadata?.['Department'] ||
        p.metadata?.['department'] ||
        'N/A';
      const rating =
        p.metadata?.['Rating'] ||
        p.metadata?.['rating'] ||
        'N/A';

      return [
        p.row_id,
        `"${sanitizeForCsv(p.review_text).replace(/"/g, '""')}"`,
        sanitizeForCsv(p.sentiment_label),
        p.recommended_ind !== null ? p.recommended_ind : 'N/A',
        sanitizeForCsv(p.sentiment_polarity || 'N/A'),
        `"${sanitizeForCsv((p.detected_aspects || []).join('; '))}"`,
        p.confidence !== null ? (p.confidence * 100).toFixed(1) + '%' : 'N/A',
        p.probability ? (p.probability.recommended * 100).toFixed(1) + '%' : 'N/A',
        p.probability ? (p.probability.not_recommended * 100).toFixed(1) + '%' : 'N/A',
        sanitizeForCsv(dept),
        rating,
        p.status,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `review_intelligence_batch_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected comparison items
  const comparisonItems = useMemo(() => {
    if (!batchResult || selectedForCompare.length < 2) return [];
    return selectedForCompare
      .map((id) => batchResult.predictions.find((p) => p.row_id === id))
      .filter(Boolean) as BatchPredictionItem[];
  }, [batchResult, selectedForCompare]);

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="section-eyebrow">High-Throughput Machine Learning</span>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.6rem', color: 'var(--brand-primary)' }}>
          Batch Review Intelligence
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '820px' }}>
          Upload customer review datasets to perform batch vectorization, Naive Bayes recommendation classification, 3-class sentiment polarity analysis, and apparel aspect tag discovery in parallel.
        </p>
      </div>

      {/* Upload & Configuration Surface */}
      <div className="card-surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
        {!file && !batchResult ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface-warm)',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--brand-tint)', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
              <UploadCloud size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>Drag & Drop Your Review CSV</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Upload any spreadsheet containing customer feedback (up to 1,000 rows). Columns will be detected automatically.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                <FileSpreadsheet size={16} /> Choose CSV File
              </button>
              <button className="btn-secondary" onClick={handleLoadSampleBatch}>
                <Sparkles size={16} /> Load Preset Sample Batch (25 Reviews + Metadata)
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <span style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: '1.2rem' }}>
              Supported: RFC 4180 CSV, max 5MB, bounded batch inference
            </span>
          </div>
        ) : !batchResult ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'inline-flex', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--brand-tint)', color: 'var(--brand-primary)' }}>
                  <FileCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{file?.name || 'Uploaded Batch'}</h3>
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                    {allParsedRows.length.toLocaleString()} rows detected{file ? ` • ${(file.size / 1024).toFixed(1)} KB` : ''}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button className="btn-ghost" onClick={handleReset} disabled={loading}>
                  Change File
                </button>
                <button
                  className="btn-primary"
                  onClick={handleRunBatchInference}
                  disabled={loading || !selectedColumn}
                >
                  {loading ? (
                    <>Processing Inference Batch...</>
                  ) : (
                    <>
                      <Sparkles size={16} /> Run Batch Intelligence ({allParsedRows.length} Rows)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Column Selector */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
              <label htmlFor="col-select" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                Target Review Text Column:
              </label>
              <select
                id="col-select"
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                Select the column containing the raw customer text.
              </span>
            </div>

            {/* Row Preview Table */}
            {!batchResult && (
              <div>
                <span className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>Initial 5-Row Preview</span>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        {csvHeaders.slice(0, 6).map((h) => (
                          <th key={h} style={h === selectedColumn ? { color: 'var(--brand-primary)', fontWeight: 700 } : {}}>
                            {h} {h === selectedColumn && '(Target)'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                            {idx + 1}
                          </td>
                          {csvHeaders.slice(0, 6).map((h) => (
                            <td key={h} style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row[h] || <span style={{ color: 'var(--text-muted)' }}>null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Batch Processing Skeleton Loader */}
            {loading && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', animation: 'fadeIn 200ms ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <Sparkles size={16} className="animate-spin" /> Vectorizing text and evaluating batch rows in parallel...
                </div>
                <div className="skeleton-box" style={{ width: '100%', height: '38px' }} />
                <div className="skeleton-box" style={{ width: '100%', height: '54px' }} />
                <div className="skeleton-box" style={{ width: '100%', height: '54px' }} />
                <div className="skeleton-box" style={{ width: '100%', height: '54px' }} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--brand-tint)', color: 'var(--brand-primary)' }}>
                <FileCheck size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>{file?.name || 'Active Batch Dataset'}</h3>
                <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                  {batchResult.valid_processed.toLocaleString()} analyzed reviews &bull; High-throughput Naive Bayes and Aspect Extraction
                </span>
              </div>
            </div>
            <button className="btn-secondary" onClick={handleReset} style={{ fontSize: '0.82rem' }}>
              <UploadCloud size={14} /> Upload New Batch
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: '1.2rem',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--sentiment-not-recommended-light)',
              border: '1px solid var(--sentiment-not-recommended-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--sentiment-not-recommended)',
            }}
          >
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.88rem' }}>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Results Section */}
      {batchResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
            <div className="card-surface" style={{ padding: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>TOTAL PROCESSED</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--brand-primary)', marginTop: '0.2rem' }}>
                {batchResult.valid_processed.toLocaleString()}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {batchResult.invalid_count} skipped/empty rows
              </span>
            </div>

            <div className="card-surface" style={{ padding: '1.5rem', borderLeft: '4px solid var(--sentiment-recommended)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sentiment-recommended)' }}>RECOMMENDED (CLASS 1)</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--sentiment-recommended)', marginTop: '0.2rem' }}>
                {batchResult.summary.recommended_count}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {batchResult.summary.recommended_pct}% of valid reviews
              </span>
            </div>

            <div className="card-surface" style={{ padding: '1.5rem', borderLeft: '4px solid var(--sentiment-not-recommended)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--sentiment-not-recommended)' }}>NOT RECOMMENDED (CLASS 0)</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--sentiment-not-recommended)', marginTop: '0.2rem' }}>
                {batchResult.summary.not_recommended_count}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {batchResult.summary.not_recommended_pct}% of valid reviews
              </span>
            </div>

            <div className="card-surface" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn-primary" onClick={handleExportCSV} style={{ width: '100%' }}>
                <Download size={16} /> Export Enriched CSV
              </button>
              {onOpenCohortCompare && (
                <button
                  className="btn-secondary"
                  onClick={onOpenCohortCompare}
                  style={{ width: '100%', fontSize: '0.82rem' }}
                  title="Open Cohort Comparison Workspace"
                >
                  <Scale size={14} /> Compare Review Cohorts
                </button>
              )}
              {selectedForCompare.length === 2 && (
                <button
                  className="btn-secondary"
                  onClick={() => setShowCompareModal(true)}
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  <Columns size={14} /> Compare Selected 2 Rows
                </button>
              )}
            </div>
          </div>

          {/* Interactive Results Table */}
          <div className="card-surface" style={{ padding: '1.8rem' }}>
            {/* Multi-Facet Filter Bar */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '1.4rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Recommendation Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    className={`preset-chip ${filterClass === 'all' ? 'active' : ''}`}
                    onClick={() => updateFilter({ recommendation: 'all' })}
                    style={filterClass === 'all' ? { backgroundColor: 'var(--brand-primary)', color: 'white' } : {}}
                  >
                    All Recs ({batchResult.predictions.length})
                  </button>
                  <button
                    className={`preset-chip ${filterClass === '1' ? 'active' : ''}`}
                    onClick={() => updateFilter({ recommendation: '1' })}
                    style={filterClass === '1' ? { backgroundColor: 'var(--sentiment-recommended)', color: 'white' } : {}}
                  >
                    Recommended ({batchResult.summary.recommended_count})
                  </button>
                  <button
                    className={`preset-chip ${filterClass === '0' ? 'active' : ''}`}
                    onClick={() => updateFilter({ recommendation: '0' })}
                    style={filterClass === '0' ? { backgroundColor: 'var(--sentiment-not-recommended)', color: 'white' } : {}}
                  >
                    Not Rec ({batchResult.summary.not_recommended_count})
                  </button>
                </div>

                {/* Search Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search review text..."
                    value={searchQuery}
                    onChange={(e) => updateFilter({ searchQuery: e.target.value })}
                    style={{
                      padding: '0.45rem 0.9rem 0.45rem 2.2rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      width: '230px',
                    }}
                  />
                </div>
              </div>

              {/* Secondary Facet Filters: Polarity, Department, Aspect & Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <SlidersHorizontal size={14} color="var(--text-tertiary)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Polarity:</span>
                  <select
                    value={filterPolarity}
                    onChange={(e) => updateFilter({ polarity: e.target.value as any })}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option value="all">All Polarities</option>
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>

                {availableDepartments.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dept:</span>
                    <select
                      value={filterDepartment}
                      onChange={(e) => updateFilter({ department: e.target.value })}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      <option value="all">All Depts</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Aspect Facet */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Tag size={13} color="var(--text-tertiary)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Aspect:</span>
                  <select
                    value={filterAspect}
                    onChange={(e) => updateFilter({ aspect: e.target.value })}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option value="all">All Aspects</option>
                    <option value="Fit & Sizing">Fit & Sizing</option>
                    <option value="Fabric & Material">Fabric & Material</option>
                    <option value="Quality & Durability">Quality & Durability</option>
                    <option value="Style & Cut">Style & Cut</option>
                    <option value="Comfort & Wearability">Comfort & Wearability</option>
                    <option value="Value & Pricing">Value & Pricing</option>
                  </select>
                </div>

                {/* Rating Facet (if dataset contains Rating) */}
                {availableRatings.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rating:</span>
                    <select
                      value={filterRating}
                      onChange={(e) => updateFilter({ rating: e.target.value })}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      <option value="all">All Ratings</option>
                      {availableRatings.map((r) => (
                        <option key={r} value={r}>{r} Stars</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedForCompare.length > 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                      {selectedForCompare.length} / 2 for compare
                    </span>
                    {selectedForCompare.length === 2 && (
                      <button
                        className="btn-primary"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => setShowCompareModal(true)}
                      >
                        Compare Side-by-Side
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Active Filter Chips Bar */}
              {(filterClass !== 'all' || filterPolarity !== 'all' || filterDepartment !== 'all' || filterAspect !== 'all' || filterRating !== 'all' || searchQuery.trim().length > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--brand-tint)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                      Showing {filteredPredictions.length} of {batchResult.predictions.length} reviews:
                    </span>
                    {filterClass !== 'all' && (
                      <span className="preset-chip active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        {filterClass === '1' ? 'Recommended' : 'Not Recommended'}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter({ recommendation: 'all' })} />
                      </span>
                    )}
                    {filterPolarity !== 'all' && (
                      <span className="preset-chip active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        Polarity: {filterPolarity}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter({ polarity: 'all' })} />
                      </span>
                    )}
                    {filterDepartment !== 'all' && (
                      <span className="preset-chip active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        Dept: {filterDepartment}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter({ department: 'all' })} />
                      </span>
                    )}
                    {filterAspect !== 'all' && (
                      <span className="preset-chip active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        Aspect: {filterAspect}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter({ aspect: 'all' })} />
                      </span>
                    )}
                    {filterRating !== 'all' && (
                      <span className="preset-chip active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        Rating: {filterRating}★
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter({ rating: 'all' })} />
                      </span>
                    )}
                    {searchQuery.trim().length > 0 && (
                      <span className="preset-chip active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        "{searchQuery}"
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateFilter({ searchQuery: '' })} />
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onClearAllFilters) onClearAllFilters();
                      else updateFilter({ recommendation: 'all', polarity: 'all', department: 'all', aspect: 'all', rating: 'all', searchQuery: '' });
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Comp</th>
                    <th
                      style={{ cursor: 'pointer', width: '60px' }}
                      onClick={() => { setSortField('row_id'); setSortAsc(!sortAsc); }}
                    >
                      Row {sortField === 'row_id' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th>Customer Review</th>
                    <th style={{ width: '150px' }}>Recommendation</th>
                    <th style={{ width: '110px' }}>Polarity</th>
                    <th style={{ width: '160px' }}>Detected Aspects</th>
                    <th
                      style={{ cursor: 'pointer', width: '110px' }}
                      onClick={() => { setSortField('confidence'); setSortAsc(!sortAsc); }}
                    >
                      P(Rec) {sortField === 'confidence' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th style={{ width: '70px' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPredictions.length > 0 ? (
                    paginatedPredictions.map((row) => (
                      <tr key={row.row_id} style={drawerRow?.row_id === row.row_id ? { backgroundColor: 'var(--brand-tint)' } : {}}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedForCompare.includes(row.row_id)}
                            onChange={() => handleToggleCompare(row.row_id)}
                            title="Select row for side-by-side comparison"
                          />
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                          #{row.row_id}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                            {expandedRows[row.row_id] || row.review_text.length <= 130
                              ? row.review_text
                              : `${row.review_text.substring(0, 130)}...`}
                          </div>
                          {row.review_text.length > 130 && (
                            <button
                              className="btn-ghost"
                              style={{ padding: '0.1rem 0', fontSize: '0.75rem', color: 'var(--brand-primary)', textDecoration: 'underline' }}
                              onClick={() => toggleExpand(row.row_id)}
                            >
                              {expandedRows[row.row_id] ? 'Show less' : 'Read full text'}
                            </button>
                          )}
                        </td>
                        <td>
                          {row.recommended_ind === 1 ? (
                            <span className="badge-rec">
                              <CheckCircle2 size={13} /> Recommended
                            </span>
                          ) : row.recommended_ind === 0 ? (
                            <span className="badge-not-rec">
                              <XCircle size={13} /> Not Rec
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unprocessed</span>
                          )}
                        </td>
                        <td>
                          {row.sentiment_polarity ? (
                            <span
                              className={
                                row.sentiment_polarity === 'Positive'
                                  ? 'badge-rec'
                                  : row.sentiment_polarity === 'Negative'
                                  ? 'badge-not-rec'
                                  : 'badge-neutral'
                              }
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                            >
                              {row.sentiment_polarity}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          {row.detected_aspects && row.detected_aspects.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {row.detected_aspects.map((asp, aIdx) => (
                                <span
                                  key={aIdx}
                                  style={{
                                    fontSize: '0.68rem',
                                    fontFamily: 'var(--font-mono)',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '3px',
                                    backgroundColor: 'var(--bg-surface-subtle)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {asp.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>none</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {row.confidence !== null ? (
                            <div>
                              <span>{(row.confidence * 100).toFixed(1)}%</span>
                              <div
                                style={{
                                  width: '55px',
                                  height: '4px',
                                  backgroundColor: 'var(--border-subtle)',
                                  borderRadius: '2px',
                                  marginTop: '4px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${row.confidence * 100}%`,
                                    backgroundColor: row.recommended_ind === 1 ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)',
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-ghost"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setDrawerRow(row)}
                            title="Open detailed review drawer"
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                        No matching reviews found for current multi-facet filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.2rem',
                gap: '1rem',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredPredictions.length)} of{' '}
                {filteredPredictions.length} records
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Detail Drawer (Slide-Over Panel) */}
      {drawerRow && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-overlay)',
            backdropFilter: 'blur(3px)',
            zIndex: 300,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setDrawerRow(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              height: '100%',
              backgroundColor: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-dropdown)',
              padding: '2rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              animation: 'fadeIn 200ms ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="section-eyebrow">Review Record Inspection</span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--brand-primary)', margin: '0.2rem 0' }}>
                  Record #{drawerRow.row_id}
                </h3>
              </div>
              <button className="btn-ghost" onClick={() => setDrawerRow(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Model Outcomes Header */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className={drawerRow.recommended_ind === 1 ? 'badge-rec' : 'badge-not-rec'} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                {drawerRow.recommended_ind === 1 ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                PREDICTED: {drawerRow.sentiment_label.toUpperCase()}
              </span>

              {drawerRow.sentiment_polarity && (
                <span
                  className={
                    drawerRow.sentiment_polarity === 'Positive'
                      ? 'badge-rec'
                      : drawerRow.sentiment_polarity === 'Negative'
                      ? 'badge-not-rec'
                      : 'badge-neutral'
                  }
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                >
                  POLARITY: {drawerRow.sentiment_polarity.toUpperCase()}
                </span>
              )}
            </div>

            {/* Posterior Probability */}
            {drawerRow.probability && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--sentiment-recommended)' }}>
                    P(Rec): {(drawerRow.probability.recommended * 100).toFixed(1)}%
                  </span>
                  <span style={{ color: 'var(--sentiment-not-recommended)' }}>
                    P(Not Rec): {(drawerRow.probability.not_recommended * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="prob-bar-container" style={{ margin: '0.4rem 0' }}>
                  <div
                    className="prob-segment-rec"
                    style={{ width: `${drawerRow.probability.recommended * 100}%` }}
                  />
                  <div
                    className="prob-segment-not-rec"
                    style={{ width: `${drawerRow.probability.not_recommended * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Customer Review Body */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
                FULL CUSTOMER REVIEW TEXT
              </label>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.92rem',
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {drawerRow.review_text}
              </div>
            </div>

            {/* Metadata Pills */}
            {drawerRow.metadata && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
                  ASSOCIATED CSV METADATA
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(drawerRow.metadata).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{k}: </span>
                      <strong>{String(v)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Aspects */}
            {drawerRow.detected_aspects && drawerRow.detected_aspects.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>
                  DETECTED APPAREL ASPECTS
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {drawerRow.detected_aspects.map((asp, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--brand-tint)',
                        color: 'var(--brand-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {asp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Drawer Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  if (onSelectReviewForAnalyzer) {
                    onSelectReviewForAnalyzer(drawerRow.review_text);
                  } else {
                    onNavigate('analyzer');
                  }
                  setDrawerRow(null);
                }}
              >
                <ExternalLink size={14} /> Open in Single-Review Analyzer (Token Attribution)
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  handleToggleCompare(drawerRow.row_id);
                  setDrawerRow(null);
                }}
              >
                {selectedForCompare.includes(drawerRow.row_id) ? 'Remove from Comparison' : 'Select for Side-by-Side Comparison'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showCompareModal && comparisonItems.length === 2 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-overlay)',
            backdropFilter: 'blur(4px)',
            zIndex: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="card-surface"
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative',
              animation: 'fadeIn 200ms ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span className="section-eyebrow">Comparative Feedback Analysis</span>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-primary)', margin: '0.2rem 0' }}>
                  Side-by-Side Review Comparison
                </h2>
              </div>
              <button className="btn-ghost" onClick={() => setShowCompareModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {comparisonItems.map((item) => (
                <div
                  key={item.row_id}
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--brand-primary)' }}>
                      Review #{item.row_id}
                    </span>
                    <span className={item.recommended_ind === 1 ? 'badge-rec' : 'badge-not-rec'} style={{ fontSize: '0.82rem' }}>
                      {item.sentiment_label}
                    </span>
                  </div>

                  {item.sentiment_polarity && (
                    <div style={{ marginBottom: '0.8rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Polarity: </span>
                      <strong style={{ fontSize: '0.85rem' }}>{item.sentiment_polarity}</strong>
                    </div>
                  )}

                  {item.probability && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                        <span>P(Rec): {(item.probability.recommended * 100).toFixed(1)}%</span>
                        <span>P(Not Rec): {(item.probability.not_recommended * 100).toFixed(1)}%</span>
                      </div>
                      <div className="prob-bar-container" style={{ margin: '0.3rem 0' }}>
                        <div className="prob-segment-rec" style={{ width: `${item.probability.recommended * 100}%` }} />
                        <div className="prob-segment-not-rec" style={{ width: `${item.probability.not_recommended * 100}%` }} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.3rem' }}>
                      REVIEW TEXT ({item.review_text.length} chars)
                    </span>
                    <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                      "{item.review_text}"
                    </p>
                  </div>

                  {item.detected_aspects && item.detected_aspects.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.3rem' }}>
                        ASPECTS
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {item.detected_aspects.map((a, aIdx) => (
                          <span key={aIdx} className="brand-badge" style={{ fontSize: '0.72rem' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.metadata && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {item.metadata['Department Name'] && (
                        <div>Department: <strong>{item.metadata['Department Name']}</strong></div>
                      )}
                      {item.metadata['Rating'] && (
                        <div>Rating: <strong>{item.metadata['Rating']} / 5</strong></div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button className="btn-secondary" onClick={() => setSelectedForCompare([])}>
                Clear Selection
              </button>
              <button className="btn-primary" onClick={() => setShowCompareModal(false)}>
                Done Comparing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
