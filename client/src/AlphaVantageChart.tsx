import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@mui/material';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

export default function AlphaVantageChart() {
  const [symbol, setSymbol] = useState('IBM');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    setData(null);
    try {
      const resp = await axios.get(`/api/alphavantage?function=TIME_SERIES_DAILY&symbol=${symbol}`);
      setData(resp.data);
    } finally {
      setLoading(false);
    }
  }

  let chartData = null;
  if (data && data['Time Series (Daily)']) {
    const dates = Object.keys(data['Time Series (Daily)']).reverse();
    const closes = dates.map(date => parseFloat(data['Time Series (Daily)'][date]['4. close']));
    chartData = {
      labels: dates,
      datasets: [
        {
          label: `${symbol} Close Price`,
          data: closes,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
        }
      ]
    };
  }

  return (
    <Card style={{ margin: '2rem 0' }}>
      <CardHeader title="Alpha Vantage: Daily Close Chart" />
      <CardContent>
        <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol (e.g., IBM)" />
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
