import { create } from 'zustand';

interface ThemeStore {
  theme: 'light' | 'dark';
  accentColor: string;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
}

export const THEME_COLORS = {
  blue: '221.2 83.2% 53.3%',
  purple: '262.1 83.3% 57.8%',
  green: '142.1 76.2% 36.3%',
  orange: '24.6 95% 53.1%',
  pink: '330.4 81.2% 56.7%',
  cyan: '189.6 94.3% 42.7%',
  red: '346.8 77.2% 49.8%',
  yellow: '47.9 95.8% 53.1%',
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  accentColor: localStorage.getItem('accentColor') || THEME_COLORS.blue,
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
  setAccentColor: (color: string) => {
    localStorage.setItem('accentColor', color);
    document.documentElement.style.setProperty('--primary', color);
    set({ accentColor: color });
  },
}));

// Initialiser la couleur et le thème
const initialColor = localStorage.getItem('accentColor') || THEME_COLORS.blue;
document.documentElement.style.setProperty('--primary', initialColor);

const initialTheme = localStorage.getItem('theme') || 'light';
if (initialTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
