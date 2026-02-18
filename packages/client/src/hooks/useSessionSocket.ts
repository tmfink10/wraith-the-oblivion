import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useSessionStore } from '../stores/sessionStore';
import { ServerEvents } from '@wraith/shared';
import type {
  GameSession,
  SessionPlayer,
  SessionState,
  ChatMessage,
  CombatState,
  InitiativeEntry,
  MapState,
  MapToken,
  DiceRollBroadcast,
} from '@wraith/shared';

/**
 * Wire all server→client Socket events to sessionStore actions.
 * Call once in GameSession page. Cleanup is automatic.
 */
export function useSessionSocket(sessionId: string | undefined): void {
  const { on } = useSocket();
  const {
    updateSession,
    playerJoined,
    playerLeft,
    playerReconnected,
    sessionStateChanged,
    addChatMessage,
    setChatHistory,
    setCombatState,
    updateInitiativeOrder,
    advanceTurn,
    setMapState,
    moveToken,
    addToken,
    removeToken,
    updateFog,
  } = useSessionStore();

  useEffect(() => {
    if (!sessionId) return;

    const unsubs: Array<() => void> = [];

    // ─── Session events ───────────────────────────────────────
    unsubs.push(
      on(ServerEvents.SESSION_UPDATED, (session: GameSession) => {
        updateSession(session);
      }),
    );

    unsubs.push(
      on(ServerEvents.PLAYER_JOINED, (player: SessionPlayer) => {
        playerJoined(player);
      }),
    );

    unsubs.push(
      on(ServerEvents.PLAYER_LEFT, ({ clientId }: { clientId: string }) => {
        playerLeft(clientId);
      }),
    );

    unsubs.push(
      on(
        ServerEvents.PLAYER_RECONNECTED,
        ({ clientId }: { clientId: string }) => {
          playerReconnected(clientId);
        },
      ),
    );

    unsubs.push(
      on(
        ServerEvents.SESSION_STATE_CHANGED,
        ({ state }: { state: SessionState }) => {
          sessionStateChanged(state);
        },
      ),
    );

    unsubs.push(
      on(ServerEvents.GAME_SAVED, () => {
        // Could show a toast notification
      }),
    );

    // ─── Chat events ──────────────────────────────────────────
    unsubs.push(
      on(ServerEvents.CHAT_MESSAGE, (message: ChatMessage) => {
        addChatMessage(message);
      }),
    );

    unsubs.push(
      on(ServerEvents.CHAT_HISTORY, (messages: ChatMessage[]) => {
        setChatHistory(messages);
      }),
    );

    // ─── Dice events ──────────────────────────────────────────
    unsubs.push(
      on(ServerEvents.DICE_RESULT, (broadcast: DiceRollBroadcast) => {
        addChatMessage(broadcast.message);
      }),
    );

    // ─── Combat events ────────────────────────────────────────
    unsubs.push(
      on(ServerEvents.COMBAT_STARTED, (combat: CombatState) => {
        setCombatState(combat);
      }),
    );

    unsubs.push(
      on(ServerEvents.INITIATIVE_ROLLED, (_entry: InitiativeEntry) => {
        // Individual roll — handled by ORDER_SET below
      }),
    );

    unsubs.push(
      on(
        ServerEvents.INITIATIVE_ORDER_SET,
        ({ order }: { order: InitiativeEntry[] }) => {
          updateInitiativeOrder(order);
        },
      ),
    );

    unsubs.push(
      on(ServerEvents.TURN_ADVANCED, (combat: CombatState) => {
        advanceTurn(combat);
      }),
    );

    unsubs.push(
      on(ServerEvents.COMBAT_ENDED, () => {
        setCombatState(null);
      }),
    );

    // ─── Map events ───────────────────────────────────────────
    unsubs.push(
      on(
        ServerEvents.TOKEN_MOVED,
        ({ tokenId, x, y }: { tokenId: string; x: number; y: number }) => {
          moveToken(tokenId, x, y);
        },
      ),
    );

    unsubs.push(
      on(ServerEvents.TOKEN_ADDED, (token: MapToken) => {
        addToken(token);
      }),
    );

    unsubs.push(
      on(
        ServerEvents.TOKEN_REMOVED,
        ({ tokenId }: { tokenId: string }) => {
          removeToken(tokenId);
        },
      ),
    );

    unsubs.push(
      on(
        ServerEvents.FOG_UPDATED,
        ({
          cells,
        }: {
          cells: Array<{ row: number; col: number; visible: boolean }>;
        }) => {
          updateFog(cells);
        },
      ),
    );

    unsubs.push(
      on(ServerEvents.MAP_BG_SET, (mapState: MapState) => {
        setMapState(mapState);
      }),
    );

    // ─── Cleanup ──────────────────────────────────────────────
    return () => {
      for (const unsub of unsubs) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
}
