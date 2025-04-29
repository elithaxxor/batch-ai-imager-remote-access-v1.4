import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { setupWebSocketServer } from './websocket';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

// Create and start server with proper error handling
const startServer = async () => {
  try {
    let server: http.Server;
    server = http.createServer(app);

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`⛔️ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error(`Server error: ${error.message}`);
        process.exit(1);
      }
    });

    // Start listening
    await new Promise<void>((resolve, reject) => {
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        resolve();
      });
      server.once('error', reject);
    });

    // Set up WebSocket server
    setupWebSocketServer(server);

    server.on('error', (error) => {
      console.error(`Server error: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`Failed to start server: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Start the server
startServer();
