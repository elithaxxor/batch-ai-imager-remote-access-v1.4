// On-chain analytics fetcher (demo/mock)
import fetch from 'node-fetch';

export async function fetchOnChainActivity(symbol: string): Promise<{whaleTx: number, dexVolume: number}> {
  // TODO: Integrate Etherscan, Dune Analytics, or other APIs
  // For demo, simulate with random data
  return {
    whaleTx: Math.floor(Math.random() * 20),
    dexVolume: Math.floor(Math.random() * 1000000),
  };
}
