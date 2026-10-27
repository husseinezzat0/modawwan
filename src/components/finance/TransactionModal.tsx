import { categoryKey, categoryLabel } from '../../i18n/translations';
import { useDialog } from '../common/useDialog';
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../../types';
import { parseCurrencyToCents, formatCurrencyPlain } from '../../utils/formatters';
import { AppIcon } from '../common/AppIcon';
import { CustomSelect } from '../common/CustomSelect';
import { useLanguage } from '../../i18n/LanguageContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: {
    title: string;
    type: TransactionType;
    amount_cents: number;
    category: string;
    date: string;
    notes?: string;
  }) => Promise<void>;
  transaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
}) => {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [title, setTitle] = useState(transaction?.title || '');
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
  const [amountStr, setAmountStr] = useState(
    transaction ? formatCurrencyPlain(transaction.amount_cents) : ''
  );
  const [category, setCategory] = useState(
    transaction?.category || (transaction?.type === 'income' ? (isEn ? 'Salary' : 'راتب') : (isEn ? 'Food' : 'طعام'))
  );
  const [date, setDate] = useState(
    transaction?.date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen) return null;

  const incomeCategories = isEn
    ? ['Salary', 'Freelance', 'Investments', 'Bonus', 'Other']
    : ['راتب', 'عمل حر', 'استثمار', 'مكافأة', 'أخرى'];
  const expenseCategories = isEn
    ? ['Food', 'Housing', 'Bills', 'Shopping', 'Transport', 'Health', 'Education', 'Entertainment', 'Other']
    : ['طعام', 'سكن', 'فواتير', 'تسوق', 'مواصلات', 'صحة', 'تعليم', 'ترفيه', 'أخرى'];

  const categories = type === 'income' ? incomeCategories : expenseCategories;
  const categoryOptions = categories.map((c) => ({ value: categoryKey(c) === categoryKey(category) ? category : c, label: categoryLabel(c, language) }));
  if (!categoryOptions.some(option => option.value === category)) categoryOptions.push({ value: category, label: categoryLabel(category, language) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const amount_cents = parseCurrencyToCents(amountStr);
    if (amount_cents <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        amount_cents,
        category: category || (type === 'income' ? 'راتب' : 'طعام'),
        date,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={language === 'ar' ? 'تحرير البيانات' : 'Edit details'}
        tabIndex={-1}
        className="animate-scale-in"
        style={{
          backgroundColor: 'var(--bg-modal)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          width: '90%',
          maxWidth: '480px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AppIcon name="money" size={20} color="var(--color-primary)" />
            <span>{transaction ? t('financeEditTitle') : t('financeAddTitle')}</span>
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px' }}>
            <AppIcon name="close" size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Income / Expense Switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--bg-input)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory(isEn ? 'Food' : 'طعام');
              }}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: type === 'expense' ? 'var(--color-danger)' : 'transparent',
                color: type === 'expense' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AppIcon name="arrowDown" size={15} />
              <span>{t('financeExpense')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory(isEn ? 'Salary' : 'راتب');
              }}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: type === 'income' ? 'var(--color-success)' : 'transparent',
                color: type === 'income' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AppIcon name="arrowUp" size={15} />
              <span>{t('financeIncome')}</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
              {t('financeDescLabel')}
            </label>
            <input
              autoFocus
              type="text"
              placeholder={type === 'income' ? t('financeDescPlaceholderIncome') : t('financeDescPlaceholderExpense')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', height: '38px' }}
            />
          </div>

          {/* Amount & Currency */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
              {t('financeAmountLabel')}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '42px',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  direction: 'ltr',
                  textAlign: 'left',
                }}
              />
              <span style={{ position: 'absolute', insetInlineEnd: '12px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                {t('currencySAR')}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {t('financeSubtext')}
            </span>
          </div>

          {/* Category & Date Grid with CustomSelect */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
                {t('financeCategory')}
              </label>
              <CustomSelect
                options={categoryOptions}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
                {t('financeDate')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', height: '38px' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
              {t('financeNotesLabel')}
            </label>
            <input
              type="text"
              placeholder={t('financeNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', height: '38px' }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !amountStr}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              {isSubmitting ? t('financeSaving') : transaction ? t('financeSaveEdit') : type === 'income' ? t('financeSaveIncome') : t('financeSaveExpense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
