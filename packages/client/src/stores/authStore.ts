import { create } from 'zustand';
import type { AuthUser } from '@wraith/shared';

const API_BASE = '/api/auth';
const TOKEN_KEY = 'wraith-token';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
  clearError: () => void;

  // Computed helpers
  isAuthenticated: () => boolean;
  getAuthHeaders: () => Record<string, string>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        set({ isLoading: false, error: data.error || 'Login failed' });
        return false;
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ user: data.user, token: data.token, isLoading: false, error: null });
      return true;
    } catch {
      set({ isLoading: false, error: 'Network error — could not reach server' });
      return false;
    }
  },

  register: async (username, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      });

      if (!res.ok) {
        const data = await res.json();
        set({ isLoading: false, error: data.error || 'Registration failed' });
        return false;
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      set({ user: data.user, token: data.token, isLoading: false, error: null });
      return true;
    } catch {
      set({ isLoading: false, error: 'Network error — could not reach server' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, error: null });
  },

  loadFromStorage: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        set({ user, token, isLoading: false });
      } else {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null, isLoading: false });
      }
    } catch {
      // Server unreachable — keep token for retry later
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  isAuthenticated: () => !!get().user,

  getAuthHeaders: () => {
    const token = get().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
}));
