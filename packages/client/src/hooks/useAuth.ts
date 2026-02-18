import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Initialize auth state from localStorage on app startup.
 * Call once in the App root component.
 */
export function useAuthInit(): void {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);
}

/**
 * Convenience hook returning auth state and actions.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const getAuthHeaders = useAuthStore((s) => s.getAuthHeaders);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError,
    getAuthHeaders,
  };
}
