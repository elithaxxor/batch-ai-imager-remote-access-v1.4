import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();
const API_KEY = process.env.COINGECKO_API_KEY;
const BASE_URL = 'https://api.coingecko.com/api/v3';

// GET /api/coingecko/simple/price?ids=bitcoin,ethereum&vs_currencies=usd
router.get('/simple/price', async (req, res) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  try {
    const resp = await fetch(`${BASE_URL}/simple/price?${params.toString()}`, {
      headers: API_KEY ? { 'x-cg-pro-api-key': API_KEY } : undefined
    });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Proxy any other GET requests to CoinGecko
router.get('/*', async (req, res) => {
  const path = req.path;
  const params = new URLSearchParams(req.query as Record<string, string>);
  try {
    const resp = await fetch(`${BASE_URL}${path}?${params.toString()}`, {
      headers: API_KEY ? { 'x-cg-pro-api-key': API_KEY } : undefined
    });
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
