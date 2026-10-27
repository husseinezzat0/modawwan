import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '../types';
import { api } from '../db/apiClient';
type ThemeChoice = Theme | 'system';
interface ThemeContextType { theme: Theme; themeChoice: ThemeChoice; toggleTheme: () => void; setTheme: (theme: ThemeChoice) => Promise<void>; }
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeChoice, setChoice] = useState<ThemeChoice>('dark');
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const theme: Theme = themeChoice === 'system' ? systemDark ? 'dark' : 'light' : themeChoice;
  useEffect(() => { api.getSetting('theme', 'dark').then(value => { if (['light', 'dark', 'system'].includes(value)) setChoice(value); }).catch(console.error); }, []);
  useEffect(() => { const query = matchMedia('(prefers-color-scheme: dark)'); const update = () => setSystemDark(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const setTheme = async (choice: ThemeChoice) => { await api.setSetting('theme', choice); setChoice(choice); };
  return <ThemeContext.Provider value={{ theme, themeChoice, setTheme, toggleTheme: () => { void setTheme(theme === 'dark' ? 'light' : 'dark'); } }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => { const context = useContext(ThemeContext); if (!context) throw new Error('ThemeProvider missing'); return context; };
