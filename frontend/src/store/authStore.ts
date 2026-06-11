import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  focus_today?: string;
  focus_date?: string;
  notification_prefs?: Record<string, any>;
  createdAt?: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  loading: true,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
      set({ accessToken: token, loading: true });
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ accessToken: token, user: null, loading: false });
    }
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, loading: false });
  },
}));
