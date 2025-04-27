import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '@mui/material';
import axios from 'axios';

export default function AlertHistoryWidget() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchEvents() {
    setLoading(true);
    const { data } = await axios.get('/api/alert-history?limit=100');
    setEvents(data);
    setLoading(false);
  }

  async function clearEvents() {
    await axios.delete('/api/alert-history');
    fetchEvents();
  }

  useEffect(() => { fetchEvents(); }, []);

  return (
    <Card style={{ margin: '2rem 0' }}>
      <CardHeader title="Alert Trigger History" action={<Button onClick={clearEvents} size="small">Clear</Button>} />
      <CardContent>
        {loading ? <div>Loading...</div> : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Message</th>
                  <th>Notified Users</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i}>
                    <td>{new Date(e.timestamp).toLocaleString()}</td>
                    <td>{e.alert.symbol || e.alert.id}</td>
                    <td>{e.alert.type}</td>
                    <td>{e.price}</td>
                    <td>{e.message}</td>
                    <td>{(e.notifiedUsers || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
