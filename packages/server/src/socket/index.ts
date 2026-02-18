import type { Server, Socket } from 'socket.io';
import { registerGameRoomHandlers } from './gameRoom.js';
import { registerChatHandlers } from './chatEvents.js';
import { registerDiceHandlers } from './diceEvents.js';
import { registerCombatHandlers } from './combatEvents.js';
import { registerMapHandlers } from './mapEvents.js';
import { verifyToken } from '../middleware/auth.js';
import type { GameSession, JwtPayload } from '@wraith/shared';
import { ServerEvents } from '@wraith/shared';

// ─── In-Memory State ────────────────────────────────────────────

/** Authoritative session state — the source of truth during gameplay */
export const activeSessions = new Map<string, GameSession>();

/** Maps socket.id → { sessionId, clientId, authUserId? } for reconnection tracking */
export const socketRegistry = new Map<
  string,
  { sessionId: string; clientId: string; displayName: string; authUserId?: string }
>();

// ─── Socket Setup ───────────────────────────────────────────────

export function setupSocketHandlers(io: Server): void {
  // JWT auth middleware for sockets — always allows connection (graceful migration)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        (socket as unknown as { authUser: JwtPayload }).authUser = payload;
      }
    }
    // Always allow connection — anonymous clients still work
    next();
  });

  io.on('connection', (socket: Socket) => {
    const authUser = (socket as unknown as { authUser?: JwtPayload }).authUser;
    console.log(`Client connected: ${socket.id}${authUser ? ` (auth: ${authUser.username})` : ' (anonymous)'}`);

    registerGameRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerDiceHandlers(io, socket);
    registerCombatHandlers(io, socket);
    registerMapHandlers(io, socket);

    socket.on('disconnect', () => {
      handleDisconnect(io, socket);
    });
  });
}

// ─── Disconnect Handling ────────────────────────────────────────

function handleDisconnect(io: Server, socket: Socket): void {
  const registration = socketRegistry.get(socket.id);
  if (!registration) {
    console.log(`Client disconnected (unregistered): ${socket.id}`);
    return;
  }

  const { sessionId, clientId, displayName } = registration;
  const session = activeSessions.get(sessionId);

  if (session) {
    // Mark player as disconnected (don't remove — allow rejoin)
    const player = session.players.find((p) => p.userId === clientId);
    if (player) {
      player.isConnected = false;
      io.to(sessionId).emit(ServerEvents.PLAYER_LEFT, { clientId });
      console.log(`Player ${displayName} disconnected from session ${sessionId}`);
    }

    // If no connected players remain, keep session alive for a grace period
    const connectedCount = session.players.filter((p) => p.isConnected).length;
    if (connectedCount === 0) {
      console.log(`Session ${sessionId} has no connected players`);
      // Session stays in activeSessions for reconnection
      // Could add a timeout to cleanup after N minutes
    }
  }

  socketRegistry.delete(socket.id);
}

// ─── Helpers ────────────────────────────────────────────────────

/** Look up the storyteller's socket for private rolls */
export function findStorytellerSocket(
  io: Server,
  session: GameSession,
): string | undefined {
  const st = session.players.find((p) => p.isStoryteller);
  if (!st) return undefined;

  for (const [socketId, reg] of socketRegistry.entries()) {
    if (reg.clientId === st.userId && reg.sessionId === session.id) {
      return socketId;
    }
  }
  return undefined;
}

/** Check if a socket belongs to the storyteller of a given session */
export function isStoryteller(socketId: string, session: GameSession): boolean {
  const reg = socketRegistry.get(socketId);
  if (!reg) return false;
  const st = session.players.find((p) => p.isStoryteller);
  return st?.userId === reg.clientId;
}

/** Generate a 6-character room code for easy sharing */
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
