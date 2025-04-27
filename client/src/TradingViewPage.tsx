import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@mui/material';
import axios from 'axios';

export default function TradingViewPage() {
  const [symbol, setSymbol] = useState('BTCUSD');
  const [marketData, setMarketData] = useState<any>(null);
  const [chartType, setChartType] = useState('candlestick');
  const [timeframe, setTimeframe] = useState('1 day');
  const [chartData, setChartData] = useState<any>(null);
  const [strategyName, setStrategyName] = useState('Moving Average Crossover');
  const [strategyRules, setStrategyRules] = useState({ buy: '', sell: '' });
  const [strategyResult, setStrategyResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchMarketData() {
    setLoading(true);
    setMarketData(null);
    try {
      const resp = await axios.get(`/api/tradingview/market-data?symbol=${symbol}`);
      setMarketData(resp.data);
    } finally {
      setLoading(false);
    }
  }

  async function createChart() {
    setLoading(true);
    setChartData(null);
    try {
      const resp = await axios.post('/api/tradingview/charts', {
        type: chartType,
        timeframe,
        data: marketData?.history || [],
      });
      setChartData(resp.data);
    } finally {
      setLoading(false);
    }
  }

  async function submitStrategy() {
    setLoading(true);
    setStrategyResult(null);
    try {
      const resp = await axios.post('/api/tradingview/strategies', {
        name: strategyName,
        rules: strategyRules,
      });
      setStrategyResult(resp.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>TradingView Integration</h2>
      <Card style={{ margin: '2rem 0' }}>
        <CardHeader title="Market Data Lookup" />
        <CardContent>
          <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol (e.g., BTCUSD)" />
          <button className="btn btn-primary" onClick={fetchMarketData} disabled={loading}>Fetch Market Data</button>
          {marketData && (
            <pre style={{ background: '#eef', padding: 8, borderRadius: 4, marginTop: 12 }}>{JSON.stringify(marketData, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
      <Card style={{ margin: '2rem 0' }}>
        <CardHeader title="Create Chart" />
        <CardContent>
          <select value={chartType} onChange={e => setChartType(e.target.value)}>
            <option value="candlestick">Candlestick</option>
            <option value="line">Line</option>
            <option value="bar">Bar</option>
          </select>
          <input value={timeframe} onChange={e => setTimeframe(e.target.value)} placeholder="Timeframe (e.g., 1 day)" />
          <button className="btn btn-secondary" onClick={createChart} disabled={loading || !marketData}>Create Chart</button>
          {chartData && (
            <pre style={{ background: '#eef', padding: 8, borderRadius: 4, marginTop: 12 }}>{JSON.stringify(chartData, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
      <Card style={{ margin: '2rem 0' }}>
        <CardHeader title="Build Trading Strategy" />
        <CardContent>
          <input value={strategyName} onChange={e => setStrategyName(e.target.value)} placeholder="Strategy Name" />
          <input value={strategyRules.buy} onChange={e => setStrategyRules(r => ({ ...r, buy: e.target.value }))} placeholder="Buy Rule (e.g., SMA(50) crosses above SMA(200))" />
          <input value={strategyRules.sell} onChange={e => setStrategyRules(r => ({ ...r, sell: e.target.value }))} placeholder="Sell Rule (e.g., SMA(50) crosses below SMA(200))" />
          <button className="btn btn-secondary" onClick={submitStrategy} disabled={loading}>Submit Strategy</button>
          {strategyResult && (
            <pre style={{ background: '#eef', padding: 8, borderRadius: 4, marginTop: 12 }}>{JSON.stringify(strategyResult, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
