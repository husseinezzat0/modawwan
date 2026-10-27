import { usePreferences } from './PreferencesContext';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavView } from '../types';

interface NavigationContextType {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, ready } = usePreferences();
  const [currentView, setCurrentView] = useState<NavView>('notes');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + / or Ctrl + ? for keyboard shortcuts
      if (e.ctrlKey && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
      // Ctrl + 1: Notes
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setCurrentView('notes');
      }
      // Ctrl + 2: Tasks
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setCurrentView('tasks');
      }
      // Ctrl + 3: Finance
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        setCurrentView('finance');
      }
      // Ctrl + B: Toggle Sidebar
      if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { if (ready) setCurrentView(preferences.startView as NavView); }, [ready]);

  return (
    <NavigationContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedFolderId,
        setSelectedFolderId,
        activeNoteId,
        setActiveNoteId,
        searchQuery,
        setSearchQuery,
        sidebarCollapsed,
        toggleSidebar,
        showShortcutsModal,
        setShowShortcutsModal,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};
