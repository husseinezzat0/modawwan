import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
}

interface SvgDonutChartProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSublabel?: string;
  emptyText?: string;
}

export const SvgDonutChart: React.FC<SvgDonutChartProps> = ({
  slices,
  size = 200,
  thickness = 28,
  centerLabel,
  centerSublabel,
  emptyText,
}) => {
  const { t } = useLanguage();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const radius = size / 2;
  const innerRadius = radius - thickness;
  const circumference = 2 * Math.PI * ((radius + innerRadius) / 2);

  if (total === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={radius}
            cy={radius}
            r={(radius + innerRadius) / 2}
            fill="transparent"
            stroke="var(--border-subtle)"
            strokeWidth={thickness}
          />
        </svg>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '-110px' }}>{emptyText || t('empty')}</span>
      </div>
    );
  }

  let accumulatedPercent = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        {slices.map((slice, index) => {
          if (slice.value <= 0) return null;
          const percent = slice.value / total;
          const strokeDashoffset = -circumference * accumulatedPercent;
          const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
          accumulatedPercent += percent;

          const isHovered = hoveredIndex === index;

          return (
            <circle
              key={index}
              cx={radius}
              cy={radius}
              r={(radius + innerRadius) / 2}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={isHovered ? thickness + 4 : thickness}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* Center Label */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center',
          maxWidth: innerRadius * 1.8,
        }}
      >
        {hoveredIndex !== null ? (
          <>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: slices[hoveredIndex].color }}>
              {Math.round((slices[hoveredIndex].value / total) * 100)}%
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-word' }}>
              {slices[hoveredIndex].label}
            </span>
            {slices[hoveredIndex].formattedValue && (
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-main)' }}>
                {slices[hoveredIndex].formattedValue}
              </span>
            )}
          </>
        ) : (
          <>
            {centerLabel && (
              <span style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-main)' }}>
                {centerLabel}
              </span>
            )}
            {centerSublabel && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                {centerSublabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
