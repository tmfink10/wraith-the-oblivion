import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

type AuthTab = 'login' | 'register';

export function Auth() {
  const [tab, setTab] = useState<AuthTab>('login');
  const { login, register, error, isLoading, clearError } = useAuth();

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    clearError();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const success = await login(loginUsername, loginPassword);
    if (success) {
      window.location.href = '/';
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const success = await register(regUsername, regPassword, regDisplayName);
    if (success) {
      window.location.href = '/';
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-wraith-200 mb-2">Enter the Shadowlands</h1>
        <p className="text-gray-500 text-sm">Sign in to track your characters and campaigns</p>
      </div>

      {/* Tab Toggle */}
      <div className="flex border-b border-wraith-800 mb-6">
        <button
          onClick={() => switchTab('login')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === 'login'
              ? 'text-wraith-200 border-b-2 border-wraith-400'
              : 'text-gray-500 hover:text-gray-400'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => switchTab('register')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === 'register'
              ? 'text-wraith-200 border-b-2 border-wraith-400'
              : 'text-gray-500 hover:text-gray-400'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Login Form */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full px-4 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 transition-colors"
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-4 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 transition-colors"
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded bg-wraith-700 hover:bg-wraith-600 text-wraith-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Register Form */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              className="w-full px-4 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 transition-colors"
              placeholder="At least 3 characters"
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              value={regDisplayName}
              onChange={(e) => setRegDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 transition-colors"
              placeholder="How others see you"
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full px-4 py-2 bg-wraith-900/50 border border-wraith-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-wraith-500 transition-colors"
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded bg-wraith-700 hover:bg-wraith-600 text-wraith-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      )}

      {/* Footer */}
      <p className="text-center text-gray-600 text-xs mt-6">
        Authentication is optional — you can still use the app without an account.
      </p>
    </div>
  );
}
