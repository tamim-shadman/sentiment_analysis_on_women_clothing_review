import React, { useState } from 'react';

interface TokenHighlightTextProps {
  text: string;
  tokenWeightsMap: Record<string, number>;
  onTokenClick?: (token: string, weight: number) => void;
}

export const TokenHighlightText: React.FC<TokenHighlightTextProps> = ({
  text,
  tokenWeightsMap,
  onTokenClick,
}) => {
  const [hoveredToken, setHoveredToken] = useState<{ token: string; weight: number; x: number; y: number } | null>(null);

  // Split text into word tokens and whitespace/punctuation preserving exact structure
  const tokens = text.split(/(\s+|[.,!?;:"'()\[\]{}]+)/);

  return (
    <div style={{ position: 'relative', fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
      {tokens.map((token, idx) => {
        const cleanWord = token.toLowerCase().trim();
        const weight = tokenWeightsMap ? tokenWeightsMap[cleanWord] : undefined;

        if (weight === undefined || Math.abs(weight) < 0.1) {
          return <span key={idx}>{token}</span>;
        }

        const isPositive = weight > 0;
        const bg = isPositive ? 'rgba(30, 107, 71, 0.14)' : 'rgba(150, 40, 40, 0.14)';
        const border = isPositive ? 'rgba(30, 107, 71, 0.45)' : 'rgba(150, 40, 40, 0.45)';
        const color = isPositive ? 'var(--sentiment-recommended)' : 'var(--sentiment-not-recommended)';

        return (
          <span
            key={idx}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredToken({
                token: cleanWord,
                weight,
                x: rect.left + rect.width / 2,
                y: rect.top - 8,
              });
            }}
            onMouseLeave={() => setHoveredToken(null)}
            onClick={() => onTokenClick && onTokenClick(cleanWord, weight)}
            style={{
              backgroundColor: bg,
              borderBottom: `2px solid ${border}`,
              color,
              padding: '0.1rem 0.25rem',
              borderRadius: '3px',
              fontWeight: 600,
              cursor: onTokenClick ? 'pointer' : 'default',
              transition: 'background-color 150ms ease',
            }}
            title={`Word: "${cleanWord}", Log-Odds Contribution: ${weight > 0 ? '+' : ''}${weight}`}
          >
            {token}
          </span>
        );
      })}

      {hoveredToken && (
        <div
          style={{
            position: 'fixed',
            left: hoveredToken.x,
            top: hoveredToken.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--text-inverse)',
            padding: '0.35rem 0.65rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: 'var(--shadow-dropdown)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>token: <strong>"{hoveredToken.token}"</strong></span> &bull;{' '}
          <span style={{ color: hoveredToken.weight > 0 ? '#4ADE80' : '#F87171' }}>
            &Delta; log-odds: {hoveredToken.weight > 0 ? '+' : ''}{hoveredToken.weight}
          </span>
        </div>
      )}
    </div>
  );
};
