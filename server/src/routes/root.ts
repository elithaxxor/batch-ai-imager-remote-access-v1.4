import { Router, Request, Response } from 'express';

const router = Router();

// Root route
router.get('/', (req: Request, res: Response): void => {
  res.json({ 
    message: 'WSB Trading API Server',
    version: '1.0.0',
    protocol: req.protocol,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      api: '/api',
      docs: '/api/docs',
      health: '/api/health'
    }
  });
});

// 404 handler
router.use((_req: Request, res: Response): void => {
  res.status(404).json({ 
    error: 'Not Found',
    path: _req.path
  });
});

export default router;
