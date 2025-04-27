import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@mui/material';
import axios from 'axios';

export default function AlphaVantageWidget() {
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

  return (
    <Card style={{ margin: '2rem 0' }}>
      <CardHeader title="Alpha Vantage: Daily Stock Data" />
      <CardContent>
        <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol (e.g., IBM)" />
        <button className="btn btn-primary" onClick={fetchData} disabled={loading}>Fetch Data</button>
        {data && (
          <pre style={{ background: '#eef', padding: 8, borderRadius: 4, marginTop: 12 }}>{JSON.stringify(data, null, 2)}</pre>
        )}
      </CardContent>
    </Card>
  );
}
