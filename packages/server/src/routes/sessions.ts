import { Router } from 'express';
import { db } from '../db/index.js';
import { sessions, chatLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/sessions — list all sessions
router.get('/', async (_req, res) => {
  try {
    const rows = await db.select().from(sessions);
    const result = rows.map((row) => ({
      id: row.id,
      name: row.name,
      campaignId: row.campaignId,
      mode: row.mode,
      state: row.state,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:id — get session by ID
router.get('/:id', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, req.params.id));

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const row = rows[0];
    const gameState = row.gameState ? JSON.parse(row.gameState) : null;
    res.json({
      id: row.id,
      name: row.name,
      campaignId: row.campaignId,
      mode: row.mode,
      state: row.state,
      gameState,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/sessions — create a new session
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    await db.insert(sessions).values({
      id,
      campaignId: data.campaignId || null,
      name: data.name || 'New Session',
      mode: data.mode || 'multiplayer',
      state: data.state || 'lobby',
      gameState: data.gameState ? JSON.stringify(data.gameState) : null,
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({ id, ...data });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /api/sessions/:id — update session
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await db
      .update(sessions)
      .set({
        name: data.name || existing[0].name,
        state: data.state || existing[0].state,
        gameState: data.gameState
          ? JSON.stringify(data.gameState)
          : existing[0].gameState,
        updatedAt: now,
      })
      .where(eq(sessions.id, req.params.id));

    res.json({ id: req.params.id, ...data });
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /api/sessions/:id — delete session
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete associated chat logs first
    await db.delete(chatLogs).where(eq(chatLogs.sessionId, req.params.id));
    await db.delete(sessions).where(eq(sessions.id, req.params.id));

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// GET /api/sessions/:id/chat — get chat log for session
router.get('/:id/chat', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(chatLogs)
      .where(eq(chatLogs.sessionId, req.params.id))
      .orderBy(chatLogs.timestamp);

    const messages = rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      senderId: row.senderId,
      senderName: row.senderName,
      type: row.type,
      content: row.content,
      timestamp: row.timestamp,
      diceRoll: row.diceData ? JSON.parse(row.diceData) : undefined,
    }));

    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat log:', err);
    res.status(500).json({ error: 'Failed to fetch chat log' });
  }
});

export default router;
