import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, FormGroup, TextField, Button, Select, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

export default function PriceAlertsWidget({ notifSettings }: { notifSettings: any }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [input, setInput] = useState({
    type: 'stock', symbol: '', id: '', vs: 'usd', threshold: '', direction: 'above', alertType: 'price', short: 5, long: 20, period: 14, window: 20, numStdDev: 2, fast: 12, slow: 26, signal: 9
  });
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  async function fetchAlerts() {
    const { data } = await axios.get('/api/price-alerts');
    setAlerts(data);
  }

  async function addAlert() {
    setLoading(true);
    let alert: any = {
      ...input,
      notify: notifSettings
    };
    if (input.alertType === 'price') {
      alert.type = input.type;
      alert.direction = input.direction;
      alert.threshold = parseFloat(input.threshold);
    } else if (input.alertType === 'ma_cross') {
      alert.type = 'ma_cross';
      alert.short = parseInt(input.short as any, 10);
      alert.long = parseInt(input.long as any, 10);
      alert.direction = input.direction;
      alert.history = [];
      alert.lastCross = '';
    } else if (input.alertType === 'rsi') {
      alert.type = 'rsi';
      alert.period = input.period;
      alert.threshold = parseFloat(input.threshold);
      alert.history = [];
    } else if (input.alertType === 'volume_spike') {
      alert.type = 'volume_spike';
      alert.window = input.window;
      alert.threshold = parseFloat(input.threshold);
      alert.volumes = [];
    } else if (input.alertType === 'bollinger_band') {
      alert.type = 'bollinger_band';
      alert.window = input.window;
      alert.numStdDev = input.numStdDev;
      alert.direction = input.direction;
      alert.history = [];
    } else if (input.alertType === 'macd') {
      alert.type = 'macd';
      alert.fast = input.fast;
      alert.slow = input.slow;
      alert.signal = input.signal;
      alert.direction = input.direction;
      alert.history = [];
      alert.lastCross = '';
    }
    await axios.post('/api/price-alerts', alert);
    setInput({ type: 'stock', symbol: '', id: '', vs: 'usd', threshold: '', direction: 'above', alertType: 'price', short: 5, long: 20, period: 14, window: 20, numStdDev: 2, fast: 12, slow: 26, signal: 9 });
    setLoading(false);
    fetchAlerts();
  }

  async function removeAlert(idx: number) {
    await axios.delete(`/api/price-alerts/${idx}`);
    fetchAlerts();
  }

  useEffect(() => { fetchAlerts(); }, []);

  return (
    <Card sx={{ margin: '16px 0', boxShadow: theme.palette.mode === 'dark' ? '0 2px 12px #0006' : '0 2px 8px #0002', borderRadius: 12, background: theme.palette.background.paper, color: theme.palette.text.primary }}>
      <CardHeader title="Automated Price Alerts (Alpha Vantage & CoinGecko)" style={{ textAlign: 'center', paddingBottom: 0 }} />
      <CardContent>
        <FormGroup row sx={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <Select value={input.alertType} onChange={e => setInput(s => ({ ...s, alertType: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'alert-type-select' }}>
            <MenuItem value="price">Price Threshold</MenuItem>
            <MenuItem value="ma_cross">Moving Average Cross</MenuItem>
            <MenuItem value="rsi">RSI (Relative Strength Index)</MenuItem>
            <MenuItem value="volume_spike">Volume Spike</MenuItem>
            <MenuItem value="bollinger_band">Bollinger Bands</MenuItem>
            <MenuItem value="macd">MACD</MenuItem>
          </Select>
          <Select value={input.type} onChange={e => setInput(s => ({ ...s, type: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'asset-type-select' }}>
            <MenuItem value="stock">Stock (Alpha Vantage)</MenuItem>
            <MenuItem value="crypto">Crypto (CoinGecko)</MenuItem>
          </Select>
          {input.type === 'stock' ? (
            <TextField label="Symbol" value={input.symbol} onChange={e => setInput(s => ({ ...s, symbol: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'symbol-input' }} />
          ) : (
            <>
              <TextField label="Coin ID" value={input.id} onChange={e => setInput(s => ({ ...s, id: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'coin-id-input' }} />
              <TextField label="VS" value={input.vs} onChange={e => setInput(s => ({ ...s, vs: e.target.value }))} size="small" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'vs-input' }} />
            </>
          )}
          {input.alertType === 'price' ? (
            <>
              <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'direction-select' }}>
                <MenuItem value="above">Above</MenuItem>
                <MenuItem value="below">Below</MenuItem>
              </Select>
              <TextField label="Threshold" value={input.threshold} onChange={e => setInput(s => ({ ...s, threshold: e.target.value }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'threshold-input' }} />
            </>
          ) : input.alertType === 'ma_cross' ? (
            <>
              <TextField label="Short MA" value={input.short} onChange={e => setInput(s => ({ ...s, short: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'short-ma-input' }} />
              <TextField label="Long MA" value={input.long} onChange={e => setInput(s => ({ ...s, long: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'long-ma-input' }} />
              <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'ma-direction-select' }}>
                <MenuItem value="crosses_above">Crosses Above</MenuItem>
                <MenuItem value="crosses_below">Crosses Below</MenuItem>
              </Select>
            </>
          ) : input.alertType === 'rsi' ? (
            <>
              <TextField label="RSI Period" value={input.period} onChange={e => setInput(s => ({ ...s, period: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'rsi-period-input' }} />
              <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'rsi-direction-select' }}>
                <MenuItem value="above">RSI Above</MenuItem>
                <MenuItem value="below">RSI Below</MenuItem>
              </Select>
              <TextField label="RSI Threshold" value={input.threshold} onChange={e => setInput(s => ({ ...s, threshold: e.target.value }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'rsi-threshold-input' }} />
            </>
          ) : input.alertType === 'volume_spike' ? (
            <>
              <TextField label="Window" value={input.window} onChange={e => setInput(s => ({ ...s, window: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'window-input' }} />
              <TextField label="Spike x Average" value={input.threshold} onChange={e => setInput(s => ({ ...s, threshold: e.target.value }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'spike-input' }} />
            </>
          ) : input.alertType === 'bollinger_band' ? (
            <>
              <TextField label="Window" value={input.window} onChange={e => setInput(s => ({ ...s, window: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'window-input' }} />
              <TextField label="Std Dev" value={input.numStdDev} onChange={e => setInput(s => ({ ...s, numStdDev: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'std-dev-input' }} />
              <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'bb-direction-select' }}>
                <MenuItem value="crosses_above_upper">Crosses Above Upper</MenuItem>
                <MenuItem value="crosses_below_lower">Crosses Below Lower</MenuItem>
              </Select>
            </>
          ) : (
            <>
              <TextField label="Fast EMA" value={input.fast} onChange={e => setInput(s => ({ ...s, fast: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'fast-ema-input' }} />
              <TextField label="Slow EMA" value={input.slow} onChange={e => setInput(s => ({ ...s, slow: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'slow-ema-input' }} />
              <TextField label="Signal" value={input.signal} onChange={e => setInput(s => ({ ...s, signal: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'signal-input' }} />
              <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'macd-direction-select' }}>
                <MenuItem value="crosses_above">MACD Crosses Above Signal</MenuItem>
                <MenuItem value="crosses_below">MACD Crosses Below Signal</MenuItem>
              </Select>
            </>
          )}
          <Button onClick={addAlert} variant="contained" sx={{ height: 40 }} aria-label="Add Alert">Add Alert</Button>
        </FormGroup>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: theme.palette.background.paper }}>
            <thead>
              <tr style={{ background: theme.palette.action.hover }}>
                <th style={{ padding: 8 }}>Symbol</th>
                <th style={{ padding: 8 }}>Price</th>
                <th style={{ padding: 8 }}>Type</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <td style={{ padding: 8 }}>{alert.type === 'stock' ? alert.symbol : `${alert.id}/${alert.vs}`}</td>
                  <td style={{ padding: 8 }}>{alert.threshold}</td>
                  <td style={{ padding: 8 }}>{alert.alertType}</td>
                  <td style={{ padding: 8 }}>{alert.status}</td>
                  <td style={{ padding: 8 }}>
                    <Button variant="outlined" size="small" color="error" onClick={() => removeAlert(idx)} aria-label="Remove Alert">Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
