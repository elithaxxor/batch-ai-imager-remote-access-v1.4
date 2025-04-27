import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Helper to fetch and parse from all sources
async function fetchLunarCrush() {
  const res = await fetch('https://api.lunarcrush.com/v2?data=assets&key=demo');
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map((c: any) => ({
    name: c.name,
    symbol: c.symbol,
    sentiment: c.galaxy_score ? (c.galaxy_score - 50) / 50 : 0,
    mentions: c.social_volume,
    source: 'LunarCrush',
  }));
}

async function fetchCryptoPanic() {
  const res = await fetch('https://cryptopanic.com/api/v1/posts/?auth_token=demo&currencies=BTC,ETH,DOGE');
  if (!res.ok) return [];
  const data = await res.json();
  const posts = data.results || [];
  const coinMap: Record<string, { sentiment: number; mentions: number }> = {
    BTC: { sentiment: 0, mentions: 0 },
    ETH: { sentiment: 0, mentions: 0 },
    DOGE: { sentiment: 0, mentions: 0 },
  };
  posts.forEach((post: any) => {
    const tags = post.currencies || [];
    tags.forEach((c: any) => {
      if (coinMap[c.code]) {
        coinMap[c.code].mentions++;
        if (post.positive_votes > post.negative_votes) coinMap[c.code].sentiment++;
        else if (post.negative_votes > post.positive_votes) coinMap[c.code].sentiment--;
      }
    });
  });
  return Object.entries(coinMap).map(([symbol, { sentiment, mentions }]) => ({
    name: symbol,
    symbol,
    sentiment: mentions ? sentiment / mentions : 0,
    mentions,
    source: 'CryptoPanic',
  }));
}

async function fetchReddit() {
  const res = await fetch('https://www.reddit.com/r/CryptoCurrency/top.json?limit=25');
  if (!res.ok) return [];
  const data = await res.json();
  const posts = data.data?.children || [];
  const coins: any[] = [];
  posts.forEach((post: any) => {
    const title = post.data.title as string;
    ['BTC', 'ETH', 'DOGE'].forEach(symbol => {
      if (title.toUpperCase().includes(symbol)) {
        coins.push({
          name: symbol,
          symbol,
          sentiment: post.data.ups > post.data.downs ? 1 : post.data.ups < post.data.downs ? -1 : 0,
          mentions: 1,
          source: 'Reddit',
        });
      }
    });
  });
  // Aggregate by symbol
  const agg: Record<string, any> = {};
  coins.forEach(c => {
    if (!agg[c.symbol]) agg[c.symbol] = { ...c };
    else {
      agg[c.symbol].sentiment += c.sentiment;
      agg[c.symbol].mentions += 1;
    }
  });
  return Object.values(agg).map((c: any) => ({ ...c, sentiment: c.mentions ? c.sentiment / c.mentions : 0 }));
}

// GET /api/sentiment?source=all|LunarCrush|CryptoPanic|Reddit
router.get('/', async (req: Request, res: Response) => {
  const { source = 'all' } = req.query;
  try {
    let results: any[] = [];
    if (source === 'all') {
      // Fetch all and aggregate by symbol
      const [lunar, panic, reddit] = await Promise.all([
        fetchLunarCrush(),
        fetchCryptoPanic(),
        fetchReddit(),
      ]);
      const all = [...lunar, ...panic, ...reddit];
      // Aggregate by symbol
      const agg: Record<string, any> = {};
      all.forEach(c => {
        const key = c.symbol;
        if (!agg[key]) agg[key] = { ...c, sentiment: 0, mentions: 0, sources: [] };
        agg[key].sentiment += c.sentiment;
        agg[key].mentions += c.mentions;
        agg[key].sources.push(c.source);
      });
      results = Object.values(agg).map((c: any) => ({
        ...c,
        sentiment: c.sources.length ? c.sentiment / c.sources.length : 0,
        sources: c.sources.join(', '),
      }));
    } else if (source === 'LunarCrush') {
      results = await fetchLunarCrush();
    } else if (source === 'CryptoPanic') {
      results = await fetchCryptoPanic();
    } else if (source === 'Reddit') {
      results = await fetchReddit();
    } else {
      return res.status(400).json({ error: 'Invalid source' });
    }
    res.json({ data: results });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch sentiment' });
  }
});

export default router;
