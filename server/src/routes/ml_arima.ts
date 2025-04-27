import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

// POST /api/ml/arima
router.post('/arima', async (req, res) => {
  const { history, periods, order } = req.body;
  try {
    const resp = await fetch('http://localhost:5011/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, periods, order })
    });
    const forecast = await resp.json();
    res.json({ forecast });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
