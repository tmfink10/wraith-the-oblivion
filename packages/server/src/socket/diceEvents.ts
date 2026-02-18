import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { rollPool } from '@wraith/shared';
import {
  activeSessions,
  socketRegistry,
  findStorytellerSocket,
} from './index.js';
import { db } from '../db/index.js';
import { chatLogs } from '../db/schema.js';
import { ClientEvents, ServerEvents } from '@wraith/shared';
import type {
  DiceRollPayload,
  DiceRollBroadcast,
  ChatMessage,
} from '@wraith/shared';

export function registerDiceHandlers(io: Server, socket: Socket): void {
  socket.on(ClientEvents.ROLL_DICE, async (payload: DiceRollPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    const reg = socketRegistry.get(socket.id);
    if (!reg) return;

    // Roll dice on the SERVER (authoritative)
    const result = rollPool(
      payload.poolSize,
      payload.difficulty,
      payload.isSpecialty,
    );

    // Build result description
    const successText = result.isBotch
      ? 'BOTCH!'
      : `${result.successes} success${result.successes !== 1 ? 'es' : ''}`;
    const labelPrefix = payload.label ? `${payload.label}: ` : '';
    const content = `${labelPrefix}${reg.displayName} rolls ${payload.poolSize}d10 (diff ${payload.difficulty}) — ${successText} [${result.dice.join(', ')}]`;

    const message: ChatMessage = {
      id: uuidv4(),
      sessionId: payload.sessionId,
      senderId: reg.clientId,
      senderName: reg.displayName,
      type: 'dice_roll',
      content,
      timestamp: new Date().toISOString(),
      diceRoll: {
        dice: result.dice,
        successes: result.successes,
        difficulty: result.difficulty,
        isBotch: result.isBotch,
      },
    };

    // Append to in-memory chat log
    session.chatLog.push(message);
    if (session.chatLog.length > 200) {
      session.chatLog = session.chatLog.slice(-200);
    }

    // Persist to DB (async)
    persistDiceRoll(message).catch(console.error);

    const broadcast: DiceRollBroadcast = {
      message,
      rollerId: reg.clientId,
      rollerName: reg.displayName,
    };

    if (payload.isPrivate) {
      // Private roll: only send to roller and ST
      socket.emit(ServerEvents.DICE_RESULT, broadcast);
      const stSocketId = findStorytellerSocket(io, session);
      if (stSocketId && stSocketId !== socket.id) {
        io.to(stSocketId).emit(ServerEvents.DICE_RESULT, broadcast);
      }
    } else {
      // Broadcast to all
      io.to(payload.sessionId).emit(ServerEvents.DICE_RESULT, broadcast);
    }
  });
}

async function persistDiceRoll(message: ChatMessage): Promise<void> {
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
