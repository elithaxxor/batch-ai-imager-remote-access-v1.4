import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StarIcon from '@mui/icons-material/Star';
import FunctionsIcon from '@mui/icons-material/Functions';
import TimelineIcon from '@mui/icons-material/Timeline';
import axios from 'axios';
import AlphaVantageWidget from './AlphaVantageWidget';
import CoinGeckoWidget from './CoinGeckoWidget';
import AlphaVantageChart from './AlphaVantageChart';
import CoinGeckoChart from './CoinGeckoChart';
import PriceAlertsWidget from './PriceAlertsWidget';
import AlertHistoryWidget from './AlertHistoryWidget';
import VisualIndicatorsWidget from './VisualIndicatorsWidget';
import AlertHistoryExport from './AlertHistoryExport';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Legend);

interface AnalyticsData {
  priceHistory: { [symbol: string]: { ts: number; price: number }[] };
  sentimentHistory: { [symbol: string]: { ts: number; sentiment: number; volume: number; source: string }[] };
  trending: { symbol: string; name: string; score: number }[];
  sourceBreakdown: { [symbol: string]: { [source: string]: number } };
  leaderboard: { symbol: string; name: string; buzz: number; sentiment: number }[];
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [alerts, setAlerts] = useState<{symbol: string, type: 'sentiment'|'price', threshold: number, direction: 'above'|'below'}[]>([]);
  const [alertInput, setAlertInput] = useState<{symbol: string, type: 'sentiment'|'price', threshold: string, direction: 'above'|'below'}>({symbol: '', type: 'sentiment', threshold: '', direction: 'above'});
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [analyticsTab, setAnalyticsTab] = useState<'correlation'|'projections'|'sources'|'backtest'>('correlation');
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('watchlist') || '[]');
    } catch {
      return [];
    }
  });
  const [watchInput, setWatchInput] = useState('');

  // --- Notification Settings UI State ---
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notifSettings') || '{}');
    } catch { return {}; }
  });
  const [notifInput, setNotifInput] = useState({
    email: '',
    discord: '',
    push: '',
    slack: '',
    telegramBotToken: '',
    telegramChatId: '',
    smsSid: '',
    smsToken: '',
    smsFrom: '',
    smsTo: '',
  });

  function saveNotifSettings() {
    setNotifSettings(notifInput);
    localStorage.setItem('notifSettings', JSON.stringify(notifInput));
  }

  async function sendNotification(type: string, message: string) {
    if (type === 'email' && notifSettings.email) {
      await axios.post('/api/notify/email', {
        to: notifSettings.email,
        subject: 'Alert Triggered',
        text: message,
      });
    } else if (type === 'discord' && notifSettings.discord) {
      await axios.post('/api/notify/discord', {
        webhookUrl: notifSettings.discord,
        message,
      });
    } else if (type === 'push' && notifSettings.push) {
      await axios.post('/api/notify/push', {
        userKey: notifSettings.push,
        message,
      });
    } else if (type === 'slack' && notifSettings.slack) {
      await axios.post('/api/notify/slack', {
        webhookUrl: notifSettings.slack,
        message,
      });
    } else if (type === 'telegram' && notifSettings.telegramBotToken && notifSettings.telegramChatId) {
      await axios.post('/api/notify/telegram', {
        botToken: notifSettings.telegramBotToken,
        chatId: notifSettings.telegramChatId,
        message,
      });
    } else if (type === 'sms' && notifSettings.smsSid && notifSettings.smsToken && notifSettings.smsFrom && notifSettings.smsTo) {
      await axios.post('/api/notify/sms', {
        accountSid: notifSettings.smsSid,
        authToken: notifSettings.smsToken,
        from: notifSettings.smsFrom,
        to: notifSettings.smsTo,
        message,
      });
    }
  }

  // Notification settings UI
  function renderNotificationSettings() {
    return (
      <Card style={{ margin: '2rem 0', background: '#e3f2fd' }}>
        <CardHeader title={<span>Notification Settings</span>} />
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
            <label>Email: <input type="email" value={notifInput.email} onChange={e => setNotifInput(s => ({ ...s, email: e.target.value }))} /></label>
            <label>Discord Webhook: <input type="text" value={notifInput.discord} onChange={e => setNotifInput(s => ({ ...s, discord: e.target.value }))} /></label>
            <label>Pushover User Key: <input type="text" value={notifInput.push} onChange={e => setNotifInput(s => ({ ...s, push: e.target.value }))} /></label>
            <label>Slack Webhook: <input type="text" value={notifInput.slack} onChange={e => setNotifInput(s => ({ ...s, slack: e.target.value }))} /></label>
            <label>Telegram Bot Token: <input type="text" value={notifInput.telegramBotToken} onChange={e => setNotifInput(s => ({ ...s, telegramBotToken: e.target.value }))} /></label>
            <label>Telegram Chat ID: <input type="text" value={notifInput.telegramChatId} onChange={e => setNotifInput(s => ({ ...s, telegramChatId: e.target.value }))} /></label>
            <label>Twilio SID: <input type="text" value={notifInput.smsSid} onChange={e => setNotifInput(s => ({ ...s, smsSid: e.target.value }))} /></label>
            <label>Twilio Auth Token: <input type="text" value={notifInput.smsToken} onChange={e => setNotifInput(s => ({ ...s, smsToken: e.target.value }))} /></label>
            <label>SMS From: <input type="text" value={notifInput.smsFrom} onChange={e => setNotifInput(s => ({ ...s, smsFrom: e.target.value }))} /></label>
            <label>SMS To: <input type="text" value={notifInput.smsTo} onChange={e => setNotifInput(s => ({ ...s, smsTo: e.target.value }))} /></label>
            <button className="btn btn-primary" onClick={saveNotifSettings}>Save Notification Settings</button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- ML Model Selection State ---
  const [mlModel, setMlModel] = useState<'prophet'|'arima'|'lstm'>('prophet');
  const [mlForecast, setMlForecast] = useState<any[]>([]);
  const [mlLoading, setMlLoading] = useState(false);

  async function runForecast(symbol: string) {
    if (!data) return;
    setMlLoading(true);
    const sent = data.sentimentHistory[symbol]?.filter(s => s.source === 'aggregate') || [];
    const history = sent.map(s => ({ ds: new Date(s.ts).toISOString(), y: s.sentiment }));
    let url = mlModel === 'prophet' ? '/api/ml/prophet' : mlModel === 'arima' ? '/api/ml/arima' : '/api/ml/lstm';
    let body: any = { history, periods: 10 };
    if (mlModel === 'arima') body.order = [2,1,2];
    try {
      const resp = await axios.post(url, body);
      setMlForecast(resp.data.forecast);
    } catch {
      setMlForecast([]);
    }
    setMlLoading(false);
  }

  function renderMLForecast() {
    if (mlLoading) return <div>Loading forecast...</div>;
    if (!mlForecast.length) return <div>No forecast data.</div>;
    return (
      <div style={{ margin: '1rem 0' }}>
        <h4>Forecast ({mlModel.toUpperCase()})</h4>
        <pre style={{ background: '#f8fafd', padding: 12, borderRadius: 6 }}>{JSON.stringify(mlForecast, null, 2)}</pre>
      </div>
    );
  }

  // --- Backtesting Tab State ---
  const [backtestResult, setBacktestResult] = useState<any[]>([]);
  const [backtestLoading, setBacktestLoading] = useState(false);
  async function runBacktest(symbol: string) {
    setBacktestLoading(true);
    // Demo: Simulate buy on sentiment > 0.5, sell on < -0.5
    if (!data) return;
    const sent = data.sentimentHistory[symbol]?.filter(s => s.source === 'aggregate') || [];
    let position = 0, pnl = 0;
    let log: any[] = [];
    sent.forEach((s, i) => {
      if (position === 0 && s.sentiment > 0.5) {
        position = s.sentiment;
        log.push({ action: 'BUY', idx: i, sentiment: s.sentiment });
      } else if (position !== 0 && s.sentiment < -0.5) {
        pnl += s.sentiment - position;
        log.push({ action: 'SELL', idx: i, sentiment: s.sentiment, pnl });
        position = 0;
      }
    });
    setBacktestResult(log);
    setBacktestLoading(false);
  }

  function renderBacktest() {
    if (backtestLoading) return <div>Running backtest...</div>;
    if (!backtestResult.length) return <div>No backtest data.</div>;
    return (
      <div style={{ margin: '1rem 0' }}>
        <h4>Backtest Result</h4>
        <pre style={{ background: '#f8fafd', padding: 12, borderRadius: 6 }}>{JSON.stringify(backtestResult, null, 2)}</pre>
      </div>
    );
  }

  // --- Enhanced Alerts: Send notifications on trigger ---
  useEffect(() => {
    if (!data) return;
    activeAlerts.forEach(msg => {
      ['email','discord','push','slack','telegram','sms'].forEach(type => {
        sendNotification(type, msg);
      });
    });
    // eslint-disable-next-line
  }, [activeAlerts]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/analytics')
      .then(res => res.json())
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    const triggered: string[] = [];
    alerts.forEach(alert => {
      const val = alert.type === 'sentiment'
        ? data.sentimentHistory[alert.symbol]?.filter(s => s.source === 'aggregate').slice(-1)[0]?.sentiment
        : data.priceHistory[alert.symbol]?.slice(-1)[0]?.price;
      if (val !== undefined) {
        if ((alert.direction === 'above' && val > Number(alert.threshold)) ||
            (alert.direction === 'below' && val < Number(alert.threshold))) {
          triggered.push(`${alert.symbol} ${alert.type} ${alert.direction} ${alert.threshold}`);
        }
      }
    });
    setActiveAlerts(triggered);
  }, [alerts, data]);

  useEffect(() => {
    axios.get('/api/alerts').then(res => {
      setAlerts(res.data.alerts || []);
    });
  }, []);

  function persistAlert(alert: any) {
    axios.post('/api/alerts', { alert });
  }
  function removeAlert(alert: any) {
    axios.delete('/api/alerts', { data: { alert } });
  }

  function linearRegression(y: number[]): { slope: number, intercept: number } {
    const n = y.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xSum = x.reduce((a, b) => a + b, 0);
    const ySum = y.reduce((a, b) => a + b, 0);
    const xySum = x.reduce((a, b, i) => a + b * y[i], 0);
    const xxSum = x.reduce((a, b) => a + b * b, 0);
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum || 1);
    const intercept = (ySum - slope * xSum) / n;
    return { slope, intercept };
  }

  function movingAverage(y: number[], window: number): number[] {
    return y.map((_, i, arr) => {
      if (i < window - 1) return NaN;
      const slice = arr.slice(i - window + 1, i + 1);
      return slice.reduce((a, b) => a + b, 0) / window;
    });
  }

  function exponentialSmoothing(y: number[], alpha: number): number[] {
    let prev = y[0] || 0;
    return y.map((val, i) => {
      if (i === 0) return val;
      prev = alpha * val + (1 - alpha) * prev;
      return prev;
    });
  }

  function renderCorrelationChart(symbol: string) {
    if (!data) return null;
    const price = data.priceHistory[symbol] || [];
    const sent = data.sentimentHistory[symbol]?.filter(s => s.source === 'aggregate') || [];
    if (price.length < 2 || sent.length < 2) return null;
    const labels = price.map(p => new Date(p.ts).toLocaleTimeString());
    // Projection (simple linear regression on sentiment)
    const sentVals = sent.map(s => s.sentiment);
    const { slope, intercept } = linearRegression(sentVals);
    const proj = sentVals.map((_, i) => slope * i + intercept);
    return (
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Price',
              data: price.map(p => p.price),
              yAxisID: 'y',
              borderColor: '#007bff',
              backgroundColor: 'rgba(0,123,255,0.1)',
              fill: false,
              tension: 0.5,
            },
            {
              label: 'Sentiment',
              data: sentVals,
              yAxisID: 'y1',
              borderColor: '#ff9800',
              backgroundColor: 'rgba(255,152,0,0.1)',
              fill: false,
              tension: 0.5,
            },
            {
              label: 'Sentiment Projection',
              data: proj,
              yAxisID: 'y1',
              borderColor: '#00e676',
              borderDash: [8, 4],
              pointRadius: 0,
              fill: false,
              tension: 0.5,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: { type: 'linear', position: 'left', title: { display: true, text: 'Price' } },
            y1: {
              type: 'linear',
              position: 'right',
              min: -1,
              max: 1,
              title: { display: true, text: 'Sentiment' },
              grid: { drawOnChartArea: false },
            },
          },
        }}
        height={280}
      />
    );
  }

  function renderProjectionChart(symbol: string) {
    if (!data) return null;
    const sent = data.sentimentHistory[symbol]?.filter(s => s.source === 'aggregate') || [];
    if (sent.length < 2) return null;
    const labels = sent.map((_, i) => i.toString());
    const sentVals = sent.map(s => s.sentiment);
    const { slope, intercept } = linearRegression(sentVals);
    const proj = sentVals.map((_, i) => slope * i + intercept);
    const ma = movingAverage(sentVals, 5);
    const exp = exponentialSmoothing(sentVals, 0.4);
    return (
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Sentiment',
              data: sentVals,
              borderColor: '#ff9800',
              backgroundColor: 'rgba(255,152,0,0.1)',
              fill: false,
              tension: 0.5,
            },
            {
              label: 'Linear Projection',
              data: proj,
              borderColor: '#00e676',
              borderDash: [8, 4],
              pointRadius: 0,
              fill: false,
              tension: 0.5,
            },
            {
              label: 'Moving Avg (5)',
              data: ma,
              borderColor: '#1976d2',
              borderDash: [2, 2],
              pointRadius: 0,
              fill: false,
              tension: 0.5,
            },
            {
              label: 'Exp. Smoothing',
              data: exp,
              borderColor: '#ab47bc',
              borderDash: [6, 2],
              pointRadius: 0,
              fill: false,
              tension: 0.5,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: { min: -1, max: 1, title: { display: true, text: 'Sentiment' } },
            x: { display: false },
          },
        }}
        height={260}
      />
    );
  }

  function renderTrending() {
    if (!data) return null;
    return (
      <Card style={{ margin: '2rem 0', background: '#f7faff' }}>
        <CardHeader title={<span><TrendingUpIcon style={{ color: '#007bff', verticalAlign: 'middle' }} /> Trending Coins (Social Momentum)</span>} />
        <CardContent>
          <ol style={{ margin: 0, paddingLeft: 24 }}>
            {data.trending.map((c, i) => (
              <li key={c.symbol} style={{ fontWeight: i < 3 ? 'bold' : undefined, marginBottom: 4 }}>
                {i + 1}. {c.name} ({c.symbol}) — Score: {c.score.toFixed(2)}
                {c.score > 0.2 && <ArrowUpwardIcon fontSize="small" style={{ color: 'green', marginLeft: 6 }} />}
                {c.score < -0.2 && <ArrowDownwardIcon fontSize="small" style={{ color: 'red', marginLeft: 6 }} />}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    );
  }

  function renderSourceBreakdown(symbol: string) {
    if (!data) return null;
    const breakdown = data.sourceBreakdown[symbol];
    if (!breakdown) return null;
    const sources = Object.keys(breakdown);
    const values = Object.values(breakdown);
    const colors = ['#007bff', '#ff9800', '#8bc34a', '#e91e63', '#1da1f2', '#6e5494'];
    return (
      <Card style={{ margin: '2rem 0' }}>
        <CardHeader title={<span>Source Breakdown <Tooltip title="Sentiment by source (LunarCrush, CryptoPanic, Reddit, Twitter, StockTwits, Discord, Google Trends, On-chain)"><InfoOutlinedIcon fontSize="small" style={{ verticalAlign: 'middle', color: '#888' }} /></Tooltip></span>} />
        <CardContent>
          <Bar
            data={{
              labels: sources,
              datasets: [{
                label: 'Sentiment by Source',
                data: values,
                backgroundColor: colors,
              }],
            }}
            options={{
              indexAxis: 'y',
              plugins: { legend: { display: false } },
              scales: { x: { min: -1, max: 1 } },
            }}
            height={120}
          />
        </CardContent>
      </Card>
    );
  }

  function renderSourceDetails(symbol: string) {
    if (!data) return null;
    const breakdown = data.sourceBreakdown[symbol];
    if (!breakdown) return null;
    return (
      <Card style={{ margin: '2rem 0' }}>
        <CardHeader title={<span>All Source Breakdown <Tooltip title="Sentiment & activity by source, including Google Trends and On-chain"><InfoOutlinedIcon fontSize="small" style={{ verticalAlign: 'middle', color: '#888' }} /></Tooltip></span>} />
        <CardContent>
          <pre style={{ fontSize: 15, background: '#f8fafd', padding: 12, borderRadius: 6 }}>{JSON.stringify(breakdown, null, 2)}</pre>
        </CardContent>
      </Card>
    );
  }

  function renderLeaderboard() {
    if (!data) return null;
    return (
      <Card style={{ margin: '2rem 0', background: '#f8f8ff' }}>
        <CardHeader title="Leaderboard (Buzz Index)" />
        <CardContent>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f0f4fa' }}>
                <th>Rank</th>
                <th>Name</th>
                <th>Symbol</th>
                <th>Buzz</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((c, i) => (
                <tr key={c.symbol} style={{ fontWeight: i < 3 ? 'bold' : undefined, background: i % 2 ? '#f7faff' : '#fff' }}>
                  <td>{i + 1}</td>
                  <td>{c.name}</td>
                  <td>{c.symbol}</td>
                  <td>{c.buzz.toLocaleString()}</td>
                  <td style={{ color: c.sentiment > 0.2 ? 'green' : c.sentiment < -0.2 ? 'red' : '#444' }}>{(c.sentiment * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  }

  function isLeadingIndicator(symbol: string): boolean {
    if (!data) return false;
    const sent = data.sentimentHistory[symbol]?.filter(s => s.source === 'Twitter') || [];
    const price = data.priceHistory[symbol] || [];
    if (sent.length < 4 || price.length < 4) return false;
    // If Twitter sentiment rises sharply, and price rises after
    const deltaSent = sent[sent.length - 1].sentiment - sent[sent.length - 4].sentiment;
    const deltaPrice = price[price.length - 1].price - price[price.length - 4].price;
    return deltaSent > 0.4 && deltaPrice > 0.2;
  }

  function renderAlerts() {
    if (!data) return null;
    const coins = Object.keys(data.priceHistory);
    return (
      <Card style={{ margin: '2rem 0', background: '#fffbe7' }}>
        <CardHeader title={<span><NotificationsActiveIcon style={{ color: '#ff9800', verticalAlign: 'middle' }} /> Custom Alerts</span>} />
        <CardContent>
          <form style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }} onSubmit={e => { e.preventDefault(); setAlerts([...alerts, {...alertInput, threshold: Number(alertInput.threshold)}]); persistAlert({...alertInput, threshold: Number(alertInput.threshold)}); }}>
            <label>Coin:</label>
            <select value={alertInput.symbol} onChange={e => setAlertInput(a => ({...a, symbol: e.target.value}))} required>
              <option value="">--Choose--</option>
              {coins.map(symbol => <option key={symbol} value={symbol}>{symbol}</option>)}
            </select>
            <label>Type:</label>
            <select value={alertInput.type} onChange={e => setAlertInput(a => ({...a, type: e.target.value as 'sentiment'|'price'}))}>
              <option value="sentiment">Sentiment</option>
              <option value="price">Price</option>
            </select>
            <label>Direction:</label>
            <select value={alertInput.direction} onChange={e => setAlertInput(a => ({...a, direction: e.target.value as 'above'|'below'}))}>
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <label>Threshold:</label>
            <input type="number" step="any" value={alertInput.threshold} onChange={e => setAlertInput(a => ({...a, threshold: e.target.value}))} required style={{ width: 80 }} />
            <button type="submit" className="btn btn-primary">Add Alert</button>
          </form>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {alerts.map((a, i) => (
              <li key={i} style={{ marginBottom: 3 }}>
                {a.symbol} {a.type} {a.direction} {a.threshold}
                <button style={{ marginLeft: 8 }} onClick={() => { setAlerts(alerts.filter((_, j) => j !== i)); removeAlert(a); }}>Remove</button>
              </li>
            ))}
          </ul>
          {activeAlerts.length > 0 && <div style={{ color: 'red', marginTop: 12 }}>
            <strong>Triggered Alerts:</strong>
            <ul>{activeAlerts.map((msg, i) => <li key={i}>{msg} <a href="mailto:notify@example.com?subject=Alert Triggered&body=Alert: " target="_blank" rel="noopener noreferrer">Email</a> <a href="https://discord.com/channels/@me" target="_blank" rel="noopener noreferrer">Discord</a></li>)}</ul>
          </div>}
        </CardContent>
      </Card>
    );
  }

  function coinSelection() {
    if (!data) return null;
    const coins = Object.keys(data.priceHistory);
    return (
      <Card style={{ margin: '1rem 0' }}>
        <CardHeader title="Select Coin / Watchlist" />
        <CardContent>
          <label>Select Coin: </label>
          <select value={selectedCoin} onChange={e => setSelectedCoin(e.target.value)}>
            <option value="">--Choose--</option>
            {watchlist.concat(coins.filter(c => !watchlist.includes(c))).map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Add coin (e.g. SHIB)"
            value={watchInput}
            onChange={e => setWatchInput(e.target.value.toUpperCase())}
            style={{ marginLeft: 10, width: 80 }}
          />
          <button onClick={() => { addToWatchlist(watchInput); setWatchInput(''); }} disabled={!watchInput || watchlist.includes(watchInput)} style={{ marginLeft: 4 }}>
            Add
          </button>
          {selectedCoin && isLeadingIndicator(selectedCoin) && (
            <span style={{ marginLeft: 18, color: '#007bff', fontWeight: 600 }}>
              <StarIcon fontSize="small" style={{ verticalAlign: 'middle', color: '#007bff' }} /> Leading Indicator: Twitter spike detected
            </span>
          )}
          <div style={{ marginTop: 10 }}>
            <b>Watchlist:</b>
            {watchlist.length === 0 && <span style={{ color: '#888', marginLeft: 8 }}>None</span>}
            {watchlist.map(symbol => (
              <span key={symbol} style={{ display: 'inline-block', background: '#e3f2fd', color: '#1565c0', borderRadius: 8, padding: '2px 10px', margin: '0 6px' }}>
                {symbol} <button style={{ marginLeft: 2, color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => removeFromWatchlist(symbol)}>&times;</button>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function addToWatchlist(symbol: string) {
    if (!symbol || watchlist.includes(symbol)) return;
    const next = [...watchlist, symbol];
    setWatchlist(next);
    localStorage.setItem('watchlist', JSON.stringify(next));
  }

  function removeFromWatchlist(symbol: string) {
    const next = watchlist.filter(s => s !== symbol);
    setWatchlist(next);
    localStorage.setItem('watchlist', JSON.stringify(next));
  }

  function renderTabs() {
    return (
      <div style={{ display: 'flex', gap: 16, margin: '18px 0 8px 0' }}>
        <button className={`btn ${analyticsTab==='correlation'?'btn-primary':'btn-secondary'}`} onClick={()=>setAnalyticsTab('correlation')}><TimelineIcon fontSize="small"/> Correlation</button>
        <button className={`btn ${analyticsTab==='projections'?'btn-primary':'btn-secondary'}`} onClick={()=>setAnalyticsTab('projections')}><FunctionsIcon fontSize="small"/> Projections</button>
        <button className={`btn ${analyticsTab==='sources'?'btn-primary':'btn-secondary'}`} onClick={()=>setAnalyticsTab('sources')}><InfoOutlinedIcon fontSize="small"/> Sources</button>
        <button className={`btn ${analyticsTab==='backtest'?'btn-primary':'btn-secondary'}`} onClick={()=>setAnalyticsTab('backtest')}>Backtest</button>
      </div>
    );
  }

  const [helpOpen, setHelpOpen] = useState(false);

  // --- Advanced Analytics Widgets State ---
  const [sharpeRatio, setSharpeRatio] = useState<number|null>(null);
  const [maxDrawdown, setMaxDrawdown] = useState<number|null>(null);
  const [volatility, setVolatility] = useState<number|null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<any>(null);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  // --- Advanced Analytics Calculation ---
  function calculateSharpeRatio(returns: number[], riskFreeRate = 0.01) {
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.map(r => (r - avg) ** 2).reduce((a, b) => a + b, 0) / returns.length);
    return std ? ((avg - riskFreeRate) / std) : null;
  }
  function calculateMaxDrawdown(prices: number[]) {
    let max = prices[0], maxDD = 0;
    for (let p of prices) {
      if (p > max) max = p;
      const dd = (max - p) / max;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }
  function calculateVolatility(returns: number[]) {
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    return Math.sqrt(returns.map(r => (r - avg) ** 2).reduce((a, b) => a + b, 0) / returns.length);
  }
  function calculateCorrelationMatrix(symbols: string[], priceHistories: {[symbol: string]: { ts: number; price: number }[]}) {
    // Simple Pearson correlation matrix
    const returns = symbols.map(sym => {
      const ph = priceHistories[sym];
      if (!ph) return [];
      return ph.slice(1).map((v, i) => (v.price - ph[i].price) / ph[i].price);
    });
    const n = symbols.length;
    const corr: number[][] = Array.from({length: n}, () => Array(n).fill(0));
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        if (i === j) { corr[i][j] = 1; continue; }
        const r1 = returns[i], r2 = returns[j];
        const avg1 = r1.reduce((a, b) => a + b, 0) / r1.length;
        const avg2 = r2.reduce((a, b) => a + b, 0) / r2.length;
        const num = r1.map((r, k) => (r - avg1) * (r2[k] - avg2)).reduce((a, b) => a + b, 0);
        const den = Math.sqrt(r1.map(r => (r - avg1) ** 2).reduce((a, b) => a + b, 0) * r2.map(r => (r - avg2) ** 2).reduce((a, b) => a + b, 0));
        corr[i][j] = den ? num / den : 0;
      }
    }
    return { symbols, matrix: corr };
  }

  // --- Advanced Analytics Calculation Trigger ---
  useEffect(() => {
    if (!data || !selectedCoin) return;
    const ph = data.priceHistory[selectedCoin];
    if (!ph || ph.length < 2) return;
    const prices = ph.map(p => p.price);
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    setSharpeRatio(calculateSharpeRatio(returns));
    setMaxDrawdown(calculateMaxDrawdown(prices));
    setVolatility(calculateVolatility(returns));
    // Correlation matrix for all watchlist
    if (watchlist.length > 1) {
      setCorrelationMatrix(calculateCorrelationMatrix(watchlist, data.priceHistory));
    } else {
      setCorrelationMatrix(null);
    }
  }, [data, selectedCoin, watchlist]);

  // --- Advanced Analytics Widget UI ---
  function renderAdvancedAnalytics() {
    if (!selectedCoin) return null;
    return (
      <Card style={{ margin: '2rem 0', background: '#f5f5fa' }}>
        <CardHeader title={<span>Advanced Analytics <Button size="small" onClick={() => setShowAdvancedAnalytics(v => !v)}>{showAdvancedAnalytics ? 'Hide' : 'Show'}</Button></span>} />
        {showAdvancedAnalytics && (
          <CardContent>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
              <div><b>Sharpe Ratio:</b> {sharpeRatio !== null ? sharpeRatio.toFixed(3) : 'N/A'}</div>
              <div><b>Max Drawdown:</b> {maxDrawdown !== null ? (maxDrawdown * 100).toFixed(2) + '%' : 'N/A'}</div>
              <div><b>Volatility:</b> {volatility !== null ? (volatility * 100).toFixed(2) + '%' : 'N/A'}</div>
            </div>
            {correlationMatrix && (
              <div style={{ marginTop: 24 }}>
                <b>Correlation Matrix (Watchlist):</b>
                <table style={{ borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th></th>
                      {correlationMatrix.symbols.map((sym: string) => <th key={sym}>{sym}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationMatrix.symbols.map((sym: string, i: number) => (
                      <tr key={sym}>
                        <td><b>{sym}</b></td>
                        {correlationMatrix.matrix[i].map((v: number, j: number) => <td key={j} style={{ padding: 4, textAlign: 'center', background: i === j ? '#e0e0e0' : '#fff' }}>{v.toFixed(2)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '2rem', background: '#fafcff', borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: 0.5 }}>Analytics Dashboard</h1>
        <IconButton aria-label="Show Help" onClick={() => setHelpOpen(true)} size="large">
          <HelpOutlineIcon fontSize="large" />
        </IconButton>
      </div>
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Welcome to the Analytics Dashboard</DialogTitle>
        <DialogContent>
          <ul style={{ fontSize: 16, lineHeight: 1.7 }}>
            <li><b>Visual Indicators:</b> Explore technical overlays, switch between stocks and crypto, and export data in multiple formats.</li>
            <li><b>Custom Notes:</b> Add, edit, and remove notes directly on the chart for your own insights.</li>
            <li><b>Dark Mode:</b> Toggle dark/light mode for comfortable viewing.</li>
            <li><b>Alerts:</b> Set price and indicator-based alerts, view and export alert history.</li>
            <li><b>Accessibility:</b> All controls are keyboard and screen reader accessible.</li>
            <li><b>Mobile Ready:</b> Use on any device with responsive layouts and touch-friendly controls.</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)} variant="contained" color="primary">Got it!</Button>
        </DialogActions>
      </Dialog>
      {loading && <div>Loading analytics...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {renderAlerts()}
      {coinSelection()}
      {selectedCoin && renderAdvancedAnalytics()}
      {selectedCoin && renderTabs()}
      {selectedCoin && analyticsTab === 'correlation' && (
        <Card style={{ margin: '2rem 0' }}>
          <CardHeader title={`${selectedCoin} — Sentiment vs. Price`} />
          <CardContent>
            {renderCorrelationChart(selectedCoin)}
          </CardContent>
        </Card>
      )}
      {selectedCoin && analyticsTab === 'projections' && (
        <Card style={{ margin: '2rem 0' }}>
          <CardHeader title={<span>{selectedCoin} — Advanced Sentiment Projections <select value={mlModel} onChange={e => setMlModel(e.target.value as any)} style={{ marginLeft: 12 }}><option value="prophet">Prophet</option><option value="arima">ARIMA</option><option value="lstm">LSTM</option></select> <button className="btn btn-secondary" onClick={() => runForecast(selectedCoin)} style={{ marginLeft: 8 }}>Run Forecast</button></span>} />
          <CardContent>
            {renderProjectionChart(selectedCoin)}
            {renderMLForecast()}
          </CardContent>
        </Card>
      )}
      {selectedCoin && analyticsTab === 'sources' && renderSourceDetails(selectedCoin)}
      {selectedCoin && analyticsTab === 'backtest' && (
        <Card style={{ margin: '2rem 0' }}>
          <CardHeader title={<span>{selectedCoin} — Backtesting <button className="btn btn-secondary" onClick={() => runBacktest(selectedCoin)} style={{ marginLeft: 12 }}>Run Backtest</button></span>} />
          <CardContent>
            {renderBacktest()}
          </CardContent>
        </Card>
      )}
      {renderTrending()}
      {renderLeaderboard()}
      {selectedCoin && renderSourceBreakdown(selectedCoin)}
      {renderNotificationSettings()}
      <PriceAlertsWidget notifSettings={notifSettings} />
      <AlertHistoryWidget />
      <AlertHistoryExport alertHistory={window.alertHistory || []} />
      <VisualIndicatorsWidget />
      <AlphaVantageWidget />
      <AlphaVantageChart />
      <CoinGeckoWidget />
      <CoinGeckoChart />
      <p style={{ color: '#888', fontSize: '0.95rem', marginTop: 24 }}>
        Analytics features: Sentiment vs. Price Correlation, Multiple Projection Models, Source Analytics (LunarCrush, CryptoPanic, Reddit, Twitter, StockTwits, Discord, Google Trends, On-chain), Alerts, Leaderboard, and more.
      </p>
    </div>
  );
};

export default AnalyticsDashboard;
