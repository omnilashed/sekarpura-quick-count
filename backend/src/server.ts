import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { env } from './config/env.js';

const startServer = async () => {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(` SEKARPURA ELECTION CENTER - BACKEND SERVER`);
    console.log(` Mode: ${env.NODE_ENV}`);
    console.log(` URL : http://localhost:${env.PORT}`);
    console.log(` WS  : ws://localhost:${env.PORT}`);
    console.log(`====================================================`);
  });
};

startServer().catch((err) => {
  console.error('[Server] Fatal bootstrap error:', err);
  process.exit(1);
});
