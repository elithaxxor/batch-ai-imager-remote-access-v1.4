import React, { useState, useEffect, useMemo, useRef } from 'react';

// Define a type for meme coin data
interface MemeCoin {
  name: string;
  symbol: string;
  price: number;
  rsi: number;
  sma20: number;
  sma50: number;
  ema20: number;
  ema50: number;
  macd: number;
  stoch: number;
  williamsr: number;
  adx: number;
  cci: number;
  obv: number;
  bbands_upper: number;
  bbands_middle: number;
  bbands_lower: number;
  volume: number;
}

const COINGECKO_API_KEY = process.env.REACT_APP_COINGECKO_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;

const COINGECKO_MEME_COINS_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=10&page=1&sparkline=false${COINGECKO_API_KEY ? `&x_cg_pro_api_key=${COINGECKO_API_KEY}` : ''}`;

async function fetchMemeCoins() {
  const res = await fetch(COINGECKO_MEME_COINS_URL);
  if (!res.ok) throw new Error('Failed to fetch meme coins');
  const data = await res.json();
  return data.map((coin: any) => ({
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price,
    volume: coin.total_volume,
    // Placeholder values for indicators, will be updated below
    rsi: 0,
    sma20: 0,
    sma50: 0,
    ema20: 0,
    ema50: 0,
    macd: 0,
    stoch: 0,
    williamsr: 0,
    adx: 0,
    cci: 0,
    obv: 0,
    bbands_upper: 0,
    bbands_middle: 0,
    bbands_lower: 0,
  }));
}

// Utility for caching
function getCachedIndicator(symbol: string, indicator: string): number | null {
  const key = `indicator_${symbol}_${indicator}`;
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const { value, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 15 * 60 * 1000) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedIndicator(symbol: string, indicator: string, value: number) {
  const key = `indicator_${symbol}_${indicator}`;
  localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
}

async function fetchAlphaVantageIndicator(symbol: string, indicator: string): Promise<any> {
  // Check cache first
  const cached = getCachedIndicator(symbol, indicator);
  if (cached !== null) return cached;
  // Alpha Vantage requires symbols like "DOGEUSD"
  const url = `https://www.alphavantage.co/query?function=${indicator}&symbol=${symbol}USD&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  try {
    let value: any = null;
    if (indicator === 'RSI') {
      const values = data['Technical Analysis: RSI'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['RSI']);
    } else if (indicator === 'SMA') {
      const values = data['Technical Analysis: SMA'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['SMA']);
    } else if (indicator === 'EMA') {
      const values = data['Technical Analysis: EMA'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['EMA']);
    } else if (indicator === 'MACD') {
      const values = data['Technical Analysis: MACD'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['MACD']);
    } else if (indicator === 'STOCH') {
      const values = data['Technical Analysis: STOCH'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['SlowK']);
    } else if (indicator === 'WILLR') {
      const values = data['Technical Analysis: WILLR'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['WILLR']);
    } else if (indicator === 'ADX') {
      const values = data['Technical Analysis: ADX'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['ADX']);
    } else if (indicator === 'CCI') {
      const values = data['Technical Analysis: CCI'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['CCI']);
    } else if (indicator === 'OBV') {
      const values = data['Technical Analysis: OBV'];
      const last = Object.values(values)[0] as any;
      value = parseFloat(last['OBV']);
    } else if (indicator === 'BBANDS') {
      const values = data['Technical Analysis: BBANDS'];
      const last = Object.values(values)[0] as any;
      value = {
        upper: parseFloat(last['Real Upper Band']),
        middle: parseFloat(last['Real Middle Band']),
        lower: parseFloat(last['Real Lower Band'])
      };
    }
    if (value !== null && !isNaN(value)) {
      setCachedIndicator(symbol, indicator, value);
      return value;
    }
    if (indicator === 'BBANDS' && value) {
      setCachedIndicator(symbol, indicator, value);
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

interface Column {
  key: keyof MemeCoin;
  label: string;
}

const columns: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'price', label: 'Price (USD)' },
  { key: 'rsi', label: 'RSI' },
  { key: 'sma20', label: 'SMA 20' },
  { key: 'sma50', label: 'SMA 50' },
  { key: 'ema20', label: 'EMA 20' },
  { key: 'ema50', label: 'EMA 50' },
  { key: 'macd', label: 'MACD' },
  { key: 'stoch', label: 'Stochastic' },
  { key: 'williamsr', label: "Williams %R" },
  { key: 'adx', label: 'ADX' },
  { key: 'cci', label: 'CCI' },
  { key: 'obv', label: 'OBV' },
  { key: 'bbands_upper', label: 'BBands Upper' },
  { key: 'bbands_middle', label: 'BBands Middle' },
  { key: 'bbands_lower', label: 'BBands Lower' },
  { key: 'volume', label: 'Volume' },
];

// TradingViewWidget component for embedding TradingView charts efficiently
interface TradingViewWidgetProps {
  symbol: string; // e.g. "BINANCE:DOGEUSDT"
  width?: number;
  height?: number;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol, width = 800, height = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remove previous widget if any
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    // Inject TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          width,
          height,
          symbol,
          interval: 'D',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current?.id || 'tradingview-widget',
        });
      }
    };
    containerRef.current?.appendChild(script);
    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, width, height]);

  return <div ref={containerRef} id={`tradingview-widget-${symbol.replace(/[^a-zA-Z0-9]/g, '')}`} style={{ width, height }} />;
};

const MemeCoinScreener: React.FC = () => {
  const [coins, setCoins] = useState<MemeCoin[]>([]);
  const [sortKey, setSortKey] = useState<keyof MemeCoin>('rsi');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [chartCoin, setChartCoin] = useState<MemeCoin | null>(null);
  const [liveFeed, setLiveFeed] = useState<string[]>([]);
  const [paprikaTrending, setPaprikaTrending] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const baseCoins = await fetchMemeCoins();
        for (let i = 0; i < Math.min(3, baseCoins.length); i++) {
          const c = baseCoins[i];
          const [rsi, sma20, sma50, ema20, ema50, macd, stoch, williamsr, adx, cci, obv, bbands] = await Promise.all([
            fetchAlphaVantageIndicator(c.symbol, 'RSI'),
            fetchAlphaVantageIndicator(c.symbol, 'SMA'),
            fetchAlphaVantageIndicator(c.symbol, 'SMA'),
            fetchAlphaVantageIndicator(c.symbol, 'EMA'),
            fetchAlphaVantageIndicator(c.symbol, 'EMA'),
            fetchAlphaVantageIndicator(c.symbol, 'MACD'),
            fetchAlphaVantageIndicator(c.symbol, 'STOCH'),
            fetchAlphaVantageIndicator(c.symbol, 'WILLR'),
            fetchAlphaVantageIndicator(c.symbol, 'ADX'),
            fetchAlphaVantageIndicator(c.symbol, 'CCI'),
            fetchAlphaVantageIndicator(c.symbol, 'OBV'),
            fetchAlphaVantageIndicator(c.symbol, 'BBANDS'),
          ]);
          c.rsi = rsi ?? 0;
          c.sma20 = sma20 ?? 0;
          c.sma50 = sma50 ?? 0;
          c.ema20 = ema20 ?? 0;
          c.ema50 = ema50 ?? 0;
          c.macd = macd ?? 0;
          c.stoch = stoch ?? 0;
          c.williamsr = williamsr ?? 0;
          c.adx = adx ?? 0;
          c.cci = cci ?? 0;
          c.obv = obv ?? 0;
          c.bbands_upper = bbands?.upper ?? 0;
          c.bbands_middle = bbands?.middle ?? 0;
          c.bbands_lower = bbands?.lower ?? 0;
        }
        setCoins(baseCoins);
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('https://api.coinpaprika.com/v1/tickers?limit=10');
        if (res.ok) {
          const data = await res.json();
          setPaprikaTrending(data.slice(0, 5));
        }
      } catch {}
    }
    fetchTrending();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/events');
        if (res.ok) {
          const data = await res.json();
          const events = data.data?.slice(0, 5).map((e: any) => `${e.title} (${e.category})`) || [];
          setLiveFeed(events);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredCoins = useMemo(() => {
    if (!search) return coins;
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }, [coins, search]);

  const handleSort = (key: keyof MemeCoin) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedCoins = useMemo(() => {
    return [...filteredCoins].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredCoins, sortKey, sortAsc]);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
      <h1 style={{ textAlign: 'center' }}>Meme Coin Screener</h1>
      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <h3 style={{ color: '#222', fontWeight: 600 }}>Trending on CoinPaprika:</h3>
        <ul>
          {paprikaTrending.length > 0 ? paprikaTrending.map((coin) => (
            <li key={coin.id}>
              {coin.name} ({coin.symbol}) — ${coin.quotes?.USD?.price?.toLocaleString(undefined, { maximumFractionDigits: 8 })}
            </li>
          )) : 'Loading...'}
        </ul>
      </div>
      <input
        className="input"
        style={{ width: '100%', marginBottom: 16 }}
        type="text"
        placeholder="Search by name or symbol..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading && <div style={{ textAlign: 'center', margin: '1rem' }}>Loading...</div>}
      {error && <div style={{ color: 'red', textAlign: 'center', margin: '1rem' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key as keyof MemeCoin)}
                style={{ cursor: 'pointer', padding: '0.5rem', borderBottom: '2px solid #eee', background: '#f9f9f9' }}
              >
                {col.label} {sortKey === col.key ? (sortAsc ? '▲' : '▼') : ''}
              </th>
            ))}
            <th>Chart</th>
          </tr>
        </thead>
        <tbody>
          {sortedCoins.map(coin => (
            <tr key={coin.symbol}>
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    padding: '0.5rem',
                    borderBottom: '1px solid #eee',
                    textAlign: 'center',
                    color:
                      col.key === 'rsi'
                        ? coin.rsi > 70
                          ? 'red'
                          : coin.rsi < 30
                          ? 'blue'
                          : undefined
                        : undefined,
                    fontWeight: col.key === 'rsi' && (coin.rsi > 70 || coin.rsi < 30) ? 'bold' : undefined,
                  }}
                >
                  {col.key === 'price' || col.key.startsWith('sma') || col.key === 'macd' || col.key === 'ema20' || col.key === 'ema50'
                    ? (coin as any)[col.key]?.toLocaleString(undefined, { maximumFractionDigits: 8 })
                    : col.key === 'volume'
                    ? coin[col.key].toLocaleString()
                    : coin[col.key]}
                </td>
              ))}
              <td>
                <button className="btn btn-secondary" onClick={() => setChartCoin(coin)}>
                  View Chart
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: '1rem', color: '#888', fontSize: '0.95rem' }}>
        Click column headers to sort. Technical indicators shown: RSI, SMA (20/50), EMA (20/50), MACD, Stochastic, Williams %R, ADX, CCI, OBV, Bollinger Bands, Volume.<br/>
        RSI: <span style={{ color: 'blue', fontWeight: 'bold' }}>blue</span> = oversold, <span style={{ color: 'red', fontWeight: 'bold' }}>red</span> = overbought.<br/>
        Real data is fetched for the top 3 coins (API rate limits apply).
      </p>
      {chartCoin && (
        <div style={{ marginTop: 32, background: '#f9f9f9', borderRadius: 8, padding: 24 }}>
          <h2>TradingView Chart: {chartCoin.name} ({chartCoin.symbol})</h2>
          <TradingViewWidget symbol={`BINANCE:${chartCoin.symbol}USDT`} width={800} height={400} />
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setChartCoin(null)}>
            Close Chart
          </button>
        </div>
      )}
      {/* Live Feed Ticker */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#222', color: '#fff', padding: 8, fontSize: 16, zIndex: 100, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', animation: 'scroll-left 30s linear infinite' }}>
          {liveFeed.length > 0 ? liveFeed.join('   |   ') : 'Loading news & events...'}
        </div>
        <style>{`
          @keyframes scroll-left {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MemeCoinScreener;
