import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { activeSessions, socketRegistry, isStoryteller } from './index.js';
import { ClientEvents, ServerEvents } from '@wraith/shared';
import type {
  MoveTokenPayload,
  AddTokenPayload,
  RemoveTokenPayload,
  UpdateFogPayload,
  SetMapBackgroundPayload,
  MapState,
  MapToken,
} from '@wraith/shared';

// ─── Extended session state: map is stored alongside game state ──

// We store MapState in a parallel map keyed by sessionId
// (since GameSession doesn't have a mapState field in the current types)
export const sessionMapStates = new Map<string, MapState>();

export function registerMapHandlers(io: Server, socket: Socket): void {
  // ─── MOVE TOKEN ────────────────────────────────────────────

  socket.on(ClientEvents.MOVE_TOKEN, (payload: MoveTokenPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    const mapState = sessionMapStates.get(payload.sessionId);
    if (!mapState) return;

    const token = mapState.tokens.find((t) => t.id === payload.tokenId);
    if (!token) return;

    // Validate: player can move their own token, ST can move any
    const reg = socketRegistry.get(socket.id);
    if (!reg) return;

    const isSt = isStoryteller(socket.id, session);
    const ownsToken = token.characterId
      && session.players.some(
        (p) => p.userId === reg.clientId && p.characterId === token.characterId,
      );

    if (!isSt && !ownsToken) {
      socket.emit(ServerEvents.ERROR, {
        message: 'You can only move your own token',
      });
      return;
    }

    token.x = payload.x;
    token.y = payload.y;

    io.to(payload.sessionId).emit(ServerEvents.TOKEN_MOVED, {
      tokenId: payload.tokenId,
      x: payload.x,
      y: payload.y,
    });
  });

  // ─── ADD TOKEN ─────────────────────────────────────────────

  socket.on(ClientEvents.ADD_TOKEN, (payload: AddTokenPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    let mapState = sessionMapStates.get(payload.sessionId);
    if (!mapState) {
      mapState = createDefaultMapState();
      sessionMapStates.set(payload.sessionId, mapState);
    }

    const token: MapToken = {
      id: uuidv4(),
      ...payload.token,
    };

    mapState.tokens.push(token);

    io.to(payload.sessionId).emit(ServerEvents.TOKEN_ADDED, token);
  });

  // ─── REMOVE TOKEN ──────────────────────────────────────────

  socket.on(ClientEvents.REMOVE_TOKEN, (payload: RemoveTokenPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    if (!isStoryteller(socket.id, session)) {
      socket.emit(ServerEvents.ERROR, {
        message: 'Only the Storyteller can remove tokens',
      });
      return;
    }

    const mapState = sessionMapStates.get(payload.sessionId);
    if (!mapState) return;

    mapState.tokens = mapState.tokens.filter(
      (t) => t.id !== payload.tokenId,
    );

    io.to(payload.sessionId).emit(ServerEvents.TOKEN_REMOVED, {
      tokenId: payload.tokenId,
    });
  });

  // ─── UPDATE FOG ────────────────────────────────────────────

  socket.on(ClientEvents.UPDATE_FOG, (payload: UpdateFogPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    if (!isStoryteller(socket.id, session)) {
      socket.emit(ServerEvents.ERROR, {
        message: 'Only the Storyteller can update fog of war',
      });
      return;
    }

    const mapState = sessionMapStates.get(payload.sessionId);
    if (!mapState) return;

    for (const { row, col, visible } of payload.cells) {
      if (
        mapState.fogOfWar[row] &&
        mapState.fogOfWar[row][col] !== undefined
      ) {
        mapState.fogOfWar[row][col] = visible;
      }
    }

    io.to(payload.sessionId).emit(ServerEvents.FOG_UPDATED, {
      cells: payload.cells,
    });
  });

  // ─── SET MAP BACKGROUND ────────────────────────────────────

  socket.on(
    ClientEvents.SET_MAP_BG,
    (payload: SetMapBackgroundPayload) => {
      const session = activeSessions.get(payload.sessionId);
      if (!session) return;

      if (!isStoryteller(socket.id, session)) {
        socket.emit(ServerEvents.ERROR, {
          message: 'Only the Storyteller can set the map background',
        });
        return;
      }

      const mapState: MapState = {
        backgroundUrl: payload.backgroundUrl,
        gridSize: payload.gridSize,
        width: payload.width,
        height: payload.height,
        tokens: sessionMapStates.get(payload.sessionId)?.tokens ?? [],
        fogOfWar: Array.from({ length: payload.height }, () =>
          Array(payload.width).fill(true),
        ),
        panX: 0,
        panY: 0,
        zoom: 1,
      };

      sessionMapStates.set(payload.sessionId, mapState);

      io.to(payload.sessionId).emit(ServerEvents.MAP_BG_SET, mapState);
      console.log(
        `Map background set for session ${payload.sessionId}: ${payload.width}x${payload.height}`,
      );
    },
  );
}

// ─── Helpers ────────────────────────────────────────────────────

export function createDefaultMapState(): MapState {
  return {
    backgroundUrl: null,
    gridSize: 40,
    width: 20,
    height: 20,
    tokens: [],
    fogOfWar: Array.from({ length: 20 }, () => Array(20).fill(true)),
    panX: 0,
    panY: 0,
    zoom: 1,
  };
}
