import { Router, Request, Response } from 'express';
import os from 'os';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response): void => {
  res.json({ 
    status: 'healthy', 
    protocol: req.protocol,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Diagnostic endpoint for debugging connection issues
router.get('/diagnostic', (req: Request, res: Response): void => {
  const diagnostic = {
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      cpus: os.cpus().length,
      nodeVersion: process.version,
      env: process.env.NODE_ENV
    },
    request: {
      ip: req.ip,
      protocol: req.protocol,
      secure: req.secure,
      method: req.method,
      path: req.path,
      headers: req.headers,
      query: req.query
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(diagnostic);
});

// Documentation endpoint
router.get('/docs', (_req: Request, res: Response): void => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'WSB Trading API',
      version: '1.0.0',
      description: 'Secure API for WSB Trading platform'
    },
    security: [
      { apiKey: [] }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header'
        }
      }
    }
  });
});

export default router;
