import { Router } from 'express';
import { db } from '../db/index.js';
import { characters } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/characters — list characters (filtered to user if authenticated)
router.get('/', async (req, res) => {
  try {
    let rows;
    if (req.user) {
      // Authenticated: return only this user's characters
      rows = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, req.user.userId));
    } else {
      // Anonymous: return all (backward compat)
      rows = await db.select().from(characters);
    }
    const result = rows.map((row) => ({
      ...JSON.parse(row.data),
      id: row.id,
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching characters:', err);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// GET /api/characters/:id — get single character
router.get('/:id', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(characters)
      .where(eq(characters.id, req.params.id));

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const character = JSON.parse(rows[0].data);
    res.json({ ...character, id: rows[0].id });
  } catch (err) {
    console.error('Error fetching character:', err);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// POST /api/characters — create new character
router.post('/', async (req, res) => {
  try {
    const characterData = req.body;
    const id = characterData.id || uuidv4();
    const now = new Date().toISOString();

    // If authenticated, always set userId to the logged-in user
    const userId = req.user?.userId ?? characterData.userId ?? null;

    await db.insert(characters).values({
      id,
      userId,
      name: characterData.name || 'Unnamed',
      player: characterData.player || 'Unknown',
      concept: characterData.concept || '',
      data: JSON.stringify({ ...characterData, id, userId }),
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({ id, ...characterData, userId });
  } catch (err) {
    console.error('Error creating character:', err);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

// PUT /api/characters/:id — update character
router.put('/:id', async (req, res) => {
  try {
    const characterData = req.body;
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(characters)
      .where(eq(characters.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // If authenticated, verify ownership
    if (req.user && existing[0].userId && existing[0].userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this character' });
    }

    await db
      .update(characters)
      .set({
        name: characterData.name || existing[0].name,
        player: characterData.player || existing[0].player,
        concept: characterData.concept || existing[0].concept,
        data: JSON.stringify({ ...characterData, id: req.params.id }),
        updatedAt: now,
      })
      .where(eq(characters.id, req.params.id));

    res.json({ id: req.params.id, ...characterData });
  } catch (err) {
    console.error('Error updating character:', err);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// DELETE /api/characters/:id — delete character
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db
      .select()
      .from(characters)
      .where(eq(characters.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // If authenticated, verify ownership
    if (req.user && existing[0].userId && existing[0].userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this character' });
    }

    await db.delete(characters).where(eq(characters.id, req.params.id));
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Error deleting character:', err);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

export default router;
