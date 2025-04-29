import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, FormGroup, TextField, Button, Select, MenuItem, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

/**
 * PriceAlertsWidget
 *
 * React widget for managing price alerts for stocks and crypto.
 * Features:
 *   - Displays current alerts, alert status, and alert history
 *   - Allows users to add new alerts (price, MA cross, RSI, etc.)
 *   - Supports multi-channel notifications (email, Slack, Telegram, etc.)
 *   - Uses websockets for real-time updates
 *
 * Props:
 *   notifSettings: Notification preferences for the current user
 */
export default function PriceAlertsWidget({ notifSettings }: { notifSettings: any }) {
  // State for alerts, status, history, and input fields
  /**
   * Alerts state: stores the current list of alerts
   */
  const [alerts, setAlerts] = useState<any[]>([]);
  /**
   * Alert status state: stores the current status of each alert
   */
  const [alertStatus, setAlertStatus] = useState<any[]>([]);
  /**
   * Alert history state: stores the recent alert events
   */
  const [alertHistory, setAlertHistory] = useState<any[]>([]);
  /**
   * Input state: stores the values of the input fields for adding new alerts
   */
  const [input, setInput] = useState({
    type: 'stock', symbol: '', id: '', vs: 'usd', threshold: '', direction: 'above', alertType: 'price', short: 5, long: 20, period: 14, window: 20, numStdDev: 2, fast: 12, slow: 26, signal: 9
  });
  /**
   * TradingView params state: stores the TradingView interval and exchange
   */
  const [tradingViewParams, setTradingViewParams] = useState({ interval: '1m', exchange: '' });
  /**
   * Loading state: indicates whether the component is currently loading
   */
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  // --- Error and success state for user feedback ---
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Initial input state for easy reset ---
  const initialInput = {
    type: 'stock', symbol: '', id: '', vs: 'usd', threshold: '', direction: 'above', alertType: 'price', short: 5, long: 20, period: 14, window: 20, numStdDev: 2, fast: 12, slow: 26, signal: 9
  };

  // WebSocket reference for real-time updates
  const wsRef = React.useRef<WebSocket | null>(null);

  /**
   * Fetches the current list of alerts from the backend API.
   * Sets the alerts state.
   */
  async function fetchAlerts() {
    setError(null);
    try {
      const { data } = await axios.get('/api/price-alerts');
      setAlerts(data);
    } catch (e) {
      setError('Failed to fetch alerts.');
    }
  }

  /**
   * Adds a new alert using the input state and notifSettings.
   * Sends a POST request to the backend API.
   */
  async function addAlert() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    let alert: any = {
      ...input,
      notify: notifSettings,
      tradingViewParams: { ...tradingViewParams }
    };
    if (input.alertType === 'price') {
      alert.type = input.type;
      alert.direction = input.direction;
      alert.threshold = parseNumber(input.threshold);
    } else if (input.alertType === 'ma_cross') {
      alert.type = 'ma_cross';
      alert.short = parseNumber(input.short, 5);
      alert.long = parseNumber(input.long, 20);
      alert.direction = input.direction;
      alert.history = [];
      alert.lastCross = '';
    } else if (input.alertType === 'rsi') {
      alert.type = 'rsi';
      alert.period = parseNumber(input.period, 14);
      alert.threshold = parseNumber(input.threshold);
      alert.history = [];
    } else if (input.alertType === 'volume_spike') {
      alert.type = 'volume_spike';
      alert.window = parseNumber(input.window, 20);
      alert.threshold = parseNumber(input.threshold);
      alert.volumes = [];
    } else if (input.alertType === 'bollinger_band') {
      alert.type = 'bollinger_band';
      alert.window = parseNumber(input.window, 20);
      alert.numStdDev = parseNumber(input.numStdDev, 2);
      alert.direction = input.direction;
      alert.history = [];
    } else if (input.alertType === 'macd') {
      alert.type = 'macd';
      alert.fast = parseNumber(input.fast, 12);
      alert.slow = parseNumber(input.slow, 26);
      alert.signal = parseNumber(input.signal, 9);
      alert.direction = input.direction;
      alert.history = [];
      alert.lastCross = '';
    } else if (input.alertType === 'adx') {
      alert.type = 'adx';
      alert.period = parseNumber(input.period, 14);
      alert.threshold = parseNumber(input.threshold);
      alert.highs = [];
      alert.lows = [];
      alert.history = [];
    }
    try {
      await axios.post('/api/price-alerts', alert);
      setInput(initialInput);
      setSuccess('Alert added successfully!');
      fetchAlerts();
    } catch (e) {
      setError('Failed to add alert.');
    } finally {
      setLoading(false);
    }
  }

  async function removeAlert(idx: number) {
    setError(null);
    setSuccess(null);
    try {
      await axios.delete(`/api/price-alerts/${idx}`);
      setSuccess('Alert removed.');
      fetchAlerts();
    } catch (e) {
      setError('Failed to remove alert.');
    }
  }

  // Test alert trigger
  async function testAlert(idx: number) {
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`/api/price-alerts/test/${idx}`);
      setSuccess('Test alert sent.');
    } catch (e) {
      setError('Failed to test alert.');
    }
  }

  // WebSocket connection for real-time updates
  useEffect(() => {
    fetchAlerts();
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      // Optionally, send an auth message if needed
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'alert_update') {
          fetchAlerts();
        } else if (msg.type === 'alert_status') {
          setAlertStatus((prev) => {
            const next = [...prev];
            next[msg.idx] = msg.status;
            return next;
          });
        } else if (msg.type === 'alert_history') {
          setAlertHistory(msg.history);
        }
      } catch (e) {}
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  // Helper for parsing numbers safely
  function parseNumber(val: any, fallback: number = 0) {
    const n = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(n) ? fallback : n;
  }

  return (
    <Card sx={{ margin: '16px 0', boxShadow: theme.palette.mode === 'dark' ? '0 2px 12px #0006' : '0 2px 8px #0002', borderRadius: 12, background: theme.palette.background.paper, color: theme.palette.text.primary }}>
      <CardHeader title="Automated Price Alerts (Alpha Vantage & CoinGecko)" style={{ textAlign: 'center', paddingBottom: 0 }} />
      <CardContent>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
        <FormGroup row sx={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Select value={input.alertType} onChange={e => setInput(s => ({ ...s, alertType: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'alert-type-select' }}>
                <MenuItem value="price">Price Threshold</MenuItem>
                <MenuItem value="ma_cross">Moving Average Cross</MenuItem>
                <MenuItem value="rsi">RSI (Relative Strength Index)</MenuItem>
                <MenuItem value="volume_spike">Volume Spike</MenuItem>
                <MenuItem value="bollinger_band">Bollinger Bands</MenuItem>
                <MenuItem value="macd">MACD</MenuItem>
                <MenuItem value="adx">ADX (Trend Strength)</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Select value={input.type} onChange={e => setInput(s => ({ ...s, type: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'asset-type-select' }}>
                <MenuItem value="stock">Stock (Alpha Vantage)</MenuItem>
                <MenuItem value="crypto">Crypto (CoinGecko)</MenuItem>
              </Select>
            </Grid>
            {input.type === 'stock' ? (
              <Grid item xs={12} sm={3}>
                <TextField label="Symbol" value={input.symbol} onChange={e => setInput(s => ({ ...s, symbol: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'symbol-input' }} />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField label="Coin ID" value={input.id} onChange={e => setInput(s => ({ ...s, id: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'coin-id-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="VS" value={input.vs} onChange={e => setInput(s => ({ ...s, vs: e.target.value }))} size="small" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'vs-input' }} />
                </Grid>
              </>
            )}
            {input.alertType === 'price' ? (
              <>
                <Grid item xs={12} sm={3}>
                  <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'direction-select' }}>
                    <MenuItem value="above">Above</MenuItem>
                    <MenuItem value="below">Below</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Threshold" value={input.threshold} onChange={e => setInput(s => ({ ...s, threshold: e.target.value }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'threshold-input' }} />
                </Grid>
              </>
            ) : input.alertType === 'ma_cross' ? (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField label="Short MA" value={input.short} onChange={e => setInput(s => ({ ...s, short: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'short-ma-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Long MA" value={input.long} onChange={e => setInput(s => ({ ...s, long: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'long-ma-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'ma-direction-select' }}>
                    <MenuItem value="crosses_above">Crosses Above</MenuItem>
                    <MenuItem value="crosses_below">Crosses Below</MenuItem>
                  </Select>
                </Grid>
              </>
            ) : input.alertType === 'rsi' ? (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField label="RSI Period" value={input.period} onChange={e => setInput(s => ({ ...s, period: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'rsi-period-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'rsi-direction-select' }}>
                    <MenuItem value="above">RSI Above</MenuItem>
                    <MenuItem value="below">RSI Below</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="RSI Threshold" value={input.threshold} onChange={e => setInput(s => ({ ...s, threshold: e.target.value }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'rsi-threshold-input' }} />
                </Grid>
              </>
            ) : input.alertType === 'volume_spike' ? (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField label="Window" value={input.window} onChange={e => setInput(s => ({ ...s, window: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'window-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Spike x Average" value={input.threshold} onChange={e => setInput(s => ({ ...s, threshold: e.target.value }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'spike-input' }} />
                </Grid>
              </>
            ) : input.alertType === 'bollinger_band' ? (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField label="Window" value={input.window} onChange={e => setInput(s => ({ ...s, window: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'window-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Std Dev" value={input.numStdDev} onChange={e => setInput(s => ({ ...s, numStdDev: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'std-dev-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'bb-direction-select' }}>
                    <MenuItem value="crosses_above_upper">Crosses Above Upper</MenuItem>
                    <MenuItem value="crosses_below_lower">Crosses Below Lower</MenuItem>
                  </Select>
                </Grid>
              </>
            ) : input.alertType === 'adx' ? (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField label="ADX Period" value={input.period} onChange={e => setInput(s => ({ ...s, period: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'adx-period-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="ADX Threshold" value={input.threshold} onChange={e => setInput(s => ({ ...s, threshold: e.target.value }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'adx-threshold-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'adx-direction-select' }}>
                    <MenuItem value="above">ADX Above</MenuItem>
                    <MenuItem value="below">ADX Below</MenuItem>
                  </Select>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField label="Fast EMA" value={input.fast} onChange={e => setInput(s => ({ ...s, fast: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'fast-ema-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Slow EMA" value={input.slow} onChange={e => setInput(s => ({ ...s, slow: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'slow-ema-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField label="Signal" value={input.signal} onChange={e => setInput(s => ({ ...s, signal: Number(e.target.value) }))} size="small" type="number" sx={{ minWidth: 100, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'signal-input' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Select value={input.direction} onChange={e => setInput(s => ({ ...s, direction: e.target.value }))} size="small" sx={{ minWidth: 120, background: theme.palette.background.default }} inputProps={{ 'aria-label': 'macd-direction-select' }}>
                    <MenuItem value="crosses_above">MACD Crosses Above Signal</MenuItem>
                    <MenuItem value="crosses_below">MACD Crosses Below Signal</MenuItem>
                  </Select>
                </Grid>
              </>
            )}
            <Grid item xs={6} sm={3}>
              <TextField
                label="TradingView Interval"
                value={tradingViewParams.interval}
                onChange={e => setTradingViewParams(p => ({ ...p, interval: e.target.value }))}
                fullWidth
                size="small"
                helperText="e.g. 1m, 5m, 1h, 1d"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Exchange (optional)"
                value={tradingViewParams.exchange}
                onChange={e => setTradingViewParams(p => ({ ...p, exchange: e.target.value }))}
                fullWidth
                size="small"
                helperText="e.g. NASDAQ, NYSE, BINANCE"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button onClick={addAlert} variant="contained" sx={{ height: 40 }} aria-label="Add Alert" disabled={loading}>Add Alert</Button>
            </Grid>
            {alerts.length > 0 && (
              <Grid item xs={12} sm={2}>
                <Button onClick={() => testAlert(0)} variant="outlined" color="secondary" sx={{ ml: 2 }} disabled={loading}>
                  Test First Alert
                </Button>
              </Grid>
            )}
          </Grid>
        </FormGroup>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: theme.palette.background.paper }}>
            <thead>
              <tr style={{ background: theme.palette.action.hover }}>
                <th style={{ padding: 8 }}>Symbol</th>
                <th style={{ padding: 8 }}>Price</th>
                <th style={{ padding: 8 }}>Type</th>
                <th style={{ padding: 8 }}>Last Price</th>
                <th style={{ padding: 8 }}>Triggered?</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, idx) => {
                const status = alertStatus[idx] || {};
                return (
                  <tr key={idx} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <td style={{ padding: 8 }}>{alert.type === 'stock' ? alert.symbol : `${alert.id}/${alert.vs}`}</td>
                    <td style={{ padding: 8 }}>{alert.threshold}</td>
                    <td style={{ padding: 8 }}>{alert.alertType}</td>
                    <td style={{ padding: 8 }}>{status.lastPrice !== undefined && status.lastPrice !== null ? status.lastPrice : '-'}</td>
                    <td style={{ padding: 8 }}>{status.triggered ? 'Yes' : 'No'}</td>
                    <td style={{ padding: 8 }}>{alert.status}</td>
                    <td style={{ padding: 8 }}>
                      <Button variant="outlined" size="small" color="error" onClick={() => removeAlert(idx)} aria-label="Remove Alert">Remove</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Alert History Section */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 8 }}>Recent Alert Events</h3>
          <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, background: theme.palette.background.default }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.palette.action.hover }}>
                  <th style={{ padding: 6 }}>Time</th>
                  <th style={{ padding: 6 }}>Symbol</th>
                  <th style={{ padding: 6 }}>Type</th>
                  <th style={{ padding: 6 }}>Price</th>
                  <th style={{ padding: 6 }}>Message</th>
                  <th style={{ padding: 6 }}>Users Notified</th>
                </tr>
              </thead>
              <tbody>
                {alertHistory.map((event, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <td style={{ padding: 6 }}>{new Date(event.timestamp).toLocaleString()}</td>
                    <td style={{ padding: 6 }}>{event.alert?.symbol || event.alert?.id}</td>
                    <td style={{ padding: 6 }}>{event.alert?.type}</td>
                    <td style={{ padding: 6 }}>{event.price}</td>
                    <td style={{ padding: 6 }}>{event.message}</td>
                    <td style={{ padding: 6 }}>{(event.notifiedUsers || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
