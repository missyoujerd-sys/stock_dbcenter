import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function safeReadStorage(key) {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeWriteStorage(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    return;
  }
}

function getInitialThemeMode() {
  if (typeof window === 'undefined') return false;
  const savedTheme = safeReadStorage('theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  try {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialThemeMode);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      safeWriteStorage('theme', 'dark');
    } else {
      root.classList.remove('dark');
      safeWriteStorage('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
