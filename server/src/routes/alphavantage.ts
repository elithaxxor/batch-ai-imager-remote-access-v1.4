import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const API_KEY = process.env.ALPHAVANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// GET /api/alphavantage?function=TIME_SERIES_DAILY&symbol=IBM
router.get('/', async (req, res) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  params.set('apikey', API_KEY || '');
  try {
    const resp = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
