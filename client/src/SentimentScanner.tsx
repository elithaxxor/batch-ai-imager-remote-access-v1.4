import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface BackendSentimentCoin {
  name: string;
  symbol: string;
  sentiment: number;
  mentions: number;
  sources?: string;
  source?: string;
}

const sources = [
  { name: 'All (Aggregate)', value: 'all' },
  { name: 'LunarCrush', value: 'LunarCrush' },
  { name: 'CryptoPanic', value: 'CryptoPanic' },
  { name: 'Reddit', value: 'Reddit' },
];

const SentimentScanner: React.FC = () => {
  const [coins, setCoins] = useState<BackendSentimentCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState(sources[0].value);
  const [history, setHistory] = useState<{ [symbol: string]: { sentiment: number; ts: number }[] }>({});

  useEffect(() => {
    async function fetchSentiment() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sentiment?source=${source}`);
        if (!res.ok) throw new Error('Failed to fetch sentiment');
        const data = await res.json();
        setCoins(data.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load sentiment data');
      }
      setLoading(false);
    }
    fetchSentiment();
  }, [source]);

  useEffect(() => {
    if (!coins.length) return;
    setHistory(prev => {
      const now = Date.now();
      const next = { ...prev };
      coins.forEach(coin => {
        if (!next[coin.symbol]) next[coin.symbol] = [];
        next[coin.symbol] = [
          ...next[coin.symbol],
          { sentiment: coin.sentiment, ts: now }
        ].slice(-20); // keep last 20 points
      });
      return next;
    });
  }, [coins]);

  function sentimentBar(sentiment: number) {
    const width = Math.abs(sentiment) * 100;
    const color = sentiment > 0.2 ? 'green' : sentiment < -0.2 ? 'red' : 'gray';
    return (
      <div style={{ width: 120, height: 12, background: '#eee', borderRadius: 6, overflow: 'hidden', margin: '0 auto' }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    );
  }

  function renderSparkline(symbol: string) {
    const points = history[symbol] || [];
    if (points.length < 2) return null;
    const data = {
      labels: points.map(p => new Date(p.ts).toLocaleTimeString()),
      datasets: [
        {
          label: 'Sentiment',
          data: points.map(p => p.sentiment),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0,123,255,0.1)',
          fill: true,
          tension: 0.5,
          pointRadius: 0,
        },
      ],
    };
    const options = {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: -1, max: 1, display: false },
        x: { display: false },
      },
      elements: { line: { borderWidth: 2 } },
    };
    return <Line data={data} options={options} width={120} height={32} />;
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
      <h1 style={{ textAlign: 'center' }}>Crypto Sentiment Scanner</h1>
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Source:</label>
        <select value={source} onChange={e => setSource(e.target.value)}>
          {sources.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
        </select>
      </div>
      {loading && <div style={{ textAlign: 'center', margin: '1rem' }}>Loading...</div>}
      {error && <div style={{ color: 'red', textAlign: 'center', margin: '1rem' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Symbol</th>
            <th>Sentiment</th>
            <th>Trend</th>
            <th>Mentions</th>
            <th>Sources</th>
          </tr>
        </thead>
        <tbody>
          {coins.map(coin => (
            <tr key={coin.symbol + (coin.sources || coin.source)}>
              <td>{coin.name}</td>
              <td>{coin.symbol}</td>
              <td style={{ color: coin.sentiment > 0.2 ? 'green' : coin.sentiment < -0.2 ? 'red' : 'gray', fontWeight: 'bold' }}>
                {coin.sentiment > 0.2 ? 'Bullish' : coin.sentiment < -0.2 ? 'Bearish' : 'Neutral'} ({(coin.sentiment * 100).toFixed(1)}%)
                {sentimentBar(coin.sentiment)}
              </td>
              <td>{renderSparkline(coin.symbol)}</td>
              <td>{coin.mentions?.toLocaleString()}</td>
              <td>{coin.sources || coin.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.95rem' }}>
        Sentiment is derived from social media and news data. Data sources: LunarCrush, CryptoPanic, Reddit (demo keys, limited results). You can aggregate all or select a single source. Trends update live.
      </p>
    </div>
  );
};

export default SentimentScanner;
