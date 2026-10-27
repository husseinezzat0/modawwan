import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useDatabase } from '../../context/DatabaseContext';
import { useNavigation } from '../../context/NavigationContext';
import { api } from '../../db/apiClient';
import { AppIcon } from '../common/AppIcon';

export const TitleBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { saveStatus, createNote, lastSavedAt } = useDatabase();
  const { searchQuery, setSearchQuery, setShowShortcutsModal, setCurrentView } = useNavigation();
  const [showSaved, setShowSaved] = useState(false);
  const wasSaving = useRef(false);
  useEffect(() => {
    if (saveStatus === 'saving') { wasSaving.current = true; setShowSaved(false); }
    if (saveStatus === 'saved' && wasSaving.current) {
      wasSaving.current = false; setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    api.isMaximized().then(setIsMaximized);
    // Live sync with real window state (double-click, Win+Up, Aero Snap, restore),
    // not just optimistic local clicks.
    const unsubscribe = api.onWindowStateChanged?.(value => setIsMaximized(!!value?.isMaximized));
    return () => unsubscribe?.();
  }, []);

  // Publish window state to CSS for platform-consistent layout adjustments and
  // a short, subtle macOS-style content transition on maximize/restore.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.maximized = isMaximized ? 'true' : 'false';
    root.dataset.windowTransition = '1';
    const timer = setTimeout(() => delete root.dataset.windowTransition, 180);
    return () => clearTimeout(timer);
  }, [isMaximized]);

  const handleMinimize = () => api.minimizeWindow();
  const handleMaximize = () => api.maximizeWindow();
  const handleClose = () => api.closeWindow();

  const handleNewNote = async () => {
    setCurrentView('notes');
    await createNote();
  };

  return (
    <header
      className="drag-region"
      style={{
        height: 'var(--titlebar-height)',
        backgroundColor: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-4)',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Right side in RTL: macOS Traffic Lights & App Brand */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* macOS Traffic Lights Style Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleClose}
            title={language === 'ar' ? 'إغلاق (Alt + F4)' : 'Close (Alt + F4)'}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: 'var(--mac-close)',
              padding: 0,
              boxShadow: '0 0 1px rgba(0,0,0,0.4)',
              cursor: 'pointer',
            }}
          />
          <button
            onClick={handleMinimize}
            title={language === 'ar' ? 'تصغير' : 'Minimize'}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: 'var(--mac-minimize)',
              padding: 0,
              boxShadow: '0 0 1px rgba(0,0,0,0.4)',
              cursor: 'pointer',
            }}
          />
          <button
            onClick={handleMaximize}
            title={isMaximized ? (language === 'ar' ? 'استعادة' : 'Restore') : (language === 'ar' ? 'تكبير' : 'Maximize')}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: 'var(--mac-maximize)',
              padding: 0,
              boxShadow: '0 0 1px rgba(0,0,0,0.4)',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-subtle)' }} />

        {/* App Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="./icon.svg"
            alt="Modawwan Logo"
            style={{
              width: 24,
              height: 24,
              objectFit: 'contain',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: 'var(--text-base)', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            {t('appName')}
          </span>
        </div>

        {/* Quick New Note Button */}
        <button
          data-new-note
          onClick={handleNewNote}
          title={`${t('newNote')} (Ctrl + N)`}
          style={{
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: 'var(--text-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <AppIcon name="plus" size={13} />
          <span>{t('newNote')}</span>
        </button>

        {/* Only announce active saving, a recent success, or an error. */}
        {(saveStatus !== 'saved' || showSaved) && <div
          data-save-status={saveStatus}
          role={saveStatus === 'error' ? 'alert' : 'status'}
          title={
            saveStatus === 'saved'
              ? `${language === 'ar' ? 'تم حفظ التغييرات' : 'Changes saved'} (${lastSavedAt?.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US') || ''})`
              : saveStatus === 'saving'
              ? (language === 'ar' ? 'جاري الحفظ التلقائي...' : 'Auto-saving...')
              : (language === 'ar' ? 'خطأ في الحفظ' : 'Save error')
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: 'var(--text-xs)',
            color: saveStatus === 'saved' ? 'var(--color-success)' : saveStatus === 'saving' ? 'var(--color-warning)' : 'var(--color-danger)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          {saveStatus === 'saved' ? (
            <>
              <AppIcon name="tick" size={12} />
              <span>{language === 'ar' ? 'محفوظ' : 'Saved'}</span>
            </>
          ) : (
            <span>{saveStatus === 'error' ? (language === 'ar' ? 'تعذر الحفظ — التعديلات لم تُحفظ' : 'Save failed — edits are not saved') : (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')}</span>
          )}
        </div>}
      </div>

      {/* Middle: Universal Search Bar */}
      <div className="no-drag" style={{ width: '320px', maxWidth: '38%' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '3px 10px',
            height: '28px',
          }}
        >
          <AppIcon name="search" size={13} color="var(--text-muted)" style={{ marginInlineEnd: '6px' }} />
          <input
            type="text"
            placeholder={t('searchNotesPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 'var(--text-xs)',
              boxShadow: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ padding: 0, color: 'var(--text-muted)' }}
            >
              <AppIcon name="close" size={12} />
            </button>
          )}
        </div>
      </div>

      {/* End controls: Language Switcher, Shortcuts, Theme */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Instant Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          style={{
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {language === 'ar' ? 'EN' : 'عربي'}
        </button>

        {/* Keyboard Shortcuts Guide */}
        <button
          onClick={() => setShowShortcutsModal(true)}
          title={t('navShortcuts')}
          style={{
            padding: '5px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <AppIcon name="keyboard" size={16} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? (language === 'ar' ? 'التحويل إلى الوضع النهاري' : 'Switch to Light Mode') : (language === 'ar' ? 'التحويل إلى الوضع الليلي' : 'Switch to Dark Mode')}
          style={{
            padding: '5px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
      </div>
    </header>
  );
};
