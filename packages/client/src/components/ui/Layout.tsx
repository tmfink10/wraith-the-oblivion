import { type ReactNode, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { reconnectSocket } from '../../hooks/useSocket';

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { href: '/characters', label: 'Characters' },
  { href: '/create', label: 'New Character' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/solo', label: 'Solo Play' },
  { href: '/lobby', label: 'Multiplayer' },
];

function isActive(href: string): boolean {
  const path = window.location.pathname;
  if (href === '/') return path === '/';
  return path.startsWith(href);
}

export function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    reconnectSocket();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-wraith-950 text-gray-100">
      <nav className="sticky top-0 z-50 border-b border-wraith-800 bg-wraith-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="text-lg font-bold text-wraith-300 tracking-wide hover:text-wraith-200 transition-colors shrink-0"
          >
            Wraith: The Oblivion
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`transition-colors pb-0.5 ${
                  isActive(link.href)
                    ? 'text-wraith-200 border-b-2 border-wraith-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {link.label}
              </a>
            ))}

            {/* Auth section */}
            <div className="ml-2 pl-2 border-l border-wraith-800 flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="text-wraith-300 text-xs">{user?.displayName}</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <a
                  href="/auth"
                  className={`transition-colors ${
                    isActive('/auth')
                      ? 'text-wraith-200'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Sign In
                </a>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-wraith-800 bg-wraith-900/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`block py-2 text-sm transition-colors ${
                    isActive(link.href)
                      ? 'text-wraith-200 font-medium'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-2 mt-2 border-t border-wraith-800">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <span className="text-wraith-300 text-sm">{user?.displayName}</span>
                    <button
                      onClick={handleLogout}
                      className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <a
                    href="/auth"
                    className="block py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
