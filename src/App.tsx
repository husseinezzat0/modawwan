import React, { useEffect, useState } from 'react';
import { PreferencesProvider } from './context/PreferencesContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { api } from './db/apiClient';
import type { UpdateState } from './types';
import { AppIcon } from './components/common/AppIcon';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { NotesView } from './components/notes/NotesView';
import { TasksView } from './components/tasks/TasksView';
import { FinanceView } from './components/finance/FinanceView';
import { TrashView } from './components/notes/TrashView';
import { SettingsView } from './components/settings/SettingsView';
import { ShortcutsModal } from './components/layout/ShortcutsModal';

const UpdateNotice: React.FC = () => {
  const { t } = useLanguage();
  const { setCurrentView } = useNavigation();
  const [state, setState] = useState<UpdateState>({ status: 'idle', currentVersion: '', portable: false });
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const unsubscribe = api.onUpdateState?.(next => { setState(next); if (next.status === 'available') setDismissed(false); });
    api.getUpdateState?.().then(setState).catch(() => {});
    return () => unsubscribe?.();
  }, []);
  if (state.status !== 'available' || dismissed) return null;
  return <div role="status" aria-live="polite" style={{ position: 'absolute', insetBlockStart: 12, insetInlineEnd: 12, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, maxWidth: 'min(480px, calc(100% - 24px))', padding: '12px 14px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', color: 'var(--text-main)', boxShadow: 'var(--shadow-lg)' }}>
    <AppIcon name="download" size={19} color="var(--color-primary)" />
    <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{t('updateAvailable')}{state.version ? ` · ${state.version}` : ''}</span>
    <button type="button" className="settings-action-button settings-action-primary" onClick={() => { setDismissed(true); setCurrentView('settings'); }}>{t('viewUpdate')}</button>
    <button type="button" className="settings-action-button" aria-label={t('dismissUpdate')} onClick={() => setDismissed(true)}>×</button>
  </div>;
};

const MainContent: React.FC<{ expanded: boolean; setExpanded: (value: boolean) => void }> = ({ expanded, setExpanded }) => {
  const { currentView } = useNavigation();

  return (
    <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      <UpdateNotice />
      {currentView === 'notes' && <NotesView expanded={expanded} setExpanded={setExpanded} />}
      {currentView === 'tasks' && <TasksView />}
      {currentView === 'finance' && <FinanceView />}
      {currentView === 'trash' && <TrashView />}
      {currentView === 'settings' && <SettingsView />}
    </main>
  );
};

const AppLayout: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { currentView } = useNavigation();
  useEffect(() => { if (currentView !== 'notes') setExpanded(false); }, [currentView]);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (document.querySelector('[role="dialog"]') || document.querySelector('.custom-select-popup')) return;
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);
  return <div className="app-container"><TitleBar /><div className="app-body">{!expanded && <Sidebar />}<MainContent expanded={expanded} setExpanded={setExpanded} /></div><ShortcutsModal /></div>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <PreferencesProvider><DatabaseProvider>
          <NavigationProvider>
            <AppLayout />
          </NavigationProvider>
        </DatabaseProvider></PreferencesProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;