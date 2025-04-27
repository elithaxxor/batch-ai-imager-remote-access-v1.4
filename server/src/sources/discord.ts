// Discord sentiment fetcher (demo/mock)
// Replace with real API integration if you have credentials
import fetch from 'node-fetch';

export async function fetchDiscordSentiment(symbol: string): Promise<{sentiment: number, mentions: number}> {
  // TODO: Integrate Discord API/bot or third-party aggregator
  // For demo, simulate with random data
  return {
    sentiment: Math.random() * 2 - 1, // -1 to 1
    mentions: Math.floor(Math.random() * 300 + 20),
  };
}
