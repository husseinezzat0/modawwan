import { useDialog } from '../common/useDialog';
import React from 'react';
import { AppIcon } from '../common/AppIcon';
import { useNavigation } from '../../context/NavigationContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, setShowShortcutsModal } = useNavigation();
  const { language, t } = useLanguage();

  const dialogRef = useDialog(showShortcutsModal, () => setShowShortcutsModal(false));
  if (!showShortcutsModal) return null;

  const shortcuts = language === 'ar' ? [
    { key: 'Ctrl + N', desc: 'إنشاء ملاحظة جديدة فوراً' },
    { key: 'Ctrl + F', desc: 'البحث الفوري في الملاحظات والمهام' },
    { key: 'Ctrl + 1', desc: 'الانتقال إلى شاشة الملاحظات' },
    { key: 'Ctrl + 2', desc: 'الانتقال إلى شاشة المهام' },
    { key: 'Ctrl + 3', desc: 'الانتقال إلى شاشة الإدارة المالية' },
    { key: 'Ctrl + B', desc: 'طي أو إظهار القائمة الجانبية' },
    { key: 'Ctrl + ?', desc: 'فتح نافذة اختصارات لوحة المفاتيح' },
    { key: 'Ctrl + B (في المحرر)', desc: 'تنسيق النص كـ عريض (Bold)' },
    { key: 'Ctrl + I (في المحرر)', desc: 'تنسيق النص كـ مائل (Italic)' },
    { key: 'Ctrl + U (في المحرر)', desc: 'تنسيق النص مع تسطير (Underline)' },
  ] : [
    { key: 'Ctrl + N', desc: 'Create a new note instantly' },
    { key: 'Ctrl + F', desc: 'Global quick search' },
    { key: 'Ctrl + 1', desc: 'Navigate to Notes' },
    { key: 'Ctrl + 2', desc: 'Navigate to Tasks' },
    { key: 'Ctrl + 3', desc: 'Navigate to Finance' },
    { key: 'Ctrl + B', desc: 'Toggle Sidebar' },
    { key: 'Ctrl + ?', desc: 'Open Keyboard Shortcuts' },
    { key: 'Ctrl + B (Editor)', desc: 'Format Bold text' },
    { key: 'Ctrl + I (Editor)', desc: 'Format Italic text' },
    { key: 'Ctrl + U (Editor)', desc: 'Format Underline text' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setShowShortcutsModal(false)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('navShortcuts')}
        tabIndex={-1}
        className="animate-scale-in"
        style={{
          backgroundColor: 'var(--bg-modal)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          width: '90%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AppIcon name="keyboard" size={20} color="var(--color-primary)" />
            <span>{t('shortcutsTitle')}</span>
          </h3>
          <button onClick={() => setShowShortcutsModal(false)} style={{ color: 'var(--text-muted)', padding: '4px' }}>
            <AppIcon name="close" size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{s.desc}</span>
              <kbd
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 8px',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  direction: 'ltr',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
