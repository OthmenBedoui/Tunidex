import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'tunidex-theme';

export const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyThemeMode = (themeMode: ThemeMode) => {
  document.documentElement.classList.toggle('dark', themeMode === 'dark');
  window.localStorage.setItem(STORAGE_KEY, themeMode);
};

export const useThemeMode = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return { themeMode, toggleThemeMode };
};
