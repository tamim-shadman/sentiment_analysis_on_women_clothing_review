import React from 'react';
import { X, Sliders, Sun, Moon, LayoutGrid, RotateCcw, Check } from 'lucide-react';

export interface WorkspacePreferences {
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  defaultTab: string;
  pageSize: number;
}

export const DEFAULT_PREFERENCES: WorkspacePreferences = {
  theme: 'light',
  density: 'comfortable',
  defaultTab: 'overview',
  pageSize: 10,
};

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: WorkspacePreferences;
  onUpdatePreferences: (updates: Partial<WorkspacePreferences>) => void;
  onResetPreferences: () => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onResetPreferences,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="drawer-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pref-modal-title"
    >
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-dropdown)',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--brand-tint)',
                color: 'var(--brand-primary)',
              }}
            >
              <Sliders size={18} />
            </span>
            <div>
              <h3 id="pref-modal-title" style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                Workspace Preferences
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Tailor appearance, density, and analytical workflow defaults
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
            aria-label="Close preferences"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Controls */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Theme Preference */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                marginBottom: '0.6rem',
              }}
            >
              Visual Theme & Canvas
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ theme: 'light' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${preferences.theme === 'light' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: preferences.theme === 'light' ? 'var(--brand-tint)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Sun size={20} color={preferences.theme === 'light' ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: preferences.theme === 'light' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    Editorial Light
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Alabaster canvas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdatePreferences({ theme: 'dark' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${preferences.theme === 'dark' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: preferences.theme === 'dark' ? 'var(--brand-tint)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Moon size={20} color={preferences.theme === 'dark' ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: preferences.theme === 'dark' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    Obsidian Dark
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Plum slate canvas</div>
                </div>
              </button>
            </div>
          </div>

          {/* Table Data Density */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                marginBottom: '0.6rem',
              }}
            >
              Data Table Spacing Density
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ density: 'comfortable' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${preferences.density === 'comfortable' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: preferences.density === 'comfortable' ? 'var(--brand-tint)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <LayoutGrid size={18} color={preferences.density === 'comfortable' ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: preferences.density === 'comfortable' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    Comfortable
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Spacious row padding (0.85rem)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdatePreferences({ density: 'compact' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${preferences.density === 'compact' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: preferences.density === 'compact' ? 'var(--brand-tint)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <LayoutGrid size={18} color={preferences.density === 'compact' ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: preferences.density === 'compact' ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    Compact
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dense spreadsheet view (0.45rem)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Default Landing Tab */}
          <div>
            <label
              htmlFor="pref-default-tab"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Default Landing View
            </label>
            <select
              id="pref-default-tab"
              value={preferences.defaultTab}
              onChange={(e) => onUpdatePreferences({ defaultTab: e.target.value })}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
              }}
            >
              <option value="overview">Editorial Overview & Live Sandbox</option>
              <option value="analyzer">Single Review Analyzer</option>
              <option value="batch">Batch Review Intelligence & Explorer</option>
              <option value="insights">Corpus Insights & Distributions</option>
              <option value="lab">Model Evaluation Lab</option>
              <option value="methodology">Methodology & Ethics</option>
            </select>
          </div>

          {/* Default Table Page Size */}
          <div>
            <label
              htmlFor="pref-page-size"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Default Table Page Size
            </label>
            <select
              id="pref-page-size"
              value={preferences.pageSize}
              onChange={(e) => onUpdatePreferences({ pageSize: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
              }}
            >
              <option value={10}>10 records per page</option>
              <option value={25}>25 records per page</option>
              <option value={50}>50 records per page</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-subtle)',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            onClick={onResetPreferences}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: 'var(--text-tertiary)',
            }}
          >
            <RotateCcw size={14} />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.25rem',
            }}
          >
            <Check size={16} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
