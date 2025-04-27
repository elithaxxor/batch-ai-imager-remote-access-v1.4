import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

// POST /api/ml/prophet
router.post('/prophet', async (req, res) => {
  const { history, periods } = req.body;
  try {
    const resp = await fetch('http://localhost:5010/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, periods })
    });
    const forecast = await resp.json();
    res.json({ forecast });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
