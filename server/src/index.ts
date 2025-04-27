import express, { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';
import compression from 'compression';
import winston from 'winston';
import { setupWebSocketServer } from './websocket';
import { 
  configureSecurityMiddleware, 
  errorHandler, 
  sanitizeRequest 
} from './middleware/security';
import apiRoutes from './routes/api';
import rootRoutes from './routes/root';
import sentimentRoutes from './routes/sentiment';
import analyticsRoutes from './routes/analytics';
import alertsRouter from './routes/alerts';
import notifyRouter from './routes/notify';
import mlRouter from './routes/ml';
import mlArimaRouter from './routes/ml_arima';
import mlLstmRouter from './routes/ml_lstm';
import tradingviewRouter from './routes/tradingview';
import alphavantageRouter from './routes/alphavantage';
import coingeckoRouter from './routes/coingecko';
import priceAlertsRouter from './routes/price_alerts';
import alertHistoryRouter from './routes/alert_history';

// Load environment variables
dotenv.config();

const app = express();
// Use port from environment variable or fallback to 8000
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Trust proxy - required for rate limiter behind reverse proxy
app.set('trust proxy', 1);

// Logging middleware using morgan, integrated with winston
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Compression middleware for static files and responses
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply security middleware
configureSecurityMiddleware(app);

// Apply request sanitization
app.use(sanitizeRequest);

// Memory usage monitoring
const checkMemoryUsage = () => {
  const used = process.memoryUsage();
  const memoryUsagePercent = (used.heapUsed / used.heapTotal) * 100;
  
  if (memoryUsagePercent > 85) {
    logger.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
    // TODO: Add alerting mechanism if needed
  }
  
  return memoryUsagePercent;
};

// Monitor memory usage every 30 seconds
setInterval(checkMemoryUsage, 30000);

// Serve static files from server directory (for testing)
app.use(express.static(path.join(__dirname, '../'), {
  maxAge: '1h',
  fallthrough: true,
  redirect: false
}));

// Serve static files from React app's public directory
const clientPublicPath = path.join(__dirname, '../../client/public');
app.use(express.static(clientPublicPath, {
  maxAge: '1h',
  fallthrough: true,
  redirect: false
}));

// Mount API routes
app.use('/api', apiRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertsRouter);
app.use('/api/notify', notifyRouter);
app.use('/api/ml', mlRouter);
app.use('/api/ml', mlArimaRouter);
app.use('/api/ml', mlLstmRouter);
app.use('/api/tradingview', tradingviewRouter);
app.use('/api/alphavantage', alphavantageRouter);
app.use('/api/coingecko', coingeckoRouter);
app.use('/api/price-alerts', priceAlertsRouter);
app.use('/api/alert-history', alertHistoryRouter);

// Mount root routes
app.use('/', rootRoutes);

// Global error handler
app.use(errorHandler);

// Create and start server with proper error handling
const startServer = async () => {
  try {
    let server: http.Server | https.Server;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use real SSL certificates
      const privateKey = fs.readFileSync(path.join(__dirname, '../ssl/server.key'), 'utf8');
      const certificate = fs.readFileSync(path.join(__dirname, '../ssl/server.cert'), 'utf8');
      const credentials = { key: privateKey, cert: certificate };

      // Create HTTPS server
      server = https.createServer(credentials, app);
    } else {
      // In development, use HTTP
      server = http.createServer(app);
    }

    // Proper error handling for server
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`⛔️ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        logger.error(`Server error: ${error.message}`);
        process.exit(1);
      }
    });

    // Graceful shutdown handling
    const shutdown = () => {
      logger.info('🛑 Shutting down gracefully...');
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });

      // Force shutdown after 10s if server hasn't closed
      setTimeout(() => {
        logger.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Start listening
    await new Promise<void>((resolve, reject) => {
      server.listen(PORT, '0.0.0.0', () => {
        logger.info(`🚀 Server running on ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://localhost:${PORT}`);
        resolve();
      });

      server.once('error', reject);
    });

    // Initial memory check
    const initialMemoryUsage = checkMemoryUsage();
    logger.info(`📊 Initial memory usage: ${initialMemoryUsage.toFixed(2)}%`);

    // Set up WebSocket server
    setupWebSocketServer(server);
    
    // Handle server errors
    server.on('error', (error) => {
      logger.error(`Server error: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Start the server
startServer();
