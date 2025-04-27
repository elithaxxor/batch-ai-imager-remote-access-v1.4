import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const BASE_URL = 'https://www.tradingview.com/api';

// GET /api/tradingview/market-data?symbol=BTCUSD
router.get('/market-data', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol' });
  try {
    const resp = await fetch(`${BASE_URL}/market-data?symbol=${encodeURIComponent(symbol as string)}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/tradingview/charts
router.post('/charts', async (req, res) => {
  const { type, timeframe, data } = req.body;
  try {
    const resp = await fetch(`${BASE_URL}/charts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, timeframe, data })
    });
    const chartData = await resp.json();
    res.json(chartData);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/tradingview/strategies
router.post('/strategies', async (req, res) => {
  const { name, rules } = req.body;
  try {
    const resp = await fetch(`${BASE_URL}/strategies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rules })
    });
    const stratData = await resp.json();
    res.json(stratData);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
