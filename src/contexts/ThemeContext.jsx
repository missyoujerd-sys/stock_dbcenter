import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function getInitialThemeMode() {
  if (typeof window === 'undefined') return false;
  try {
    const savedTheme = window.localStorage?.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
  } catch (_) {}
  try {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (_) {
    return false;
  }
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialThemeMode);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      try {
        window.localStorage?.setItem('theme', 'dark');
      } catch (_) {}
    } else {
      root.classList.remove('dark');
      try {
        window.localStorage?.setItem('theme', 'light');
      } catch (_) {}
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
