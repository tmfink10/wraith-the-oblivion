import { create } from 'zustand';
import { useAuthStore } from './authStore';
import type {
  GameSession,
  SessionPlayer,
  SessionState,
  ChatMessage,
  CombatState,
  InitiativeEntry,
  SessionListItem,
  MapState,
  MapToken,
} from '@wraith/shared';

// ─── Client Identity (pre-auth) ────────────────────────────────

export interface ClientIdentity {
  clientId: string;
  displayName: string;
}

function getOrCreateIdentity(): ClientIdentity {
  const stored = localStorage.getItem('wraith-identity');
  if (stored) {
    try {
      return JSON.parse(stored) as ClientIdentity;
    } catch {
      // corrupted — recreate
    }
  }
  const identity: ClientIdentity = {
    clientId: crypto.randomUUID(),
    displayName: '',
  };
  localStorage.setItem('wraith-identity', JSON.stringify(identity));
  return identity;
}

function persistIdentity(identity: ClientIdentity): void {
  localStorage.setItem('wraith-identity', JSON.stringify(identity));
}

// ─── Store Interface ────────────────────────────────────────────

interface SessionStore {
  // Identity
  identity: ClientIdentity;
  setDisplayName: (name: string) => void;

  // Connection
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Session
  currentSession: GameSession | null;
  isStoryteller: boolean;
  setCurrentSession: (session: GameSession) => void;
  updateSession: (session: GameSession) => void;
  leaveSession: () => void;

  // Lobby
  lobbyList: SessionListItem[];
  setLobbyList: (list: SessionListItem[]) => void;

  // Players
  playerJoined: (player: SessionPlayer) => void;
  playerLeft: (clientId: string) => void;
  playerReconnected: (clientId: string) => void;
  sessionStateChanged: (state: SessionState) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  setChatHistory: (messages: ChatMessage[]) => void;

  // Combat
  combatState: CombatState | null;
  setCombatState: (combat: CombatState | null) => void;
  updateInitiativeOrder: (order: InitiativeEntry[]) => void;
  advanceTurn: (combat: CombatState) => void;

  // Map
  mapState: MapState | null;
  setMapState: (mapState: MapState) => void;
  moveToken: (tokenId: string, x: number, y: number) => void;
  addToken: (token: MapToken) => void;
  removeToken: (tokenId: string) => void;
  updateFog: (cells: Array<{ row: number; col: number; visible: boolean }>) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  // ─── Identity ─────────────────────────────────────────────────
  identity: getOrCreateIdentity(),
  setDisplayName: (name: string) => {
    const identity = { ...get().identity, displayName: name };
    persistIdentity(identity);
    set({ identity });
  },

  // ─── Connection ───────────────────────────────────────────────
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // ─── Session ──────────────────────────────────────────────────
  currentSession: null,
  isStoryteller: false,
  setCurrentSession: (session) => {
    const { identity } = get();
    const authUser = useAuthStore.getState().user;
    const myId = authUser?.id || identity.clientId;
    set({
      currentSession: session,
      isStoryteller: session.storytellerId === myId,
      chatMessages: session.chatLog || [],
      combatState: session.combat,
    });
  },
  updateSession: (session) => {
    const { identity } = get();
    const authUser = useAuthStore.getState().user;
    const myId = authUser?.id || identity.clientId;
    set({
      currentSession: session,
      isStoryteller: session.storytellerId === myId,
      combatState: session.combat,
    });
  },
  leaveSession: () =>
    set({
      currentSession: null,
      isStoryteller: false,
      chatMessages: [],
      combatState: null,
      mapState: null,
    }),

  // ─── Lobby ────────────────────────────────────────────────────
  lobbyList: [],
  setLobbyList: (list) => set({ lobbyList: list }),

  // ─── Players ──────────────────────────────────────────────────
  playerJoined: (player) =>
    set((state) => {
      if (!state.currentSession) return state;
      const exists = state.currentSession.players.some(
        (p) => p.userId === player.userId,
      );
      if (exists) return state;
      return {
        currentSession: {
          ...state.currentSession,
          players: [...state.currentSession.players, player],
        },
      };
    }),
  playerLeft: (clientId) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          players: state.currentSession.players.map((p) =>
            p.userId === clientId ? { ...p, isConnected: false } : p,
          ),
        },
      };
    }),
  playerReconnected: (clientId) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          players: state.currentSession.players.map((p) =>
            p.userId === clientId ? { ...p, isConnected: true } : p,
          ),
        },
      };
    }),
  sessionStateChanged: (newState) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          state: newState,
        },
      };
    }),

  // ─── Chat ─────────────────────────────────────────────────────
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  setChatHistory: (messages) => set({ chatMessages: messages }),

  // ─── Combat ───────────────────────────────────────────────────
  combatState: null,
  setCombatState: (combat) => set({ combatState: combat }),
  updateInitiativeOrder: (order) =>
    set((state) => {
      if (!state.combatState) return state;
      return {
        combatState: { ...state.combatState, initiativeOrder: order },
      };
    }),
  advanceTurn: (combat) => set({ combatState: combat }),

  // ─── Map ──────────────────────────────────────────────────────
  mapState: null,
  setMapState: (mapState) => set({ mapState }),
  moveToken: (tokenId, x, y) =>
    set((state) => {
      if (!state.mapState) return state;
      return {
        mapState: {
          ...state.mapState,
          tokens: state.mapState.tokens.map((t) =>
            t.id === tokenId ? { ...t, x, y } : t,
          ),
        },
      };
    }),
  addToken: (token) =>
    set((state) => {
      if (!state.mapState) return state;
      return {
        mapState: {
          ...state.mapState,
          tokens: [...state.mapState.tokens, token],
        },
      };
    }),
  removeToken: (tokenId) =>
    set((state) => {
      if (!state.mapState) return state;
      return {
        mapState: {
          ...state.mapState,
          tokens: state.mapState.tokens.filter((t) => t.id !== tokenId),
        },
      };
    }),
  updateFog: (cells) =>
    set((state) => {
      if (!state.mapState) return state;
      const fog = state.mapState.fogOfWar.map((row) => [...row]);
      for (const { row, col, visible } of cells) {
        if (fog[row] && fog[row][col] !== undefined) {
          fog[row][col] = visible;
        }
      }
      return {
        mapState: { ...state.mapState, fogOfWar: fog },
      };
    }),
}));
