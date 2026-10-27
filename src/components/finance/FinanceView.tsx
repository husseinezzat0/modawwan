import { categoryKey, categoryLabel } from '../../i18n/translations';
import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useNavigation } from '../../context/NavigationContext';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatCurrencyPlain, formatDateArabic } from '../../utils/formatters';
import { SvgDonutChart, DonutSlice } from '../common/SvgDonutChart';
import { SvgBarChart } from '../common/SvgBarChart';
import { TransactionModal } from './TransactionModal';
import { AppIcon } from '../common/AppIcon';
import { CustomSelect } from '../common/CustomSelect';
import { useLanguage } from '../../i18n/LanguageContext';

export const FinanceView: React.FC = () => {
  const { transactions, financeStats, createTransaction, updateTransaction, deleteTransaction } = useDatabase();
  const { searchQuery } = useNavigation();
  const { language, t } = useLanguage();

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (categoryFilter !== 'all') {
      setCategoryFilter((prev) => categoryLabel(prev, language));
    }
  }, [language]);

  const handleSaveTransaction = async (data: any) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
    } else {
      await createTransaction(data);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && categoryKey(tx.category) !== categoryKey(categoryFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return tx.title.toLowerCase().includes(q) || tx.notes.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Prepare Expense Donut Slices
  const categoryColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];
  const expenseSlices: DonutSlice[] =
    financeStats?.expenseCategories.map((c, idx) => ({
      label: categoryLabel(c.category, language),
      value: c.total_cents,
      formattedValue: formatCurrency(c.total_cents),
      color: categoryColors[idx % categoryColors.length],
    })) || [];

  // Prepare Bar chart data
  const barChartData =
    financeStats?.monthlyTrend.map((m) => {
      const [year, month] = m.month.split('-');
      const monthNamesAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const monthNamesEn = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = (language === 'ar' ? monthNamesAr : monthNamesEn)[parseInt(month, 10)] || m.month;
      return {
        label: monthLabel,
        incomeCents: m.income_cents,
        expenseCents: m.expense_cents,
      };
    }) || [];

  const allCategories = language === 'ar'
    ? ['all', 'راتب', 'عمل حر', 'طعام', 'سكن', 'فواتير', 'تسوق', 'مواصلات', 'صحة', 'استثمار', 'أخرى']
    : ['all', 'Salary', 'Freelance', 'Food', 'Housing', 'Bills', 'Shopping', 'Transport', 'Health', 'Investments', 'Other'];

  const categoryOptions = allCategories.map((c) => ({
    value: c === 'all' ? 'all' : (categoryKey(c) === categoryKey(categoryFilter) ? categoryFilter : c),
    label: c === 'all' ? (language === 'ar' ? 'جميع التصنيفات' : 'All Categories') : categoryLabel(c, language),
  }));
  if (categoryFilter !== 'all' && !categoryOptions.some((o) => categoryKey(o.value) === categoryKey(categoryFilter))) {
    categoryOptions.push({ value: categoryFilter, label: categoryLabel(categoryFilter, language) });
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        padding: '24px 32px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AppIcon name="wallet" size={26} color="var(--color-primary)" />
            <span>{t('navFinance')}</span>
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('appTagline')}
          </p>
        </div>

        <button
          data-new-transaction
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="plus" size={15} color="#ffffff" />
          <span>{t('newTransaction')}</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      {financeStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Net Balance Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('financeNetBalance')}
              </span>
              <AppIcon name="wallet" size={16} color="var(--color-primary)" />
            </div>
            <div
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: financeStats.netBalanceCents >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                marginTop: '6px',
              }}
            >
              {formatCurrency(financeStats.netBalanceCents)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {language === 'ar' ? 'الفرق بين إجمالي الدخل والمصروفات' : 'Difference between income and expenses'}
            </span>
          </div>

          {/* Total Income Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('financeTotalIncome')}
              </span>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-success)',
                }}
              >
                <AppIcon name="arrowUp" size={14} color="var(--color-success)" />
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-success)', marginTop: '6px' }}>
              {formatCurrency(financeStats.totalIncomeCents)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {language === 'ar' ? 'مجموع المداخيل المسجلة' : 'Total recorded earnings'}
            </span>
          </div>

          {/* Total Expenses Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('financeTotalExpense')}
              </span>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-danger)',
                }}
              >
                <AppIcon name="arrowDown" size={14} color="var(--color-danger)" />
              </div>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-danger)', marginTop: '6px' }}>
              {formatCurrency(financeStats.totalExpenseCents)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {language === 'ar' ? 'مجموع النفقات والمصروفات' : 'Total recorded expenditures'}
            </span>
          </div>

          {/* Savings Rate Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('financeSavingsRate')}
              </span>
              <AppIcon name="chart" size={16} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
              {financeStats.savingsRate}%
            </div>
            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 6,
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-full)',
                marginTop: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(Math.max(financeStats.savingsRate, 0), 100)}%`,
                  height: '100%',
                  backgroundColor: financeStats.savingsRate > 20 ? 'var(--color-success)' : 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Expenses Donut Chart Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AppIcon name="pieChart" size={16} color="var(--color-primary)" />
            <span>{language === 'ar' ? 'توزيع المصروفات حسب التصنيف' : 'Expenses by category'}</span>
          </h3>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
            <SvgDonutChart
              slices={expenseSlices}
              size={170}
              thickness={22}
              centerLabel={formatCurrencyPlain(financeStats?.totalExpenseCents || 0)}
              centerSublabel={language === 'ar' ? 'إجمالي الصرف' : 'Total expenses'}
            />

            {/* Slices Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '180px' }}>
              {expenseSlices.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: 'var(--text-xs)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.formattedValue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trend Bar Chart Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AppIcon name="chart" size={16} color="var(--color-primary)" />
            <span>{language === 'ar' ? 'التدفقات المالية الشهرية (دخل / صرف)' : 'Monthly cash flow (income / expenses)'}</span>
          </h3>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SvgBarChart data={barChartData} height={190} />
          </div>
        </div>
      </div>

      {/* Transactions Section & Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Table Filters Bar with CustomSelect */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)' }}>
            {language === 'ar' ? 'سجل المعاملات' : 'Transactions'} ({filteredTransactions.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Type Filter Buttons */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
              <button
                onClick={() => setTypeFilter('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: typeFilter === 'all' ? 'var(--bg-modal)' : 'transparent',
                  fontWeight: typeFilter === 'all' ? 700 : 500,
                  fontSize: 'var(--text-xs)',
                }}
              >
                {language === 'ar' ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: typeFilter === 'income' ? 'var(--color-success)' : 'transparent',
                  color: typeFilter === 'income' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: typeFilter === 'income' ? 700 : 500,
                  fontSize: 'var(--text-xs)',
                }}
              >
                {language === 'ar' ? 'دخل' : 'Income'}
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: typeFilter === 'expense' ? 'var(--color-danger)' : 'transparent',
                  color: typeFilter === 'expense' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: typeFilter === 'expense' ? 700 : 500,
                  fontSize: 'var(--text-xs)',
                }}
              >
                {language === 'ar' ? 'مصروفات' : 'Expenses'}
              </button>
            </div>

            {/* Category Filter with CustomSelect */}
            <div style={{ width: '150px' }}>
              <CustomSelect
                selectSize="sm"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>{language === 'ar' ? 'المعاملة' : 'Transaction'}</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>{language === 'ar' ? 'النوع' : 'Type'}</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>{language === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'end' }}>{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    {language === 'ar' ? 'لا توجد معاملات مسجلة مطابقة للبحث' : 'No transactions match your search'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Title */}
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {tx.title}
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: isIncome ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                            color: isIncome ? 'var(--color-success)' : 'var(--color-danger)',
                          }}
                        >
                          <AppIcon name={isIncome ? 'arrowUp' : 'arrowDown'} size={12} color="currentColor" />
                          <span>{isIncome ? (language === 'ar' ? 'دخل' : 'Income') : (language === 'ar' ? 'مصروف' : 'Expense')}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          padding: '12px 18px',
                          fontWeight: 700,
                          fontSize: 'var(--text-base)',
                          color: isIncome ? 'var(--color-success)' : 'var(--color-danger)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount_cents)}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            backgroundColor: 'var(--bg-input)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          {categoryLabel(tx.category, language)}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 18px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {tx.date}
                      </td>

                      {/* Notes */}
                      <td style={{ padding: '12px 18px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'end' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsModalOpen(true);
                            }}
                            title={t('edit')}
                            style={{ padding: '4px', color: 'var(--text-secondary)' }}
                          >
                            <AppIcon name="edit" size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t('deleteTransactionConfirm').replace('{name}', tx.title))) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            title={t('delete')}
                            style={{ padding: '4px', color: 'var(--color-danger)' }}
                          >
                            <AppIcon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
      />
    </div>
  );
};
