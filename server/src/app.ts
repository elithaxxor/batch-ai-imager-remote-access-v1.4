import express, { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';
import compression from 'compression';
import winston from 'winston';
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

dotenv.config();

const app = express();

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

app.set('trust proxy', 1);
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
configureSecurityMiddleware(app);
app.use(sanitizeRequest);

// Serve static files from server directory (for testing)
app.use(express.static(path.join(__dirname, '../'), {
  maxAge: '1h',
  fallthrough: true,
  redirect: false
}));
const clientPublicPath = path.join(__dirname, '../../client/public');
app.use(express.static(clientPublicPath, {
  maxAge: '1h',
  fallthrough: true,
  redirect: false
}));

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
app.use('/', rootRoutes);
app.use(errorHandler);

export default app;
