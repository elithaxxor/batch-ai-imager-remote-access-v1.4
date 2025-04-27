import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@mui/material';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

export default function CoinGeckoChart() {
  const [id, setId] = useState('bitcoin');
  const [vs, setVs] = useState('usd');
  const [days, setDays] = useState('30');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    setData(null);
    try {
      const resp = await axios.get(`/api/coingecko/coins/${id}/market_chart?vs_currency=${vs}&days=${days}`);
      setData(resp.data);
    } finally {
      setLoading(false);
    }
  }

  let chartData = null;
  if (data && data.prices) {
    const labels = data.prices.map((p: any) => new Date(p[0]).toLocaleDateString());
    const prices = data.prices.map((p: any) => p[1]);
    chartData = {
      labels,
      datasets: [
        {
          label: `${id} price (${vs})`,
          data: prices,
          borderColor: '#43a047',
          backgroundColor: 'rgba(67, 160, 71, 0.1)',
        }
      ]
    };
  }

  return (
    <Card style={{ margin: '2rem 0' }}>
      <CardHeader title="CoinGecko: Price Chart" />
      <CardContent>
        <input value={id} onChange={e => setId(e.target.value)} placeholder="Coin ID (e.g., bitcoin)" />
        <input value={vs} onChange={e => setVs(e.target.value)} placeholder="VS Currency (e.g., usd)" />
        <input value={days} onChange={e => setDays(e.target.value)} placeholder="Days (e.g., 30)" />
        <button className="btn btn-primary" onClick={fetchData} disabled={loading}>Fetch Data</button>
        {chartData && (
          <div style={{ marginTop: 20 }}>
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
          </div>
        )}
        {data && !chartData && <div>No chartable data.</div>}
      </CardContent>
    </Card>
  );
}
