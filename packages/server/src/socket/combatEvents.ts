import type { Server, Socket } from 'socket.io';
import { rollPool } from '@wraith/shared';
import { activeSessions, socketRegistry, isStoryteller } from './index.js';
import { ClientEvents, ServerEvents } from '@wraith/shared';
import type {
  StartCombatPayload,
  RollInitiativePayload,
  AdvanceTurnPayload,
  EndCombatPayload,
  CombatState,
  InitiativeEntry,
} from '@wraith/shared';

export function registerCombatHandlers(io: Server, socket: Socket): void {
  // ─── START COMBAT ──────────────────────────────────────────

  socket.on(ClientEvents.START_COMBAT, (payload: StartCombatPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    if (!isStoryteller(socket.id, session)) {
      socket.emit(ServerEvents.ERROR, {
        message: 'Only the Storyteller can start combat',
      });
      return;
    }

    const combat: CombatState = {
      round: 1,
      initiativeOrder: [],
      currentTurn: 0,
      isActive: true,
    };

    session.combat = combat;

    io.to(payload.sessionId).emit(ServerEvents.COMBAT_STARTED, combat);
    console.log(`Combat started in session ${payload.sessionId}`);
  });

  // ─── ROLL INITIATIVE ───────────────────────────────────────

  socket.on(
    ClientEvents.ROLL_INITIATIVE,
    (payload: RollInitiativePayload) => {
      const session = activeSessions.get(payload.sessionId);
      if (!session?.combat) return;

      // Roll on server: Dex + Wits, difficulty 4 (Wraith standard initiative)
      const poolSize = payload.dexterity + payload.wits;
      const roll = rollPool(poolSize, 4);

      // Find character name from players
      const player = session.players.find(
        (p) => p.characterId === payload.characterId,
      );

      const entry: InitiativeEntry = {
        characterId: payload.characterId,
        characterName: player?.displayName ?? 'Unknown',
        roll,
        initiative: roll.successes,
        hasActed: false,
      };

      // Check if already rolled (replace)
      const existingIdx = session.combat.initiativeOrder.findIndex(
        (e) => e.characterId === payload.characterId,
      );
      if (existingIdx >= 0) {
        session.combat.initiativeOrder[existingIdx] = entry;
      } else {
        session.combat.initiativeOrder.push(entry);
      }

      // Broadcast the individual roll
      io.to(payload.sessionId).emit(
        ServerEvents.INITIATIVE_ROLLED,
        entry,
      );

      // Sort by initiative (descending) and broadcast order
      session.combat.initiativeOrder.sort(
        (a, b) => b.initiative - a.initiative,
      );
      io.to(payload.sessionId).emit(ServerEvents.INITIATIVE_ORDER_SET, {
        order: session.combat.initiativeOrder,
      });
    },
  );

  // ─── ADVANCE TURN ──────────────────────────────────────────

  socket.on(ClientEvents.ADVANCE_TURN, (payload: AdvanceTurnPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session?.combat) return;

    const combat = session.combat;
    const order = combat.initiativeOrder;

    if (order.length === 0) return;

    // Mark current as acted
    if (order[combat.currentTurn]) {
      order[combat.currentTurn].hasActed = true;
    }

    // Advance to next
    combat.currentTurn++;

    // If all have acted, start new round
    if (combat.currentTurn >= order.length) {
      combat.round++;
      combat.currentTurn = 0;
      for (const entry of order) {
        entry.hasActed = false;
      }
    }

    io.to(payload.sessionId).emit(ServerEvents.TURN_ADVANCED, combat);
  });

  // ─── END COMBAT ────────────────────────────────────────────

  socket.on(ClientEvents.END_COMBAT, (payload: EndCombatPayload) => {
    const session = activeSessions.get(payload.sessionId);
    if (!session) return;

    if (!isStoryteller(socket.id, session)) {
      socket.emit(ServerEvents.ERROR, {
        message: 'Only the Storyteller can end combat',
      });
      return;
    }

    session.combat = null;
    io.to(payload.sessionId).emit(ServerEvents.COMBAT_ENDED);
    console.log(`Combat ended in session ${payload.sessionId}`);
  });
}
