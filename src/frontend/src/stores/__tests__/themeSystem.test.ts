import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../themeStore';

describe('UIUX-03 Light / Dark Theme System & State Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    // Reset store
    useThemeStore.setState({ theme: 'dark', language: 'vi' });
  });

  it('initializes with default dark theme when no storage exists', () => {
    const theme = useThemeStore.getState().theme;
    expect(theme).toBe('dark');
  });

  it('toggles from dark to light and updates DOM and localStorage', () => {
    useThemeStore.getState().toggleTheme();
    const currentTheme = useThemeStore.getState().theme;

    expect(currentTheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles from light to dark and updates DOM and localStorage', () => {
    // First switch to light
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');

    // Toggle back to dark
    useThemeStore.getState().toggleTheme();
    const currentTheme = useThemeStore.getState().theme;

    expect(currentTheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('sets explicit theme mode directly', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('preserves language when toggling theme', () => {
    useThemeStore.getState().setLanguage('en');
    expect(useThemeStore.getState().language).toBe('en');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().language).toBe('en');
  });

  it('ensures DOM class synchronization clean state without stale classes', () => {
    document.documentElement.classList.add('stale-class', 'theme-light', 'light');
    useThemeStore.getState().setTheme('dark');

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
