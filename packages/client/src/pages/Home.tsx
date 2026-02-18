import { useAuth } from '../hooks/useAuth';

export function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
      <h1 className="text-5xl font-bold text-wraith-300 mb-4 tracking-wider text-center">
        Wraith: The Oblivion
      </h1>
      <p className="text-xl text-wraith-400 mb-2">with The Hopeful Damned</p>

      {isAuthenticated ? (
        <p className="text-gray-400 mt-4">
          Welcome back, <span className="text-wraith-300">{user?.displayName}</span>
        </p>
      ) : (
        <p className="text-gray-500 mt-4 text-sm">
          Digital Tabletop RPG &middot;{' '}
          <a href="/auth" className="text-wraith-400 hover:text-wraith-300 underline transition-colors">
            Sign in
          </a>{' '}
          to save your progress
        </p>
      )}

      <div className="mt-12 flex flex-wrap gap-4 justify-center">
        <a
          href="/create"
          className="px-6 py-3 bg-wraith-700 hover:bg-wraith-600 text-gray-100 rounded-lg transition-colors"
        >
          New Character
        </a>
        <a
          href="/solo"
          className="px-6 py-3 bg-wraith-800 hover:bg-wraith-700 text-gray-300 rounded-lg transition-colors border border-wraith-600"
        >
          Solo Play
        </a>
        <a
          href="/lobby"
          className="px-6 py-3 bg-wraith-800 hover:bg-wraith-700 text-gray-300 rounded-lg transition-colors border border-wraith-600"
        >
          Join Session
        </a>
        {isAuthenticated && (
          <a
            href="/campaigns"
            className="px-6 py-3 bg-wraith-800 hover:bg-wraith-700 text-gray-300 rounded-lg transition-colors border border-wraith-600"
          >
            My Campaigns
          </a>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mt-16 text-center">
          <a
            href="/auth"
            className="inline-block px-8 py-3 bg-wraith-700 hover:bg-wraith-600 text-wraith-100 rounded-lg transition-colors text-sm"
          >
            Sign In / Create Account
          </a>
        </div>
      )}
    </div>
  );
}
