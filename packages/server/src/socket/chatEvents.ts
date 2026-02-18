import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { activeSessions, socketRegistry } from './index.js';
import { db } from '../db/index.js';
import { chatLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { ClientEvents, ServerEvents } from '@wraith/shared';
import type { SendChatPayload, ChatMessage } from '@wraith/shared';

export function registerChatHandlers(io: Server, socket: Socket): void {
  socket.on(ClientEvents.SEND_CHAT, async (payload: SendChatPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    const reg = socketRegistry.get(socket.id);
    if (!reg) return;

    const message: ChatMessage = {
      id: uuidv4(),
      sessionId: payload.sessionId,
      senderId: reg.clientId,
      senderName: reg.displayName,
      type: payload.type,
      content: payload.content,
      timestamp: new Date().toISOString(),
    };

    // Append to in-memory chat log (cap at 200)
    session.chatLog.push(message);
    if (session.chatLog.length > 200) {
      session.chatLog = session.chatLog.slice(-200);
    }

    // Persist to DB (async, non-blocking)
    persistChatMessage(message).catch(console.error);

    // Broadcast to all in room
    io.to(payload.sessionId).emit(ServerEvents.CHAT_MESSAGE, message);
  });
}

// ─── Helpers ────────────────────────────────────────────────────

async function persistChatMessage(message: ChatMessage): Promise<void> {
  await db.insert(chatLogs).values({
    id: message.id,
    sessionId: message.sessionId,
    senderId: message.senderId,
    senderName: message.senderName,
    type: message.type,
    content: message.content,
    diceData: message.diceRoll ? JSON.stringify(message.diceRoll) : null,
    timestamp: message.timestamp,
  });
}

/**
 * Load chat history from DB for a session.
 * Returns messages in chronological order (oldest first).
 */
export async function loadChatHistory(
  sessionId: string,
  limit: number = 50,
): Promise<ChatMessage[]> {
  try {
    const rows = await db
      .select()
      .from(chatLogs)
      .where(eq(chatLogs.sessionId, sessionId))
      .orderBy(chatLogs.timestamp)
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      senderId: row.senderId,
      senderName: row.senderName,
      type: row.type as ChatMessage['type'],
      content: row.content,
      timestamp: row.timestamp,
      diceRoll: row.diceData ? JSON.parse(row.diceData) : undefined,
    }));
  } catch (err) {
    console.error('Error loading chat history:', err);
    return [];
  }
}
