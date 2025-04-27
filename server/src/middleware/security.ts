import { Request, Response, NextFunction, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit, { Options } from 'express-rate-limit';
import hpp from 'hpp';

// Define types for our middleware functions
type SecurityMiddleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Configure security middleware for Express application
 */
export const configureSecurityMiddleware = (app: Application): void => {
  // Basic security headers with Helmet, but allow inline scripts for development
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          fontSrc: ["'self'"]
        }
      }
    })
  );

  // Set permissive CORS policy for development
  app.use(cors({
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  // Rate limiting configuration
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Apply rate limiting to API routes
  app.use('/api', limiter);

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Force HTTPS in production
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });

  // Add security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Feature-Policy', "camera 'none'; microphone 'none'");
    next();
  });

  // Prevent clickjacking
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
};

/**
 * Middleware to verify API keys
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): Response | void => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid API key' 
    });
  }
  
  next();
};

/**
 * Middleware to sanitize request data
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Remove any potential XSS content from request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '') // Remove < and >
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .trim();
      }
    });
  }
  
  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): Response | void => {
  console.error(err.stack);
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error'
      : err.message
  });
};
