import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type LanguageMode = 'vi' | 'en';

interface ThemeState {
  theme: ThemeMode;
  language: LanguageMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (lang: LanguageMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: (localStorage.getItem('theme') as ThemeMode) || 'dark',
      language: (localStorage.getItem('language') as LanguageMode) || 'vi',

      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: nextTheme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('theme-light', 'theme-dark', 'light', 'dark');
          document.documentElement.classList.add(`theme-${nextTheme}`, nextTheme);
        }
      },

      setTheme: (theme: ThemeMode) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('theme-light', 'theme-dark', 'light', 'dark');
          document.documentElement.classList.add(`theme-${theme}`, theme);
        }
      },

      setLanguage: (language: LanguageMode) => {
        set({ language });
      },
    }),
    {
      name: 'psp-theme-storage',
    }
  )
);
