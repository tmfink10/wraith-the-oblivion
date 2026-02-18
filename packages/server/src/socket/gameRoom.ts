import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  activeSessions,
  socketRegistry,
  generateRoomCode,
} from './index.js';
import { loadChatHistory } from './chatEvents.js';
import { db } from '../db/index.js';
import { sessions as sessionsTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import {
  ClientEvents,
  ServerEvents,
} from '@wraith/shared';
import type {
  CreateSessionPayload,
  CreateSessionResponse,
  JoinSessionPayload,
  JoinSessionResponse,
  LeaveSessionPayload,
  SelectCharacterPayload,
  UpdateSessionStatePayload,
  SaveGameStatePayload,
  SessionListItem,
  GameSession,
  SessionPlayer,
  SessionState,
  JwtPayload,
} from '@wraith/shared';

/** Get the authenticated user from the socket, if any */
function getAuthUser(socket: Socket): JwtPayload | undefined {
  return (socket as unknown as { authUser?: JwtPayload }).authUser;
}

export function registerGameRoomHandlers(io: Server, socket: Socket): void {
  // ─── CREATE SESSION ──────────────────────────────────────────

  socket.on(
    ClientEvents.CREATE_SESSION,
    async (
      payload: CreateSessionPayload,
      callback: (response: CreateSessionResponse) => void,
    ) => {
      try {
        const sessionId = generateRoomCode();
        const now = new Date().toISOString();
        const authUser = getAuthUser(socket);

        // Prefer authenticated userId over anonymous clientId
        const userId = authUser?.userId ?? payload.storytellerIdentity.clientId;

        const storyteller: SessionPlayer = {
          userId,
          characterId: '',
          displayName: payload.storytellerIdentity.displayName,
          isStoryteller: true,
          isConnected: true,
        };

        const session: GameSession = {
          id: sessionId,
          name: payload.name || 'New Session',
          campaignId: payload.campaignId ?? '',
          storytellerId: userId,
          mode: 'multiplayer',
          state: 'lobby',
          players: [storyteller],
          chatLog: [],
          combat: null,
          createdAt: now,
          updatedAt: now,
        };

        // Store in-memory
        activeSessions.set(sessionId, session);

        // Persist to DB
        await db.insert(sessionsTable).values({
          id: sessionId,
          campaignId: payload.campaignId ?? null,
          name: session.name,
          mode: 'multiplayer',
          state: 'lobby',
          gameState: JSON.stringify(session),
          createdAt: now,
          updatedAt: now,
        });

        // Join socket room
        socket.join(sessionId);
        socketRegistry.set(socket.id, {
          sessionId,
          clientId: userId,
          displayName: payload.storytellerIdentity.displayName,
          authUserId: authUser?.userId,
        });

        console.log(
          `Session ${sessionId} created by ${payload.storytellerIdentity.displayName}`,
        );
        callback({ sessionId, session });
      } catch (err) {
        console.error('Error creating session:', err);
        socket.emit(ServerEvents.ERROR, {
          message: 'Failed to create session',
        });
      }
    },
  );

  // ─── JOIN SESSION ────────────────────────────────────────────

  socket.on(
    ClientEvents.JOIN_SESSION,
    async (
      payload: JoinSessionPayload,
      callback: (response: JoinSessionResponse) => void,
    ) => {
      try {
        let session = activeSessions.get(payload.sessionId);
        const authUser = getAuthUser(socket);

        // Prefer authenticated userId over anonymous clientId
        const userId = authUser?.userId ?? payload.identity.clientId;

        // Try loading from DB if not in memory
        if (!session) {
          const rows = await db
            .select()
            .from(sessionsTable)
            .where(eq(sessionsTable.id, payload.sessionId));
          if (rows.length > 0 && rows[0].gameState) {
            session = JSON.parse(rows[0].gameState) as GameSession;
            activeSessions.set(payload.sessionId, session);
          }
        }

        if (!session) {
          callback({
            success: false,
            session: null as unknown as GameSession,
            error: 'Session not found',
          });
          return;
        }

        // Check for reconnection (try both auth userId and clientId)
        const existingPlayer = session.players.find(
          (p) => p.userId === userId || p.userId === payload.identity.clientId,
        );

        if (existingPlayer) {
          // Reconnection — update userId to auth if available
          existingPlayer.isConnected = true;
          existingPlayer.displayName = payload.identity.displayName;
          if (authUser) {
            existingPlayer.userId = userId;
          }
          if (payload.characterId) {
            existingPlayer.characterId = payload.characterId;
          }

          socket.join(payload.sessionId);
          socketRegistry.set(socket.id, {
            sessionId: payload.sessionId,
            clientId: userId,
            displayName: payload.identity.displayName,
            authUserId: authUser?.userId,
          });

          // Notify others
          socket.to(payload.sessionId).emit(ServerEvents.PLAYER_RECONNECTED, {
            clientId: userId,
          });

          console.log(
            `Player ${payload.identity.displayName} reconnected to session ${payload.sessionId}`,
          );
        } else {
          // New player
          const player: SessionPlayer = {
            userId,
            characterId: payload.characterId ?? '',
            displayName: payload.identity.displayName,
            isStoryteller: false,
            isConnected: true,
          };

          session.players.push(player);

          socket.join(payload.sessionId);
          socketRegistry.set(socket.id, {
            sessionId: payload.sessionId,
            clientId: userId,
            displayName: payload.identity.displayName,
            authUserId: authUser?.userId,
          });

          // Notify others
          socket.to(payload.sessionId).emit(ServerEvents.PLAYER_JOINED, player);

          console.log(
            `Player ${payload.identity.displayName} joined session ${payload.sessionId}`,
          );
        }

        // Send chat history to the joiner
        const chatHistory = await loadChatHistory(payload.sessionId, 50);
        socket.emit(ServerEvents.CHAT_HISTORY, chatHistory);

        callback({ success: true, session });
      } catch (err) {
        console.error('Error joining session:', err);
        callback({
          success: false,
          session: null as unknown as GameSession,
          error: 'Failed to join session',
        });
      }
    },
  );

  // ─── LEAVE SESSION ───────────────────────────────────────────

  socket.on(ClientEvents.LEAVE_SESSION, (payload: LeaveSessionPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    const reg = socketRegistry.get(socket.id);
    if (!reg) return;

    // Remove player from session
    session.players = session.players.filter(
      (p) => p.userId !== reg.clientId,
    );

    socket.leave(payload.sessionId);
    socketRegistry.delete(socket.id);

    // Notify others
    io.to(payload.sessionId).emit(ServerEvents.PLAYER_LEFT, {
      clientId: reg.clientId,
    });

    console.log(
      `Player ${reg.displayName} left session ${payload.sessionId}`,
    );

    // Cleanup if empty
    if (session.players.length === 0) {
      // Persist final state before cleanup
      persistSession(session).catch(console.error);
      activeSessions.delete(payload.sessionId);
      console.log(`Session ${payload.sessionId} removed (empty)`);
    }
  });

  // ─── LIST SESSIONS ───────────────────────────────────────────

  socket.on(
    ClientEvents.LIST_SESSIONS,
    (callback: (list: SessionListItem[]) => void) => {
      const list: SessionListItem[] = [];
      for (const [id, session] of activeSessions.entries()) {
        const st = session.players.find((p) => p.isStoryteller);
        list.push({
          id,
          name: session.name,
          storytellerName: st?.displayName ?? 'Unknown',
          playerCount: session.players.length,
          state: session.state,
          campaignId: session.campaignId || undefined,
        });
      }
      callback(list);
    },
  );

  // ─── SELECT CHARACTER ────────────────────────────────────────

  socket.on(
    ClientEvents.SELECT_CHARACTER,
    (payload: SelectCharacterPayload) => {
      const session = activeSessions.get(payload.sessionId);
      if (!session) return;

      const reg = socketRegistry.get(socket.id);
      if (!reg) return;

      const player = session.players.find(
        (p) => p.userId === reg.clientId,
      );
      if (player) {
        player.characterId = payload.characterId;
        io.to(payload.sessionId).emit(ServerEvents.SESSION_UPDATED, session);
      }
    },
  );

  // ─── UPDATE SESSION STATE ────────────────────────────────────

  socket.on(
    ClientEvents.UPDATE_STATE,
    (payload: UpdateSessionStatePayload) => {
      const session = activeSessions.get(payload.sessionId);
      if (!session) return;

      const reg = socketRegistry.get(socket.id);
      if (!reg) return;

      // Only storyteller can change state
      const st = session.players.find((p) => p.isStoryteller);
      if (st?.userId !== reg.clientId) {
        socket.emit(ServerEvents.ERROR, {
          message: 'Only the Storyteller can change session state',
        });
        return;
      }

      session.state = payload.newState;
      session.updatedAt = new Date().toISOString();

      io.to(payload.sessionId).emit(ServerEvents.SESSION_STATE_CHANGED, {
        state: payload.newState,
      });

      console.log(`Session ${payload.sessionId} state → ${payload.newState}`);
    },
  );

  // ─── SAVE GAME ──────────────────────────────────────────────

  socket.on(
    ClientEvents.SAVE_GAME,
    async (
      payload: SaveGameStatePayload,
      callback: (response: { success: boolean }) => void,
    ) => {
      try {
        const session = activeSessions.get(payload.sessionId);
        if (!session) {
          callback({ success: false });
          return;
        }

        await persistSession(session);
        io.to(payload.sessionId).emit(ServerEvents.GAME_SAVED, {
          success: true,
        });
        callback({ success: true });
        console.log(`Session ${payload.sessionId} saved to DB`);
      } catch (err) {
        console.error('Error saving session:', err);
        callback({ success: false });
      }
    },
  );
}

// ─── Helpers ────────────────────────────────────────────────────

async function persistSession(session: GameSession): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(sessionsTable)
    .set({
      state: session.state,
      gameState: JSON.stringify(session),
      updatedAt: now,
    })
    .where(eq(sessionsTable.id, session.id));
}
