import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/characters.js';
import sessionRoutes from './routes/sessions.js';
import campaignRoutes from './routes/campaigns.js';
import { optionalAuth } from './middleware/auth.js';

export const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(compression());
app.use(express.json());

// CORS: only needed in dev when client runs on a separate port.
// In production, client is served from the same origin — no CORS needed.
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (CORS_ORIGIN) {
  app.use(cors({ origin: CORS_ORIGIN }));
}

// ─── API Routes ───────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'wraith-server' });
});

// Auth routes (before optionalAuth — register/login don't need auth)
app.use('/api/auth', authRoutes);

// Apply optional auth to all subsequent /api routes
app.use('/api', optionalAuth);

// Routes
app.use('/api/characters', characterRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/campaigns', campaignRoutes);

// ─── Static Files & SPA Fallback ──────────────────────────────
// Serve the built React client in production
const clientDistPath = process.env.CLIENT_DIST_PATH
  || path.join(process.cwd(), 'packages', 'client', 'dist');

app.use(express.static(clientDistPath));

// SPA fallback: any non-API GET request returns index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});
