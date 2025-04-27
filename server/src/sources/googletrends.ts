// Google Trends fetcher (demo/mock)
import fetch from 'node-fetch';

export async function fetchGoogleTrends(symbol: string): Promise<{score: number}> {
  // TODO: Integrate Google Trends API or third-party aggregator
  // For demo, simulate with random data
  return {
    score: Math.floor(Math.random() * 100),
  };
}
