import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  BarChart3,
  Cpu,
  BookOpen,
  UploadCloud,
  History,
  FileSpreadsheet,
  CornerDownLeft,
  X,
  Sun,
  Moon,
  Sliders,
  LayoutGrid,
  Scale,
  RotateCcw
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectSampleForAnalyzer: (text: string) => void;
  onOpenHistory: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  density?: 'comfortable' | 'compact';
  onToggleDensity?: () => void;
  onOpenPreferences?: () => void;
  onClearFilters?: () => void;
  onOpenCohortCompare?: () => void;
  onLoadSampleBatch?: () => void;
  hasActiveBatch?: boolean;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Presets' | 'Workspace';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectSampleForAnalyzer,
  onOpenHistory,
  theme,
  onToggleTheme,
  density = 'comfortable',
  onToggleDensity,
  onOpenPreferences,
  onClearFilters,
  onOpenCohortCompare,
  onLoadSampleBatch,
  hasActiveBatch,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'nav-overview',
      category: 'Navigation',
      title: 'Go to Overview',
      subtitle: 'Editorial introduction and live inference sandbox',
      icon: <Sparkles size={16} />,
      shortcut: 'G O',
      action: () => { onNavigate('overview'); onClose(); },
    },
    {
      id: 'nav-analyzer',
      category: 'Navigation',
      title: 'Analyze Single Review',
      subtitle: 'Dual-model inference with token attribution and what-if testing',
      icon: <Sparkles size={16} />,
      shortcut: 'G A',
      action: () => { onNavigate('analyzer'); onClose(); },
    },
    {
      id: 'nav-batch',
      category: 'Navigation',
      title: 'Batch Review Intelligence & Explorer',
      subtitle: hasActiveBatch ? 'Active batch corpus loaded — inspect multi-facet filters and records' : 'High-throughput CSV analysis with drawer and comparison',
      icon: <UploadCloud size={16} />,
      shortcut: 'G B',
      action: () => { onNavigate('batch'); onClose(); },
    },
    {
      id: 'nav-insights',
      category: 'Navigation',
      title: 'Corpus Insights & Patterns',
      subtitle: 'Aspect frequencies and recommendation-polarity cross-tabulation',
      icon: <BarChart3 size={16} />,
      shortcut: 'G I',
      action: () => { onNavigate('insights'); onClose(); },
    },
    {
      id: 'nav-lab',
      category: 'Navigation',
      title: 'Model Evaluation Lab',
      subtitle: 'Empirical benchmark comparison against Logistic Regression and SVM',
      icon: <Cpu size={16} />,
      shortcut: 'G L',
      action: () => { onNavigate('lab'); onClose(); },
    },
    {
      id: 'nav-methodology',
      category: 'Navigation',
      title: 'Methodology & Ethics',
      subtitle: 'Training protocol, class imbalance, and scientific assumptions',
      icon: <BookOpen size={16} />,
      shortcut: 'G M',
      action: () => { onNavigate('methodology'); onClose(); },
    },
    {
      id: 'action-history',
      category: 'Actions',
      title: 'Open Session History',
      subtitle: 'Inspect reviews analyzed in the current browser session',
      icon: <History size={16} />,
      shortcut: 'G H',
      action: () => { onOpenHistory(); onClose(); },
    },
    {
      id: 'action-theme',
      category: 'Actions',
      title: theme === 'dark' ? 'Switch to Editorial Light Theme' : 'Switch to Obsidian Dark Theme',
      subtitle: theme === 'dark' ? 'Warm alabaster surfaces and high-contrast editorial typography' : 'Obsidian slate surfaces and radiant plum accents',
      icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
      shortcut: 'T',
      action: () => { onToggleTheme(); onClose(); },
    },
    {
      id: 'action-preferences',
      category: 'Workspace',
      title: 'Workspace Preferences & Configuration',
      subtitle: 'Customize theme, table density, default landing view, and page size',
      icon: <Sliders size={16} />,
      shortcut: ',',
      action: () => {
        if (onOpenPreferences) onOpenPreferences();
        onClose();
      },
    },
    {
      id: 'action-density',
      category: 'Workspace',
      title: density === 'compact' ? 'Table Density: Switch to Comfortable (0.85rem padding)' : 'Table Density: Switch to Compact (0.42rem padding)',
      subtitle: density === 'compact' ? 'Generous row spacing for comfortable reading' : 'Dense spreadsheet row height for large review corpora',
      icon: <LayoutGrid size={16} />,
      shortcut: 'D',
      action: () => {
        if (onToggleDensity) onToggleDensity();
        onClose();
      },
    },
    ...(onOpenCohortCompare ? [{
      id: 'action-compare',
      category: 'Workspace' as const,
      title: 'Interactive Cohort Comparison Workspace',
      subtitle: 'Compare empirical metric divergence between Recommended and Non-Recommended subsets',
      icon: <Scale size={16} />,
      shortcut: 'C',
      action: () => {
        onOpenCohortCompare();
        onClose();
      },
    }] : []),
    ...(onClearFilters ? [{
      id: 'action-clear-filters',
      category: 'Actions' as const,
      title: 'Clear Active Review Filters',
      subtitle: 'Reset recommendation, aspect, polarity, and department filters',
      icon: <RotateCcw size={16} />,
      action: () => {
        onClearFilters();
        onClose();
      },
    }] : []),
    ...(onLoadSampleBatch ? [{
      id: 'action-load-sample-batch',
      category: 'Actions' as const,
      title: 'Load Curated Sample Batch (15 Reviews)',
      subtitle: 'Instant batch dataset with real apparel departments and ratings',
      icon: <UploadCloud size={16} />,
      action: () => {
        onLoadSampleBatch();
        onClose();
      },
    }] : []),
    {
      id: 'preset-fit',
      category: 'Presets',
      title: 'Load Preset: 5-Star Fit & Fabric',
      subtitle: '"I love this dress! The cut is extremely flattering and linen fabric breathes wonderfully..."',
      icon: <FileSpreadsheet size={16} />,
      action: () => {
        onSelectSampleForAnalyzer('I love this dress! The cut is extremely flattering and the linen fabric breathes wonderfully in hot weather. Fits true to size and looks gorgeous.');
        onClose();
      },
    },
    {
      id: 'preset-defect',
      category: 'Presets',
      title: 'Load Preset: 1-Star Defect & Returns',
      subtitle: '"Terrible quality. Shrunk after one cold wash, seams came undone, returning immediately."',
      icon: <FileSpreadsheet size={16} />,
      action: () => {
        onSelectSampleForAnalyzer('Terrible quality. Shrunk after one cold wash, seams came undone, and the fabric feels like cheap synthetic paper. Returning it immediately.');
        onClose();
      },
    },
    {
      id: 'preset-bust',
      category: 'Presets',
      title: 'Load Preset: Mixed Sizing Complaint',
      subtitle: '"Color is vibrant, but bust sizing runs very small and material wrinkles instantly..."',
      icon: <FileSpreadsheet size={16} />,
      action: () => {
        onSelectSampleForAnalyzer('The color is gorgeous and vibrant, but the bust sizing runs very small and the material wrinkles instantly. Had to send it back unfortunately.');
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        animation: 'fadeIn 150ms ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-dropdown)',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            gap: '0.75rem',
          }}
        >
          <Search size={18} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search views, or load review presets..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button className="btn-ghost" style={{ padding: '0.2rem' }} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-tertiary)',
              padding: '0.15rem 0.4rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            ESC
          </span>
        </div>

        {/* Command List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
          {filtered.length > 0 ? (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--brand-tint)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {cmd.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                        }}
                      >
                        {cmd.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '400px',
                        }}
                      >
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {cmd.shortcut && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-tertiary)',
                          padding: '0.15rem 0.4rem',
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderRadius: '3px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft size={14} color="var(--brand-primary)" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              No commands or presets matching "{query}"
            </div>
          )}
        </div>

        {/* Footer Guidance */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Execute</span>
            <span>ESC Close</span>
          </div>
          <span>Atelier Command Center</span>
        </div>
      </div>
    </div>
  );
};
