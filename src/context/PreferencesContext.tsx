import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../db/apiClient';

export const defaultPreferences = { startView: 'notes', fontSize: 14.5, density: 'comfortable', editorFont: 'default', editorSize: 14, spellcheck: true, saveDelay: 350, uiFont: 'system', autoCheckUpdates: true };
export type Preferences = typeof defaultPreferences;
const Context = createContext<{ preferences: Preferences; ready: boolean; setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void> } | null>(null);
export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);
  useEffect(() => { api.getSetting('preferences', defaultPreferences).then(saved => setPreferences({ ...defaultPreferences, ...saved })).catch(console.error).finally(() => setReady(true)); }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = `${preferences.fontSize}px`;
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.dataset.uiFont = preferences.uiFont;
  }, [preferences.fontSize, preferences.density, preferences.uiFont]);
  const setPreference = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const next = { ...preferences, [key]: value };
    await api.setSetting('preferences', next);
    setPreferences(next);
  };
  return <Context.Provider value={{ preferences, ready, setPreference }}>{children}</Context.Provider>;
};
export const usePreferences = () => { const context = useContext(Context); if (!context) throw new Error('PreferencesProvider missing'); return context; };
