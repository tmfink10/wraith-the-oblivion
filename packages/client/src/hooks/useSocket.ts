import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const TOKEN_KEY = 'wraith-token';

// ─── Module-level singleton ─────────────────────────────────────
let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    const token = localStorage.getItem(TOKEN_KEY);
    socketInstance = io({
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      auth: token ? { token } : undefined,
    });
  }
  return socketInstance;
}

/**
 * Destroy and recreate the socket connection.
 * Call after login/logout to update the auth token.
 */
export function reconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  // Force recreation on next getSocket() call
  getSocket();
}

// ─── Hook ───────────────────────────────────────────────────────

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const s = socketRef.current;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // Set initial state
    setConnected(s.connected);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  /**
   * Emit an event, optionally with a callback-based acknowledgement.
   * Returns a promise that resolves with the callback's argument.
   */
  const emit = useCallback(
    <T = void>(event: string, payload?: unknown): Promise<T> => {
      return new Promise((resolve) => {
        socketRef.current.emit(event, payload, (response: T) => {
          resolve(response);
        });
      });
    },
    [],
  );

  /**
   * Listen for an event. Returns an unsubscribe function.
   */
  const on = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: string, handler: (...args: any[]) => void): (() => void) => {
      socketRef.current.on(event, handler);
      return () => {
        socketRef.current.off(event, handler);
      };
    },
    [],
  );

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
  };
}

export { getSocket };
