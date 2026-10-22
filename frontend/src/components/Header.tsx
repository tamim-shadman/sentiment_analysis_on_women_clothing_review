import React from 'react';
import { Sparkles, History, CheckCircle2, AlertCircle, RefreshCw, Menu, X, Search, Sun, Moon, Sliders } from 'lucide-react';
import type { HealthResponse } from '../api';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  apiHealth: HealthResponse | null;
  apiLoading: boolean;
  onRefreshHealth: () => void;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenCommandPalette: () => void;
  onOpenPreferences: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  apiHealth,
  apiLoading,
  onRefreshHealth,
  historyCount,
  onOpenHistory,
  onOpenCommandPalette,
  onOpenPreferences,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analyzer', label: 'Analyze Review' },
    { id: 'batch', label: 'Batch Analysis' },
    { id: 'insights', label: 'Insights' },
    { id: 'lab', label: 'Model Lab' },
    { id: 'methodology', label: 'Methodology' },
  ];

  const isHealthy = apiHealth?.status === 'healthy';

  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <div className="brand-mark" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Sparkles size={18} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--brand-primary)', fontWeight: 700 }}>
                ATELIER
              </span>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Review Intelligence
              </span>
            </div>
            <span className="brand-badge">ML v2.2</span>
          </div>

          <nav>
            <ul className="nav-links">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            {/* Command Palette Trigger Button */}
            <button
              className="command-trigger-btn"
              onClick={onOpenCommandPalette}
              title="Open Command Center (Ctrl+K)"
              aria-label="Open Command Center"
            >
              <Search size={13} color="var(--text-tertiary)" />
              <span className="command-trigger-text">Search actions...</span>
              <kbd className="command-trigger-kbd">Ctrl+K</kbd>
            </button>

            {/* Model Health Indicator Pill */}
            <button
              className="api-status-pill"
              onClick={onRefreshHealth}
              title={isHealthy ? 'Inference API Connected & Ready (Click to verify latency)' : 'Inference API Offline / Degraded (Click to retry)'}
              style={{ cursor: 'pointer' }}
            >
              {apiLoading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : isHealthy ? (
                <CheckCircle2 size={12} color="var(--sentiment-recommended)" />
              ) : (
                <AlertCircle size={12} color="var(--sentiment-not-recommended)" />
              )}
              <span>{isHealthy ? 'Model Online' : 'API Offline'}</span>
            </button>

            {/* Session History Trigger Button */}
            <button
              className="btn-ghost"
              onClick={onOpenHistory}
              title="Open Session Review History"
              style={{ position: 'relative', padding: '0.45rem 0.75rem' }}
            >
              <History size={16} />
              <span style={{ fontSize: '0.85rem' }}>History</span>
              {historyCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  {historyCount}
                </span>
              )}
            </button>

            {/* Preferences Button */}
            <button
              className="btn-ghost"
              onClick={onOpenPreferences}
              title="Workspace Preferences (Density, Theme, Defaults)"
              aria-label="Workspace Preferences"
              style={{ padding: '0.45rem 0.6rem' }}
            >
              <Sliders size={16} color="var(--text-secondary)" />
            </button>

            {/* Theme Toggle Button */}
            <button
              className="btn-ghost"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Editorial Light Theme' : 'Switch to Obsidian Dark Theme'}
              aria-label={theme === 'dark' ? 'Switch to Editorial Light Theme' : 'Switch to Obsidian Dark Theme'}
              style={{ padding: '0.45rem 0.6rem' }}
            >
              {theme === 'dark' ? (
                <Sun size={16} color="var(--accent-gold)" />
              ) : (
                <Moon size={16} color="var(--brand-primary)" />
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              className="btn-ghost mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1rem 0',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              animation: 'fadeIn 150ms ease',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'flex-start', fontSize: '0.85rem' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCommandPalette();
                }}
              >
                <Search size={14} /> Search commands (Ctrl+K)
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPreferences();
                }}
                title="Preferences"
              >
                <Sliders size={15} />
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                onClick={() => {
                  onToggleTheme();
                }}
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {theme === 'dark' ? <Sun size={15} color="var(--accent-gold)" /> : <Moon size={15} />}
              </button>
            </div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
