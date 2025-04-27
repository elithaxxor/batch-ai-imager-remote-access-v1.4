import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { fetchTwitterSentiment } from '../sources/twitter';
import { fetchStocktwitsSentiment } from '../sources/stocktwits';
import { fetchDiscordSentiment } from '../sources/discord';
import { fetchGoogleTrends } from '../sources/googletrends';
import { fetchOnChainActivity } from '../sources/onchain';

const router = Router();

// In-memory demo store (replace with DB for production)
const priceHistory: Record<string, { ts: number; price: number }[]> = {};
const sentimentHistory: Record<string, { ts: number; sentiment: number; volume: number; source: string }[]> = {};

// Helper to fetch latest price and sentiment (simulate for demo)
async function fetchDemoData() {
  // Example for BTC, ETH, DOGE
  const coins = ['BTC', 'ETH', 'DOGE'];
  for (const symbol of coins) {
    // Price
    const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`);
    const priceData = await priceRes.json();
    const price = priceData[symbol.toLowerCase()]?.usd || 0;
    if (!priceHistory[symbol]) priceHistory[symbol] = [];
    priceHistory[symbol].push({ ts: Date.now(), price });
    priceHistory[symbol] = priceHistory[symbol].slice(-100);
    // Sentiment (aggregate multiple sources)
    const sentRes = await fetch(`http://localhost:8000/api/sentiment?source=all`);
    const sentData = await sentRes.json();
    const coinSent = sentData.data.find((c: any) => c.symbol === symbol);
    // Twitter, StockTwits, Discord, Google Trends, On-chain
    const [twitter, stocktwits, discord, gtrends, onchain] = await Promise.all([
      fetchTwitterSentiment(symbol),
      fetchStocktwitsSentiment(symbol),
      fetchDiscordSentiment(symbol),
      fetchGoogleTrends(symbol),
      fetchOnChainActivity(symbol)
    ]);
    if (!sentimentHistory[symbol]) sentimentHistory[symbol] = [];
    sentimentHistory[symbol].push({
      ts: Date.now(),
      sentiment: coinSent?.sentiment || 0,
      volume: coinSent?.mentions || 0,
      source: 'aggregate',
    });
    sentimentHistory[symbol].push({
      ts: Date.now(),
      sentiment: twitter.sentiment,
      volume: twitter.mentions,
      source: 'Twitter',
    });
    sentimentHistory[symbol].push({
      ts: Date.now(),
      sentiment: stocktwits.sentiment,
      volume: stocktwits.mentions,
      source: 'StockTwits',
    });
    sentimentHistory[symbol].push({
      ts: Date.now(),
      sentiment: discord.sentiment,
      volume: discord.mentions,
      source: 'Discord',
    });
    // Google Trends and On-chain are not sentiment, but add to breakdown
    sentimentHistory[symbol].push({
      ts: Date.now(),
      sentiment: gtrends.score / 100, // normalize to -1..1 for demo
      volume: gtrends.score,
      source: 'GoogleTrends',
    });
    sentimentHistory[symbol].push({
      ts: Date.now(),
      sentiment: onchain.whaleTx / 10, // normalize for demo
      volume: onchain.dexVolume,
      source: 'OnChain',
    });
    sentimentHistory[symbol] = sentimentHistory[symbol].slice(-100);
  }
}

// Demo trending logic
function getTrending() {
  // Find coins with biggest sentiment gain over last 5 points
  return Object.keys(sentimentHistory).map(symbol => {
    const arr = sentimentHistory[symbol];
    if (!arr || arr.length < 6) return { symbol, name: symbol, score: 0 };
    const score = arr[arr.length - 1].sentiment - arr[arr.length - 6].sentiment;
    return { symbol, name: symbol, score };
  }).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 5);
}

// Source breakdown
function getSourceBreakdown() {
  const out: Record<string, Record<string, number>> = {};
  Object.keys(sentimentHistory).forEach(symbol => {
    out[symbol] = {
      LunarCrush: Math.random() * 2 - 1,
      CryptoPanic: Math.random() * 2 - 1,
      Reddit: Math.random() * 2 - 1,
      Twitter: Math.random() * 2 - 1,
      StockTwits: Math.random() * 2 - 1,
      Discord: Math.random() * 2 - 1,
      GoogleTrends: Math.random() * 2 - 1,
      OnChain: Math.random() * 2 - 1,
    };
  });
  return out;
}

// Leaderboard
function getLeaderboard() {
  return Object.keys(sentimentHistory).map(symbol => {
    const arr = sentimentHistory[symbol];
    const buzz = arr.reduce((a, b) => a + b.volume, 0);
    const sentiment = arr.length ? arr[arr.length - 1].sentiment : 0;
    return { symbol, name: symbol, buzz, sentiment };
  }).sort((a, b) => b.buzz - a.buzz).slice(0, 10);
}

router.get('/', async (_req: Request, res: Response) => {
  // Fetch and update demo data
  await fetchDemoData();
  res.json({
    priceHistory,
    sentimentHistory,
    trending: getTrending(),
    sourceBreakdown: getSourceBreakdown(),
    leaderboard: getLeaderboard(),
  });
});

export default router;
