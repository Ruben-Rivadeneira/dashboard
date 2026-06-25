import { useState, useEffect, useCallback } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // Verificar localStorage primero
    const stored = localStorage.getItem('callcenter-theme');
    if (stored) {
      return stored === 'dark';
    }
    // Si no hay preferencia guardada, usar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Aplicar clase al root element
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persistir en localStorage
    localStorage.setItem('callcenter-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Escuchar cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo cambiar si el usuario no ha establecido una preferencia
      const stored = localStorage.getItem('callcenter-theme');
      if (!stored) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggle };
}
