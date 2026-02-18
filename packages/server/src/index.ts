import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { setupSocketHandlers } from './socket/index.js';

const PORT = process.env.PORT ?? 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: CORS_ORIGIN ? { origin: CORS_ORIGIN } : undefined,
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Wraith server running on port ${PORT}`);
});
