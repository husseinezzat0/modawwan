import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatCurrency } from '../../utils/formatters';

export interface BarGroup {
  label: string; // e.g. "2026-10" or "أكتوبر"
  incomeCents: number;
  expenseCents: number;
}

interface SvgBarChartProps {
  data: BarGroup[];
  height?: number;
}

export const SvgBarChart: React.FC<SvgBarChartProps> = ({ data, height = 220 }) => {
  const { t } = useLanguage();
  const [hoveredItem, setHoveredItem] = useState<{ index: number; type: 'income' | 'expense' } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        {t('noMonthlyData')}
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.incomeCents, d.expenseCents)), 100);
  const chartHeight = height - 50;

  return (
    <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column' }}>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', marginBottom: '8px', fontSize: 'var(--text-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-success)' }} />
          <span>{t('financeIncome')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-danger)' }} />
          <span>{t('financeExpense')}</span>
        </div>
      </div>

      {/* Chart Bars */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
        {data.map((item, idx) => {
          const incomeHeight = Math.max((item.incomeCents / maxVal) * chartHeight, 4);
          const expenseHeight = Math.max((item.expenseCents / maxVal) * chartHeight, 4);

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              {/* Tooltip */}
              {hoveredItem?.index === idx && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: Math.max(incomeHeight, expenseHeight) + 10,
                    background: 'var(--bg-modal)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 10,
                    whiteSpace: 'nowrap',
                    fontSize: 'var(--text-xs)',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ color: 'var(--color-success)' }}>{t('financeIncome')}: {formatCurrency(item.incomeCents)}</div>
                  <div style={{ color: 'var(--color-danger)' }}>{t('financeExpense')}: {formatCurrency(item.expenseCents)}</div>
                </div>
              )}

              {/* Bar Pair */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                {/* Income Bar */}
                <div
                  onMouseEnter={() => setHoveredItem({ index: idx, type: 'income' })}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    width: '38%',
                    maxWidth: 24,
                    height: incomeHeight,
                    background: 'var(--color-success)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease',
                    opacity: hoveredItem && hoveredItem.index !== idx ? 0.6 : 1,
                    cursor: 'pointer',
                  }}
                />
                {/* Expense Bar */}
                <div
                  onMouseEnter={() => setHoveredItem({ index: idx, type: 'expense' })}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    width: '38%',
                    maxWidth: 24,
                    height: expenseHeight,
                    background: 'var(--color-danger)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease',
                    opacity: hoveredItem && hoveredItem.index !== idx ? 0.6 : 1,
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Label */}
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
