import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OverviewView } from './components/OverviewView';
import { AnalyzerView } from './components/AnalyzerView';
import { BatchView } from './components/BatchView';
import { InsightsView } from './components/InsightsView';
import { MethodologyView } from './components/MethodologyView';
import { ModelLabView } from './components/ModelLabView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { CommandPalette } from './components/CommandPalette';
import { PreferencesModal, DEFAULT_PREFERENCES } from './components/PreferencesModal';
import type { WorkspacePreferences } from './components/PreferencesModal';
import { CohortCompareModal } from './components/CohortCompareModal';
import { ContextualBar } from './components/ContextualBar';
import type { ActiveFiltersState } from './components/ContextualBar';
import { checkApiHealth } from './api';
import type { HealthResponse, HistoryItem, BatchPredictionResponse } from './api';

export function App() {
  // Preferences State (Persisted in localStorage with robust fallbacks)
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() => {
    try {
      const saved = localStorage.getItem('atelier_workspace_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch {}

    let theme: 'light' | 'dark' = 'light';
    try {
      const legacyTheme = localStorage.getItem('atelier_theme');
      if (legacyTheme === 'light' || legacyTheme === 'dark') theme = legacyTheme;
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
    } catch {}

    return { ...DEFAULT_PREFERENCES, theme };
  });

  const [activeTab, setActiveTab] = useState<string>(preferences.defaultTab || 'overview');
  const [analyzerText, setAnalyzerText] = useState<string>('');

  // Apply theme & density to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
    document.documentElement.setAttribute('data-density', preferences.density);
    try {
      localStorage.setItem('atelier_workspace_prefs', JSON.stringify(preferences));
      localStorage.setItem('atelier_theme', preferences.theme);
    } catch {}
  }, [preferences]);

  const toggleTheme = () => {
    setPreferences((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const toggleDensity = () => {
    setPreferences((prev) => ({
      ...prev,
      density: prev.density === 'comfortable' ? 'compact' : 'comfortable',
    }));
  };

  const handleUpdatePreferences = (updates: Partial<WorkspacePreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const handleResetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  // Health State
  const [apiHealth, setApiHealth] = useState<HealthResponse | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(true);

  // Modals & Drawers State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [isCohortCompareOpen, setIsCohortCompareOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Session History State (Stored in session / local storage)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('atelier_review_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Batch Result State for Batch & Insights Views (preserved globally across navigation)
  const [batchData, setBatchData] = useState<BatchPredictionResponse | null>(null);

  // Active Multi-Facet Filter State (preserved across navigation)
  const [activeFilters, setActiveFilters] = useState<ActiveFiltersState>({
    recommendation: 'all',
    polarity: 'all',
    department: 'all',
    aspect: 'all',
    rating: 'all',
    searchQuery: '',
  });

  const handleUpdateFilter = (updates: Partial<ActiveFiltersState>) => {
    setActiveFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleClearAllFilters = () => {
    setActiveFilters({
      recommendation: 'all',
      polarity: 'all',
      department: 'all',
      aspect: 'all',
      rating: 'all',
      searchQuery: '',
    });
  };

  // Cross-View Navigation Drilldown Handler
  const handleDrilldownToBatch = (filters: {
    recommendation?: '1' | '0' | 'all';
    polarity?: 'Positive' | 'Neutral' | 'Negative' | 'all';
    department?: string;
    aspect?: string;
  }) => {
    setActiveFilters((prev) => ({
      ...prev,
      recommendation: filters.recommendation || prev.recommendation,
      polarity: filters.polarity || prev.polarity,
      department: filters.department || prev.department,
      aspect: filters.aspect || prev.aspect,
    }));
    setActiveTab('batch');
  };

  const fetchHealth = async () => {
    setApiLoading(true);
    try {
      const data = await checkApiHealth();
      setApiHealth(data);
    } catch {
      setApiHealth(null);
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K for Command Center, Ctrl+, for Preferences)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as any).isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsPreferencesOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaveToHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 30);
      try {
        localStorage.setItem('atelier_review_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('atelier_review_history');
    } catch {}
  };

  const handleSelectSampleForAnalyzer = (text: string) => {
    setAnalyzerText(text);
    setActiveTab('analyzer');
  };

  const handleLoadSampleBatch = () => {
    setActiveTab('batch');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiHealth={apiHealth}
        apiLoading={apiLoading}
        onRefreshHealth={fetchHealth}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        theme={preferences.theme}
        onToggleTheme={toggleTheme}
      />

      <ContextualBar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        batchData={batchData}
        activeFilters={activeFilters}
        onUpdateFilter={handleUpdateFilter}
        onClearAllFilters={handleClearAllFilters}
        onOpenCohortCompare={() => setIsCohortCompareOpen(true)}
      />

      <main style={{ flex: 1 }}>
        <div className="container">
          {activeTab === 'overview' && (
            <OverviewView
              onNavigate={setActiveTab}
              onSelectSampleForAnalyzer={handleSelectSampleForAnalyzer}
            />
          )}

          {activeTab === 'analyzer' && (
            <AnalyzerView
              initialText={analyzerText}
              onSaveToHistory={handleSaveToHistory}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'batch' && (
            <BatchView
              batchData={batchData}
              onAnalyzeSuccess={(res) => setBatchData(res)}
              onNavigate={setActiveTab}
              onSelectReviewForAnalyzer={handleSelectSampleForAnalyzer}
              activeFilters={activeFilters}
              onUpdateFilter={handleUpdateFilter}
              onClearAllFilters={handleClearAllFilters}
              pageSize={preferences.pageSize}
              onOpenCohortCompare={() => setIsCohortCompareOpen(true)}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsView
              batchData={batchData}
              historyData={history}
              onNavigate={setActiveTab}
              onLoadSampleBatch={handleLoadSampleBatch}
              onDrilldownToBatch={handleDrilldownToBatch}
            />
          )}

          {activeTab === 'lab' && (
            <ModelLabView
              onNavigate={setActiveTab}
              onSelectSampleForAnalyzer={handleSelectSampleForAnalyzer}
            />
          )}

          {activeTab === 'methodology' && <MethodologyView />}
        </div>
      </main>

      <Footer onNavigate={setActiveTab} />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectReview={(text) => {
          setAnalyzerText(text);
          setActiveTab('analyzer');
        }}
        onClearHistory={handleClearHistory}
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        onResetPreferences={handleResetPreferences}
      />

      <CohortCompareModal
        isOpen={isCohortCompareOpen}
        onClose={() => setIsCohortCompareOpen(false)}
        batchData={batchData}
        onApplyCohortFilter={handleDrilldownToBatch}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveTab}
        onSelectSampleForAnalyzer={handleSelectSampleForAnalyzer}
        onOpenHistory={() => setIsHistoryOpen(true)}
        theme={preferences.theme}
        onToggleTheme={toggleTheme}
        density={preferences.density}
        onToggleDensity={toggleDensity}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onClearFilters={handleClearAllFilters}
        onOpenCohortCompare={batchData ? () => setIsCohortCompareOpen(true) : undefined}
        onLoadSampleBatch={handleLoadSampleBatch}
        hasActiveBatch={!!batchData}
      />
    </div>
  );
}

export default App;
