import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@mui/material';
import axios from 'axios';

export default function CoinGeckoWidget() {
  const [ids, setIds] = useState('bitcoin,ethereum');
  const [vs, setVs] = useState('usd');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    setData(null);
    try {
      const resp = await axios.get(`/api/coingecko/simple/price?ids=${ids}&vs_currencies=${vs}`);
      setData(resp.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={{ margin: '2rem 0' }}>
      <CardHeader title="CoinGecko: Crypto Prices" />
      <CardContent>
        <input value={ids} onChange={e => setIds(e.target.value)} placeholder="IDs (e.g., bitcoin,ethereum)" />
        <input value={vs} onChange={e => setVs(e.target.value)} placeholder="VS Currency (e.g., usd)" />
        <button className="btn btn-primary" onClick={fetchData} disabled={loading}>Fetch Data</button>
        {data && (
          <pre style={{ background: '#eef', padding: 8, borderRadius: 4, marginTop: 12 }}>{JSON.stringify(data, null, 2)}</pre>
        )}
      </CardContent>
    </Card>
  );
}
