import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@mui/material';
import useSWR from 'swr';
import axios from 'axios';

function fetcher(url: string) {
  return axios.get(url).then(res => res.data);
}

export default function CumulativeSumPage() {
  const { data, error } = useSWR('/api/analytics', fetcher);

  // Aggregate all time series into a cumulative sum per coin
  const cumsum = useMemo(() => {
    if (!data || !data.sentimentHistory) return {};
    const result: Record<string, number[]> = {};
    Object.entries(data.sentimentHistory).forEach(([symbol, arr]) => {
      if (!Array.isArray(arr)) return;
      let sum = 0;
      result[symbol] = (arr as any[]).filter(s => s.source === 'aggregate').map(s => (sum += s.sentiment));
    });
    return result;
  }, [data]);

  if (error) return <div>Error loading data.</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>Cumulative Sentiment Sum</h2>
      <p>This page shows the cumulative sum of sentiment scores for each tracked coin. This can help visualize overall momentum and trend direction.</p>
      {Object.entries(cumsum).map(([symbol, arr]) => (
        <Card key={symbol} style={{ margin: '2rem 0', background: '#f8fafd' }}>
          <CardHeader title={<span>{symbol}</span>} />
          <CardContent>
            <div style={{ height: 200, overflow: 'auto' }}>
              <b>Final Cumulative Sum:</b> {arr.length ? arr[arr.length - 1].toFixed(2) : 'N/A'}
              <pre style={{ fontSize: 12, marginTop: 8, background: '#eef', padding: 8, borderRadius: 4, maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(arr, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
