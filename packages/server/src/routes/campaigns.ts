import { Router } from 'express';
import { db } from '../db/index.js';
import { campaigns, campaignCharacters } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Generate a 6-char alphanumeric invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET /api/campaigns — list all campaigns (optionally filtered by user)
router.get('/', async (req, res) => {
  try {
    let rows;
    if (req.user) {
      // Authenticated: return campaigns where user is storyteller
      rows = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.storytellerId, req.user.userId));
    } else {
      rows = await db.select().from(campaigns);
    }
    res.json(rows);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/:id — get campaign with character IDs
router.get('/:id', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, req.params.id));

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get associated character IDs
    const charRows = await db
      .select()
      .from(campaignCharacters)
      .where(eq(campaignCharacters.campaignId, req.params.id));

    const characterIds = charRows.map((r) => r.characterId);

    res.json({ ...rows[0], characterIds });
  } catch (err) {
    console.error('Error fetching campaign:', err);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns — create campaign
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    // If authenticated, set storyteller to logged-in user
    const storytellerId = req.user?.userId ?? data.storytellerId ?? null;

    await db.insert(campaigns).values({
      id,
      name: data.name || 'New Campaign',
      storytellerId,
      description: data.description || '',
      inviteCode: null,
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({ id, name: data.name, storytellerId, description: data.description || '' });
  } catch (err) {
    console.error('Error creating campaign:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /api/campaigns/:id — update campaign
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // If authenticated, verify storyteller ownership
    if (req.user && existing[0].storytellerId && existing[0].storytellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the storyteller can edit this campaign' });
    }

    await db
      .update(campaigns)
      .set({
        name: data.name || existing[0].name,
        description:
          data.description !== undefined
            ? data.description
            : existing[0].description,
        updatedAt: now,
      })
      .where(eq(campaigns.id, req.params.id));

    res.json({ id: req.params.id, ...data });
  } catch (err) {
    console.error('Error updating campaign:', err);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id — delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // If authenticated, verify storyteller ownership
    if (req.user && existing[0].storytellerId && existing[0].storytellerId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the storyteller can delete this campaign' });
    }

    // Delete junction table entries first
    await db
      .delete(campaignCharacters)
      .where(eq(campaignCharacters.campaignId, req.params.id));
    await db.delete(campaigns).where(eq(campaigns.id, req.params.id));

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// POST /api/campaigns/:id/invite — generate invite code (ST only)
router.post('/:id/invite', requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, req.params.id));

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (rows[0].storytellerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Only the storyteller can generate invite codes' });
    }

    const inviteCode = generateInviteCode();
    await db
      .update(campaigns)
      .set({ inviteCode, updatedAt: new Date().toISOString() })
      .where(eq(campaigns.id, req.params.id));

    res.json({ inviteCode });
  } catch (err) {
    console.error('Error generating invite code:', err);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// POST /api/campaigns/join/:inviteCode — join campaign via invite code
router.post('/join/:inviteCode', requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.inviteCode, req.params.inviteCode));

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const campaign = rows[0];

    // Check if already a member (has a character in campaign)
    // For now, just return the campaign — character assignment is separate
    res.json({
      campaignId: campaign.id,
      name: campaign.name,
      description: campaign.description,
      message: 'Successfully joined campaign',
    });
  } catch (err) {
    console.error('Error joining campaign:', err);
    res.status(500).json({ error: 'Failed to join campaign' });
  }
});

// POST /api/campaigns/:id/characters/:charId — add character to campaign
router.post('/:id/characters/:charId', async (req, res) => {
  try {
    await db.insert(campaignCharacters).values({
      campaignId: req.params.id,
      characterId: req.params.charId,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error adding character to campaign:', err);
    res.status(500).json({ error: 'Failed to add character to campaign' });
  }
});

// DELETE /api/campaigns/:id/characters/:charId — remove character from campaign
router.delete('/:id/characters/:charId', async (req, res) => {
  try {
    await db
      .delete(campaignCharacters)
      .where(
        and(
          eq(campaignCharacters.campaignId, req.params.id),
          eq(campaignCharacters.characterId, req.params.charId),
        ),
      );
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing character from campaign:', err);
    res
      .status(500)
      .json({ error: 'Failed to remove character from campaign' });
  }
});

export default router;
