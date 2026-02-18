import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { signToken, requireAuth } from '../middleware/auth.js';
import type { AuthUser } from '@wraith/shared';

const router = Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    // Validation
    if (!username || username.length < 3) {
      return res.status(400).json({
        error: 'Username must be at least 3 characters',
        field: 'username',
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
        field: 'password',
      });
    }
    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({
        error: 'Display name is required',
        field: 'displayName',
      });
    }

    // Check uniqueness
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()));

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Username already taken',
        field: 'username',
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await db.insert(users).values({
      id,
      username: username.toLowerCase(),
      displayName: displayName.trim(),
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const token = signToken({
      userId: id,
      username: username.toLowerCase(),
    });

    const user: AuthUser = {
      id,
      username: username.toLowerCase(),
      displayName: displayName.trim(),
      createdAt: now,
    };

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()));

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res
        .status(401)
        .json({ error: 'Invalid username or password' });
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
    });

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };

    res.json({ user: authUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — validate token and return current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.userId));

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };

    res.json(authUser);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
