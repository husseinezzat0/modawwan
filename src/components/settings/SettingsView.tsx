import React, { useEffect, useState } from 'react';
import { AppIcon } from '../common/AppIcon';
import { CustomSelect } from '../common/CustomSelect';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../db/apiClient';
import type { UpdateState } from '../../types';

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-xl)',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)',
};

export const SettingsView: React.FC = () => {
  const { notes, tasks, transactions, folders, saveBackupToFile, restoreBackupFromFile, flushPendingSaves } = useDatabase();
  const { themeChoice, setTheme } = useTheme();
  const { preferences, ready, setPreference } = usePreferences();
  const { language, setLanguage, t } = useLanguage();

  const ar = language === 'ar';
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<{ version: string; dataPath: string; updatesSupported: boolean } | null>(null);
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle', currentVersion: '', portable: false });
  const [updateBusy, setUpdateBusy] = useState(false);

  useEffect(() => {
    api.getAppInfo?.().then(setInfo).catch(error => {
      setStatusMessage({ type: 'error', text: String(error) });
    });
  }, []);

  useEffect(() => {
    api.getUpdateState?.().then(state => setUpdateState(state)).catch(() => {});
    const unsubscribe = api.onUpdateState?.(state => setUpdateState(state));
    return () => unsubscribe?.();
  }, []);

  const checkUpdates = async () => {
    setUpdateBusy(true);
    try { const state = await api.checkForUpdates?.(); if (state) setUpdateState(state); }
    catch (error) { setUpdateState(current => ({ ...current, status: 'error', error: String(error) })); }
    finally { setUpdateBusy(false); }
  };
  const downloadUpdate = async () => {
    setUpdateBusy(true);
    try { await api.downloadUpdate?.(); }
    catch (error) { setUpdateState(current => ({ ...current, status: 'error', error: String(error) })); }
    finally { setUpdateBusy(false); }
  };
  const installUpdate = async () => { try { await flushPendingSaves(); api.installUpdate?.(); } catch (error) { setUpdateState(current => ({ ...current, status: 'error', error: String(error) })); } };
  const updateStatusText = updateState.status === 'checking' ? t('updateChecking') : updateState.status === 'available' || updateState.status === 'downloaded' ? t('updateAvailable') : updateState.status === 'not-available' ? t('noUpdateAvailable') : updateState.status === 'error' ? `${t('updateError')}: ${updateState.error || ''}` : '—';
  const preference = (key: keyof typeof preferences, value: string | number | boolean) => {
    void setPreference(key, value as never);
  };

  const handleBackup = async (restore: boolean) => {
    setBusy(true);
    setStatusMessage(null);
    try {
      const res = await (restore ? restoreBackupFromFile() : saveBackupToFile());
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: (ar ? 'اكتملت العملية بنجاح! ' : 'Operation completed successfully! ') + (res.filePath || ''),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: 'error',
        text: (ar ? 'تعذر إتمام العملية: ' : 'Unable to complete operation: ') + msg,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="settings-view"
      aria-busy={busy || !ready}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        padding: '28px 36px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 800,
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AppIcon name="settings" size={26} color="var(--color-primary)" />
          <span>{t('settingsTitle')}</span>
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
          {t('settingsSubtitle')}
        </p>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className="animate-fade-in"
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: statusMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            color: statusMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            border: `1px solid ${statusMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
            marginBottom: '20px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {statusMessage.type === 'success' ? <AppIcon name="tickSolid" size={16} /> : <AppIcon name="help" size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <fieldset disabled={busy || !ready} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div
          className="settings-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* 1. Language Selection Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="keyboard" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {t('languageTitle')}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {t('languageSubtitle')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              {t('languageDesc')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: language === 'ar' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: language === 'ar' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                  color: language === 'ar' ? 'var(--color-primary)' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 'var(--text-sm)' }}>العربية</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RTL (من اليمين لليسار)</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: language === 'en' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: language === 'en' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                  color: language === 'en' ? 'var(--color-primary)' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 'var(--text-sm)' }}>English</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LTR (Left to Right)</span>
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label
                htmlFor="setting-language"
                style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                {ar ? 'لغة التطبيق' : 'Application language'}
              </label>
              <CustomSelect
                id="setting-language"
                aria-label={ar ? 'لغة التطبيق' : 'Application language'}
                value={language}
                options={[
                  { value: 'ar', label: 'العربية — RTL' },
                  { value: 'en', label: 'English — LTR' },
                ]}
                onChange={event => setLanguage(event.target.value as 'ar' | 'en')}
              />
            </div>
          </div>

          {/* 2. Theme & Appearance Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-warning-bg)',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="sun" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {t('appearanceTitle')}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {t('appearanceSubtitle')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              {t('appearanceDesc')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => void setTheme('light')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: themeChoice === 'light' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="sun" size={20} color="#f59e0b" />
                <span>{t('lightMode')}</span>
              </button>

              <button
                type="button"
                onClick={() => void setTheme('dark')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: themeChoice === 'dark' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: '#1f232e',
                  color: '#f3f4f6',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="moon" size={20} color="#93c5fd" />
                <span>{t('darkMode')}</span>
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label
                htmlFor="setting-theme"
                style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                {ar ? 'السمة' : 'Theme'}
              </label>
              <CustomSelect
                id="setting-theme"
                aria-label={ar ? 'السمة' : 'Theme'}
                value={themeChoice}
                options={[
                  { value: 'light', label: t('lightMode') },
                  { value: 'dark', label: t('darkMode') },
                  { value: 'system', label: ar ? 'حسب النظام' : 'System' },
                ]}
                onChange={event => void setTheme(event.target.value as 'light' | 'dark' | 'system')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
              <div>
                <label
                  htmlFor="setting-font"
                  style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
                >
                  {ar ? 'حجم خط الواجهة' : 'Interface text size'}
                </label>
                <CustomSelect
                  id="setting-font"
                  aria-label={ar ? 'حجم خط الواجهة' : 'Interface text size'}
                  value={String(preferences.fontSize)}
                  options={[14.5, 16, 18].map(size => ({ value: String(size), label: `${size}px` }))}
                  onChange={event => preference('fontSize', Number(event.target.value))}
                />
              </div>
              <div>
                <label
                  htmlFor="setting-density"
                  style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
                >
                  {ar ? 'كثافة الواجهة' : 'Interface density'}
                </label>
                <CustomSelect
                  id="setting-density"
                  aria-label={ar ? 'كثافة الواجهة' : 'Interface density'}
                  value={preferences.density}
                  options={[
                    { value: 'comfortable', label: ar ? 'مريحة' : 'Comfortable' },
                    { value: 'compact', label: ar ? 'مضغوطة' : 'Compact' },
                  ]}
                  onChange={event => preference('density', event.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. General & Behavior Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="settings" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {ar ? 'عام' : 'General'}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {ar ? 'صفحة البداية والحفظ' : 'Start view & autosave'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              {ar ? 'تفضيلات التشغيل والحفظ التلقائي للبيانات محليًا.' : 'Preferences for app launch and local autosave timing.'}
            </p>

            <div>
              <label
                htmlFor="setting-start"
                style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                {ar ? 'صفحة البداية' : 'Start page'}
              </label>
              <CustomSelect
                id="setting-start"
                aria-label={ar ? 'صفحة البداية' : 'Start page'}
                value={preferences.startView}
                options={[
                  { value: 'notes', label: t('navNotes') },
                  { value: 'tasks', label: t('navTasks') },
                  { value: 'finance', label: t('navFinance') },
                ]}
                onChange={event => preference('startView', event.target.value)}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                htmlFor="setting-save"
                style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                {ar ? 'توقيت الحفظ التلقائي' : 'Autosave timing'}
              </label>
              <CustomSelect
                id="setting-save"
                aria-label={ar ? 'توقيت الحفظ التلقائي' : 'Autosave timing'}
                value={String(preferences.saveDelay)}
                options={[
                  { value: '0', label: ar ? 'فور التعديل' : 'Immediately' },
                  { value: '350', label: ar ? 'بعد ٠٫٣٥ ثانية' : 'After 0.35 seconds' },
                  { value: '1000', label: ar ? 'بعد ثانية' : 'After one second' },
                ]}
                onChange={event => preference('saveDelay', Number(event.target.value))}
              />
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.6 }}>
              {ar ? 'ينتظر إغلاق النافذة اكتمال حفظ التعديلات.' : 'Closing the window waits for pending edits to be saved.'}
            </p>
          </div>

          {/* 4. Editor Preferences Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-info-bg)',
                  color: 'var(--color-info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="edit" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {ar ? 'المحرر' : 'Editor'}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-info)', fontWeight: 600 }}>
                  {ar ? 'الخط والتحرير' : 'Font & typography'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              {ar ? 'تخصيص خط الملاحظات وحجم الخط والتدقيق الإملائي.' : 'Customize note font family, font size, and local spellcheck.'}
            </p>

            <div>
              <label
                htmlFor="setting-editor-font"
                style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                {ar ? 'خط الملاحظات' : 'Note font'}
              </label>
              <CustomSelect
                id="setting-editor-font"
                aria-label={ar ? 'خط الملاحظات' : 'Note font'}
                value={preferences.editorFont}
                options={[
                  { value: 'default', label: ar ? 'خط التطبيق' : 'Application font' },
                  { value: 'cairo', label: 'Cairo' },
                  { value: 'inter', label: 'Inter' },
                  { value: 'serif', label: 'Serif' },
                  { value: 'monospace', label: 'Monospace' },
                ]}
                onChange={event => preference('editorFont', event.target.value)}
              />

              {/* Live preview of the selected note font (Arabic + Latin + digits) */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: preferences.editorFont === 'serif' ? 'Georgia, serif' : preferences.editorFont === 'monospace' ? 'Consolas, monospace' : preferences.editorFont === 'cairo' ? "'Cairo', sans-serif" : preferences.editorFont === 'inter' ? "'Inter', sans-serif" : 'inherit',
                  fontSize: `${preferences.editorSize}px`,
                  lineHeight: 1.7,
                }}
              >
                {ar ? 'معاينة الخط: مُدَوَّن — تدوين سريع 2026' : 'Font preview: Modawwan — quick notes 2026'}
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                htmlFor="setting-ui-font"
                style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                {ar ? 'خط الواجهة' : 'Interface font'}
              </label>
              <CustomSelect
                id="setting-ui-font"
                aria-label={ar ? 'خط الواجهة' : 'Interface font'}
                value={preferences.uiFont}
                options={[
                  { value: 'system', label: ar ? 'النظام (Segoe UI)' : 'System (Segoe UI)' },
                  { value: 'cairo', label: 'Cairo' },
                  { value: 'inter', label: 'Inter' },
                ]}
                onChange={event => preference('uiFont', event.target.value)}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                htmlFor="setting-editor-size"
                style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}
              >
                {ar ? 'حجم خط الملاحظات' : 'Note text size'}
              </label>
              <CustomSelect
                id="setting-editor-size"
                aria-label={ar ? 'حجم خط الملاحظات' : 'Note text size'}
                value={String(preferences.editorSize)}
                options={[14, 16, 18, 20].map(size => ({ value: String(size), label: `${size}px` }))}
                onChange={event => preference('editorSize', Number(event.target.value))}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={preferences.spellcheck}
                onChange={event => preference('spellcheck', event.target.checked)}
              />
              <span>{ar ? 'التدقيق الإملائي المحلي' : 'Local spellcheck'}</span>
            </label>
          </div>

          {/* 5. Local Database Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="database" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {t('dbCardTitle')}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 600 }}>
                  {t('dbCardStatus')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              {t('dbCardDesc')}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                backgroundColor: 'var(--bg-input)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{t('navNotes')}: </span>
                <strong style={{ color: 'var(--text-main)' }}>{notes.length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{t('folders')}: </span>
                <strong style={{ color: 'var(--text-main)' }}>{folders.length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{t('navTasks')}: </span>
                <strong style={{ color: 'var(--text-main)' }}>{tasks.length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>{t('navFinance')}: </span>
                <strong style={{ color: 'var(--text-main)' }}>{transactions.length}</strong>
              </div>
            </div>

            <div style={{ marginTop: '14px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'block', marginBottom: '4px' }}>
                {ar ? 'مسار قاعدة البيانات' : 'Database path'}:
              </span>
              <code
                dir="ltr"
                style={{
                  overflowWrap: 'anywhere',
                  userSelect: 'text',
                  display: 'block',
                  padding: '8px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  color: 'var(--text-main)',
                }}
              >
                {info?.dataPath || (ar ? 'تخزين محلي' : 'Local storage')}
              </code>
            </div>
          </div>

          {/* 6. Backup & Restore Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-info-bg)',
                  color: 'var(--color-info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="database" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {t('backupCardTitle')}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {t('backupCardSubtitle')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              {t('backupCardDesc')}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => void handleBackup(false)}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                }}
              >
                <AppIcon name="download" size={15} />
                <span>{t('exportBackupBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleBackup(true)}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <AppIcon name="upload" size={15} />
                <span>{t('restoreBackupBtn')}</span>
              </button>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.6 }}>
              {ar
                ? 'الاستعادة تستبدل البيانات والإعدادات بعد التأكيد، وتحفظ نسخة استرجاع في مجلد البيانات.'
                : 'Restore replaces data and preferences after confirmation and saves a recovery backup in the data folder.'}
            </p>
          </div>

          {/* 7. Security & Privacy Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-success-bg)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="shield" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {t('securityTitle')}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 600 }}>
                  {t('securitySubtitle')}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('securityDesc')}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '12px' }}>
              {ar
                ? 'البيانات محفوظة محليًا في SQLite دون مزامنة أو تحليلات. صلاحيات صفحات الويب محظورة ولا تُحمّل أي خطوط من الإنترنت.'
                : 'Data stays locally in SQLite with no remote telemetry. Web page permissions are denied and no remote fonts are loaded.'}
            </p>
          </div>

          {/* Updates */}
          <div style={cardStyle} className="settings-card" data-testid="updates-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'grid', placeItems: 'center' }}><AppIcon name="download" size={20} /></div>
              <div><h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{t('updatesTitle')}</h3><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{t('updatesSubtitle')}</span></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span>{t('currentVersion')}: <b>{updateState.currentVersion || info?.version || '—'}</b></span>
              <span>{t('latestVersion')}: <b>{updateState.version || '—'}</b></span>
            </div>
            <p role="status" aria-live="polite" style={{ fontSize: 'var(--text-xs)', color: updateState.status === 'error' ? 'var(--color-danger)' : 'var(--text-secondary)', marginBlock: '12px' }}>{t('updateStatus')}: {updateStatusText}</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-main)', marginBlock: '10px' }}>
              <input type="checkbox" checked={preferences.autoCheckUpdates} onChange={event => preference('autoCheckUpdates', event.target.checked)} />
              <span>{t('autoCheckUpdates')}</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" disabled={updateBusy || updateState.status === 'checking'} onClick={() => void checkUpdates()} className="settings-action-button">{t('checkForUpdates')}</button>
              {updateState.status === 'available' && updateState.portable && <button type="button" onClick={() => api.openReleasePage?.()} className="settings-action-button">{t('openRelease')}</button>}
              {updateState.status === 'available' && !updateState.portable && <button type="button" disabled={updateBusy} onClick={() => void downloadUpdate()} className="settings-action-button settings-action-primary">{t('downloadNow')}</button>}
              {updateState.status === 'downloaded' && !updateState.portable && <button type="button" onClick={() => void installUpdate()} className="settings-action-button settings-action-primary">{t('installRestart')}</button>}
            </div>
            {updateState.status === 'downloading' && <div style={{ marginTop: '12px' }}><div style={{ fontSize: 'var(--text-xs)', marginBottom: '5px' }}>{t('downloadProgress')}: {updateState.progress}%</div><progress max="100" value={updateState.progress} style={{ width: '100%' }} /></div>}
            {updateState.releaseNotes && <div style={{ marginTop: '12px' }}><strong style={{ fontSize: 'var(--text-xs)' }}>{t('releaseNotes')}</strong><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 180, overflow: 'auto', font: 'inherit', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{updateState.releaseNotes}</pre></div>}
            <div style={{ marginTop: '10px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {t('lastChecked')}: {updateState.lastChecked ? new Date(updateState.lastChecked).toLocaleString(ar ? 'ar-EG' : 'en-US') : '—'}
              {updateState.portable && <p>{t('portableUpdateNote')}</p>}
            <p>{t('updateTrustNote')}</p>
            </div>
          </div>
          {/* 8. About Modawwan Card */}
          <div style={cardStyle} className="settings-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="help" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {ar ? 'حول مُدَوَّن' : 'About Modawwan'}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  v{info?.version || '1.2.0'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {ar
                ? 'مُدَوَّن — تطبيق سطح مكتب شخصي للإنتاجية والملاحظات والمهام وإدارة المالية بنظام Windows.'
                : 'Modawwan — Personal desktop productivity suite for notes, tasks, and finance on Windows.'}
            </p>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '12px', display: 'grid', gap: '4px' }}>
              <span>{ar ? 'تطوير: حسين عزت' : 'Developed by Hussein Ezzat'}</span>
              <span>© 2026 Hussein Ezzat · MIT License</span>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '12px' }}>SQLite · {ar ? 'تخزين محلي' : 'Local storage'}</p>

          </div>
        </div>
      </fieldset>
    </div>
  );
};
