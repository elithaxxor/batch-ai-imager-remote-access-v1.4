import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Checkbox, FormControlLabel, FormGroup, MenuItem, Select, Switch } from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { useTheme, ThemeProvider, createTheme } from '@mui/material/styles';
import 'chartjs-plugin-annotation';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

declare global {
  interface Window {
    alertHistory?: any[];
  }
}

export default function VisualIndicatorsWidget() {
  const [symbol, setSymbol] = useState('IBM');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [overlays, setOverlays] = useState<{
    sma20: boolean;
    bollinger: boolean;
    rsi: boolean;
    macd: boolean;
    stochastic: boolean;
    atr: boolean;
    ema50: boolean;
    ema200: boolean;
    vwma: boolean;
    adx: boolean;
  }>({
    sma20: true,
    bollinger: true,
    rsi: true,
    macd: false,
    stochastic: false,
    atr: false,
    ema50: false,
    ema200: false,
    vwma: false,
    adx: false
  });
  const [assetType, setAssetType] = useState<'stock' | 'crypto'>('stock');
  const [cryptoId, setCryptoId] = useState('bitcoin');
  const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);

  // Persist overlay and asset settings
  useEffect(() => {
    const overlaysSaved = localStorage.getItem('overlays');
    const assetTypeSaved = localStorage.getItem('assetType');
    const symbolSaved = localStorage.getItem('symbol');
    const cryptoIdSaved = localStorage.getItem('cryptoId');
    if (overlaysSaved) setOverlays(JSON.parse(overlaysSaved));
    if (assetTypeSaved === 'stock' || assetTypeSaved === 'crypto') setAssetType(assetTypeSaved);
    if (symbolSaved) setSymbol(symbolSaved);
    if (cryptoIdSaved) setCryptoId(cryptoIdSaved);
  }, []);
  useEffect(() => {
    localStorage.setItem('overlays', JSON.stringify(overlays));
    localStorage.setItem('assetType', assetType);
    localStorage.setItem('symbol', symbol);
    localStorage.setItem('cryptoId', cryptoId);
  }, [overlays, assetType, symbol, cryptoId]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? stored === 'true' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: darkMode ? '#90caf9' : '#1976d2' },
      secondary: { main: darkMode ? '#f48fb1' : '#d81b60' },
      background: {
        default: darkMode ? '#181a20' : '#f6f8fa',
        paper: darkMode ? '#23272f' : '#fff'
      },
    },
    shape: { borderRadius: 14 },
    typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif', fontWeightRegular: 500 }
  });
  useEffect(() => { localStorage.setItem('darkMode', darkMode ? 'true' : 'false'); }, [darkMode]);

  async function fetchData() {
    setLoading(true);
    setData(null);
    if (assetType === 'stock') {
      const resp = await axios.get(`/api/alphavantage?function=TIME_SERIES_DAILY&symbol=${symbol}`);
      setData(resp.data);
    } else {
      const resp = await axios.get(`/api/coingecko/coins/${cryptoId}/market_chart?vs_currency=usd&days=90`);
      setData({ prices: resp.data.prices });
    }
    setLoading(false);
  }

  let chartData: any = null;
  let alertMarkers: { [key: string]: any } = {};
  let overlayOptions = [
    { key: 'sma20', label: 'SMA 20', color: '#ff9800' },
    { key: 'bollinger', label: 'Bollinger Bands', color: '#43a047' },
    { key: 'rsi', label: 'RSI 14', color: '#8e24aa' },
    { key: 'macd', label: 'MACD', color: '#1976d2' },
    { key: 'stochastic', label: 'Stochastic K', color: '#d81b60' },
    { key: 'atr', label: 'ATR 14', color: '#00838f' },
    { key: 'ema50', label: 'EMA 50', color: '#6d4c41' },
    { key: 'ema200', label: 'EMA 200', color: '#3949ab' },
    { key: 'vwma', label: 'VWMA 20', color: '#009688' },
    { key: 'adx', label: 'ADX', color: '#9e9e9e' }
  ];

  if (data && ((assetType === 'stock' && data['Time Series (Daily)']) || (assetType === 'crypto' && data.prices))) {
    let dates: any, closes: any;
    if (assetType === 'stock') {
      dates = Object.keys(data['Time Series (Daily)']).reverse();
      closes = dates.map((date: any) => parseFloat(data['Time Series (Daily)'][date]['4. close']));
    } else {
      dates = data.prices.map((p: any) => new Date(p[0]).toLocaleDateString());
      closes = data.prices.map((p: any) => p[1]);
    }
    // SMA 20
    const sma20 = overlays.sma20 ? closes.map((_: number, i: number, arr: number[]) => i >= 19 ? arr.slice(i-19,i+1).reduce((a: number, b: number) => a + b, 0) / 20 : null) : undefined;
    // Bollinger Bands
    const bb = overlays.bollinger ? closes.map((_: number, i: number, arr: number[]) => {
      if (i < 19) return { upper: null, middle: null, lower: null };
      const window = arr.slice(i-19, i+1);
      const mean = window.reduce((a: number, b: number) => a + b, 0) / 20;
      const std = Math.sqrt(window.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / 20);
      return {
        upper: mean + 2 * std,
        middle: mean,
        lower: mean - 2 * std
      };
    }) : undefined;
    // RSI 14
    const rsi14 = overlays.rsi ? closes.map((_: number, i: number, arr: number[]) => {
      if (i < 14) return null;
      let gains = 0, losses = 0;
      for (let j = i - 13; j <= i; j++) {
        const diff = arr[j] - arr[j - 1];
        if (diff > 0) gains += diff; else losses -= diff;
      }
      if (gains + losses === 0) return 50;
      const rs = gains / (losses || 1e-10);
      return 100 - 100 / (1 + rs);
    }) : undefined;
    // MACD
    const macd = overlays.macd ? (() => {
      function ema(period: number, arr: number[]) {
        const k = 2 / (period + 1);
        let emaPrev = arr.slice(0, period).reduce((a: number, b: number) => a + b, 0) / period;
        for (let i = period; i < arr.length; i++) {
          emaPrev = arr[i] * k + emaPrev * (1 - k);
        }
        return emaPrev;
      }
      return closes.map((_: number, i: number, arr: number[]) => {
        if (i < 34) return null;
        const fastEma = ema(12, arr.slice(i - 33, i + 1));
        const slowEma = ema(26, arr.slice(i - 33, i + 1));
        const macdVal = fastEma - slowEma;
        const macdArr = arr.slice(i - 33, i + 1).map((_: number, j: number, sub: number[]) => {
          const f = ema(12, sub.slice(j));
          const s = ema(26, sub.slice(j));
          return f - s;
        });
        const signal = ema(9, macdArr);
        return macdVal - signal;
      });
    })() : undefined;
    // Stochastic K
    const stochastic = overlays.stochastic ? closes.map((_: number, i: number, arr: number[]) => {
      if (i < 14) return null;
      const window = arr.slice(i - 13, i + 1);
      const high = Math.max(...window);
      const low = Math.min(...window);
      return 100 * (arr[i] - low) / (high - low);
    }) : undefined;
    // ATR 14
    const atr = overlays.atr && assetType === 'stock' ? closes.map((_: number, i: number, arr: number[]) => {
      if (i < 14) return null;
      let trSum = 0;
      for (let j = i - 13; j <= i; j++) {
        trSum += Math.abs(arr[j] - arr[j - 1]);
      }
      return trSum / 14;
    }) : undefined;
    // EMA 50
    const ema50 = overlays.ema50 ? closes.map((_: number, i: number, arr: number[]) => {
      if (i < 49) return null;
      const k = 2 / (50 + 1);
      let emaPrev = arr.slice(i-49,i+1).reduce((a: number, b: number) => a + b, 0) / 50;
      for (let j = i-48; j <= i; j++) {
        emaPrev = arr[j] * k + emaPrev * (1 - k);
      }
      return emaPrev;
    }) : undefined;
    // EMA 200
    const ema200 = overlays.ema200 ? closes.map((_: number, i: number, arr: number[]) => {
      if (i < 199) return null;
      const k = 2 / (200 + 1);
      let emaPrev = arr.slice(i-199,i+1).reduce((a: number, b: number) => a + b, 0) / 200;
      for (let j = i-198; j <= i; j++) {
        emaPrev = arr[j] * k + emaPrev * (1 - k);
      }
      return emaPrev;
    }) : undefined;
    // VWMA 20
    const vwma = overlays.vwma && assetType === 'stock' ? (() => {
      if (!data['Time Series (Daily)']) return undefined;
      const volumes = Object.keys(data['Time Series (Daily)']).reverse().map(date => parseFloat(data['Time Series (Daily)'][date]['5. volume']));
      return closes.map((_: number, i: number, arr: number[]) => {
        if (i < 19) return null;
        const priceVol = arr.slice(i-19,i+1).reduce((sum: number, _, idx: number) => sum + arr[i-19+idx] * volumes[i-19+idx], 0);
        const volSum = volumes.slice(i-19,i+1).reduce((a: number, b: number) => a + b, 0);
        return priceVol / volSum;
      });
    })() : undefined;
    // ADX
    const adxData = overlays.adx ? closes.map((_: number, i: number, arr: number[]) => {
      if (i < 14) return null;
      const highs = data.highs ? data.highs.slice(i - 13, i + 1) : arr.slice(i - 13, i + 1);
      const lows = data.lows ? data.lows.slice(i - 13, i + 1) : arr.slice(i - 13, i + 1);
      const closesSlice = arr.slice(i - 13, i + 1);
      // Use a simple ADX calculation for demo; replace with backend call for accuracy
      let trs = [], plusDMs = [], minusDMs = [];
      for (let j = 1; j < highs.length; j++) {
        const upMove = highs[j] - highs[j - 1];
        const downMove = lows[j - 1] - lows[j];
        plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
        minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
        trs.push(Math.max(highs[j] - lows[j], Math.abs(highs[j] - closesSlice[j - 1]), Math.abs(lows[j] - closesSlice[j - 1])));
      }
      const trSum = trs.reduce((a, b) => a + b, 0);
      const plusDMSum = plusDMs.reduce((a, b) => a + b, 0);
      const minusDMSum = minusDMs.reduce((a, b) => a + b, 0);
      const plusDI = 100 * (plusDMSum / trSum);
      const minusDI = 100 * (minusDMSum / trSum);
      const dx = 100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI);
      return dx;
    }) : undefined;
    chartData = {
      labels: dates,
      datasets: [
        {
          label: assetType === 'stock' ? `${symbol} Close Price` : `${cryptoId} Price`,
          data: closes,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          pointRadius: 0,
        },
        ...(overlays.sma20 ? [{ label: 'SMA 20', data: sma20, borderColor: '#ff9800', borderDash: [5, 5], pointRadius: 0 }] : []),
        ...(overlays.bollinger ? [
          { label: 'BB Upper', data: bb!.map((b: any) => b.upper), borderColor: '#43a047', borderDash: [2, 2], pointRadius: 0 },
          { label: 'BB Lower', data: bb!.map((b: any) => b.lower), borderColor: '#e53935', borderDash: [2, 2], pointRadius: 0 }
        ] : []),
        ...(overlays.rsi ? [{ label: 'RSI 14', data: rsi14, borderColor: '#8e24aa', yAxisID: 'rsi', pointRadius: 0 }] : []),
        ...(overlays.macd ? [{ label: 'MACD', data: macd, borderColor: '#1976d2', yAxisID: 'macd', pointRadius: 0 }] : []),
        ...(overlays.stochastic ? [{ label: 'Stochastic K', data: stochastic, borderColor: '#d81b60', yAxisID: 'stochastic', pointRadius: 0 }] : []),
        ...(overlays.atr ? [{ label: 'ATR 14', data: atr, borderColor: '#00838f', yAxisID: 'atr', pointRadius: 0 }] : []),
        ...(overlays.ema50 ? [{ label: 'EMA 50', data: ema50, borderColor: '#6d4c41', borderDash: [4,2], pointRadius: 0 }] : []),
        ...(overlays.ema200 ? [{ label: 'EMA 200', data: ema200, borderColor: '#3949ab', borderDash: [8,2], pointRadius: 0 }] : []),
        ...(overlays.vwma ? [{ label: 'VWMA 20', data: vwma, borderColor: '#009688', borderDash: [2,8], pointRadius: 0, hidden: assetType !== 'stock' }] : []),
        ...(overlays.adx ? [{ label: 'ADX', data: adxData, borderColor: '#9e9e9e', yAxisID: 'y2', pointRadius: 0, borderWidth: 2, spanGaps: true, type: 'line', hidden: false }] : [])
      ]
    };

    // Add vertical lines and marker annotations for alert triggers
    alertMarkers = {};
    if (window.alertHistory && Array.isArray(window.alertHistory)) {
      window.alertHistory.filter((a: any) => a.symbol === (assetType === 'stock' ? symbol : cryptoId)).forEach((a: any, i: number) => {
        const idx = dates.indexOf(a.date);
        if (idx !== -1) {
          alertMarkers[`alert-line-${i}`] = {
            type: 'line',
            xMin: dates[idx],
            xMax: dates[idx],
            borderColor: a.type === 'price' ? '#ff9800' : '#d81b60',
            borderWidth: 2,
            label: {
              content: a.type === 'price' ? 'Price Alert' : 'Sentiment Alert',
              enabled: true,
              position: 'start',
              color: '#fff',
              backgroundColor: a.type === 'price' ? '#ff9800' : '#d81b60',
              font: { weight: 'bold', size: 10 }
            }
          };
          alertMarkers[`alert-point-${i}`] = {
            type: 'point',
            xValue: dates[idx],
            yValue: closes[idx],
            backgroundColor: a.type === 'price' ? '#ff9800' : '#d81b60',
            radius: 6,
            borderColor: '#fff',
            borderWidth: 2,
            label: {
              content: `${a.price}`,
              enabled: true,
              position: 'center',
              color: '#fff',
              backgroundColor: a.type === 'price' ? '#ff9800' : '#d81b60',
              font: { weight: 'bold', size: 10 }
            }
          };
        }
      });
    }
  }

  const [customNotes, setCustomNotes] = useState<{ x: string, y: number, text: string }[]>(() => {
    const saved = localStorage.getItem('customNotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [noteDialog, setNoteDialog] = useState<{ open: boolean, x: string, y: number } | null>(null);
  const [noteText, setNoteText] = useState('');
  useEffect(() => { localStorage.setItem('customNotes', JSON.stringify(customNotes)); }, [customNotes]);

  return (
    <ThemeProvider theme={theme}>
      <Card style={{ margin: '24px 0', boxShadow: darkMode ? '0 2px 16px #0006' : '0 2px 12px #0002', borderRadius: 14, padding: 8, background: darkMode ? '#23272f' : '#fff', color: darkMode ? '#eee' : undefined }}>
        <CardHeader title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 0 }}>
          <span>Visual Technical Indicators</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Switch checked={darkMode} onChange={e => setDarkMode(e.target.checked)} size="small" color="primary" />
            <span style={{ fontSize: 13 }}>{darkMode ? 'Dark' : 'Light'} Mode</span>
          </span>
        </div>} style={{ textAlign: 'center', paddingBottom: 0, background: 'none' }} />
        <CardContent>
          <FormGroup row style={{ marginBottom: 12 }}>
            <FormControlLabel control={<Checkbox checked={assetType === 'stock'} onChange={() => setAssetType('stock')} />} label="Stock" />
            <FormControlLabel control={<Checkbox checked={assetType === 'crypto'} onChange={() => setAssetType('crypto')} />} label="Crypto" />
            {assetType === 'stock' ? (
              <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Symbol (e.g., IBM)" />
            ) : (
              <Select value={cryptoId} onChange={e => setCryptoId(e.target.value)} size="small" style={{ minWidth: 120 }}>
                <MenuItem value="bitcoin">bitcoin</MenuItem>
                <MenuItem value="ethereum">ethereum</MenuItem>
                <MenuItem value="dogecoin">dogecoin</MenuItem>
                <MenuItem value="solana">solana</MenuItem>
                <MenuItem value="cardano">cardano</MenuItem>
                <MenuItem value="ripple">ripple</MenuItem>
                <MenuItem value="litecoin">litecoin</MenuItem>
                <MenuItem value="polkadot">polkadot</MenuItem>
                <MenuItem value="tron">tron</MenuItem>
                <MenuItem value="avalanche-2">avalanche</MenuItem>
                <MenuItem value="uniswap">uniswap</MenuItem>
                <MenuItem value="chainlink">chainlink</MenuItem>
              </Select>
            )}
            <Button onClick={fetchData} disabled={loading} variant="contained">Show Indicators</Button>
          </FormGroup>
          <FormGroup row style={{ marginBottom: 16 }}>
            {overlayOptions.map(opt => (
              <FormControlLabel key={opt.key} control={<Checkbox checked={overlays[opt.key as keyof typeof overlays]} onChange={() => setOverlays(o => ({ ...o, [opt.key]: !o[opt.key as keyof typeof overlays] }))} sx={{ color: darkMode ? '#90caf9' : undefined }} />} label={opt.label} />
            ))}
          </FormGroup>
          <div ref={setChartRef} style={{ marginTop: 20, background: darkMode ? '#181a20' : '#fff', borderRadius: 10, boxShadow: darkMode ? '0 1px 8px #0008' : '0 1px 4px #0001', padding: 8, position: 'relative' }}>
            <Tooltip title="Add custom note" placement="left">
              <IconButton aria-label="Add custom note" size="small" style={{ position: 'absolute', right: 12, top: 12, zIndex: 2, background: darkMode ? '#23272f' : '#fff' }} onClick={() => setNoteDialog({ open: true, x: '', y: 0 })}>
                <NoteAddIcon color={darkMode ? 'primary' : 'secondary'} />
              </IconButton>
            </Tooltip>
            {chartData && (
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true, labels: { color: darkMode ? '#eee' : '#222' } },
                    annotation: {
                      annotations: { ...alertMarkers,
                        ...customNotes.reduce((acc, note, idx) => {
                          acc[`note-${idx}`] = {
                            type: 'label',
                            xValue: note.x,
                            yValue: note.y,
                            backgroundColor: darkMode ? '#23272f' : '#fff',
                            borderColor: darkMode ? '#90caf9' : '#1976d2',
                            borderWidth: 2,
                            color: darkMode ? '#90caf9' : '#1976d2',
                            font: { weight: 'bold', size: 12 },
                            content: note.text,
                            padding: 6,
                            cornerRadius: 6,
                            position: 'center'
                          };
                          return acc;
                        }, {} as any)
                      }
                    }
                  },
                  scales: {
                    x: { ticks: { color: darkMode ? '#bbb' : '#222' }, grid: { color: darkMode ? '#333' : '#eee' } },
                    y: { beginAtZero: false, ticks: { color: darkMode ? '#bbb' : '#222' }, grid: { color: darkMode ? '#333' : '#eee' } },
                    rsi: {
                      position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false, color: darkMode ? '#333' : '#eee' }, title: { display: true, text: 'RSI', color: darkMode ? '#90caf9' : '#8e24aa' }, ticks: { color: darkMode ? '#90caf9' : '#8e24aa' }
                    },
                    macd: {
                      position: 'right', grid: { drawOnChartArea: false, color: darkMode ? '#333' : '#eee' }, title: { display: true, text: 'MACD', color: darkMode ? '#90caf9' : '#1976d2' }, ticks: { color: darkMode ? '#90caf9' : '#1976d2' }
                    },
                    stochastic: {
                      position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false, color: darkMode ? '#333' : '#eee' }, title: { display: true, text: 'Stochastic K', color: darkMode ? '#f48fb1' : '#d81b60' }, ticks: { color: darkMode ? '#f48fb1' : '#d81b60' }
                    },
                    atr: {
                      position: 'right', grid: { drawOnChartArea: false, color: darkMode ? '#333' : '#eee' }, title: { display: true, text: 'ATR', color: darkMode ? '#b2dfdb' : '#00838f' }, ticks: { color: darkMode ? '#b2dfdb' : '#00838f' }
                    },
                    y2: {
                      position: 'right', grid: { drawOnChartArea: false, color: darkMode ? '#333' : '#eee' }, title: { display: true, text: 'ADX', color: darkMode ? '#9e9e9e' : '#9e9e9e' }, ticks: { color: darkMode ? '#9e9e9e' : '#9e9e9e' }
                    }
                  },
                  onClick: (e: any, elements: any, chart: any) => {
                    if (!chartData) return;
                    const chartInstance = chart.chart;
                    const xScale = chartInstance.scales.x;
                    const yScale = chartInstance.scales.y;
                    const xValue = xScale.getValueForPixel(e.x);
                    const yValue = yScale.getValueForPixel(e.y);
                    if (xValue && yValue) {
                      setNoteDialog({ open: true, x: xValue, y: yValue });
                    }
                  }
                }}
              />
            )}
            <Dialog open={!!noteDialog?.open} onClose={() => setNoteDialog(null)}>
              <DialogTitle>Add Custom Note</DialogTitle>
              <DialogContent>
                <TextField autoFocus fullWidth label="Note text" value={noteText} onChange={e => setNoteText(e.target.value)} multiline minRows={2} />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setNoteDialog(null)}>Cancel</Button>
                <Button disabled={!noteText.trim()} onClick={() => {
                  if (noteDialog && noteText.trim()) {
                    setCustomNotes(notes => [...notes, { x: noteDialog.x, y: noteDialog.y, text: noteText }]);
                    setNoteText('');
                    setNoteDialog(null);
                  }
                }}>Add Note</Button>
              </DialogActions>
            </Dialog>
            {/* List and edit/remove custom notes */}
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              {customNotes.length > 0 && <b>Custom Notes:</b>}
              {customNotes.map((note, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0', background: darkMode ? '#23272f' : '#f6f8fa', borderRadius: 8, padding: 4 }}>
                  <span style={{ flex: 1, wordBreak: 'break-all' }}>{note.text} <span style={{ fontSize: 12, color: '#888' }}>[{note.x}, {note.y}]</span></span>
                  <Button variant="outlined" size="small" color="primary" aria-label="Edit Note" onClick={() => { setNoteDialog({ open: true, x: note.x, y: note.y }); setNoteText(note.text); }}>Edit</Button>
                  <Button variant="outlined" size="small" color="error" aria-label="Remove Note" onClick={() => setCustomNotes(notes => notes.filter((_, j) => j !== idx))}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, margin: '24px 0 8px 0' }}>
            <Button style={{ marginRight: 8 }} onClick={() => {
              if (!chartData) return;
              const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${assetType === 'stock' ? symbol : cryptoId}_indicators.json`;
              a.click();
              URL.revokeObjectURL(url);
            }} variant="outlined">Export Indicator Data</Button>
            <Button style={{ marginRight: 8 }} onClick={() => {
              if (!chartData) return;
              // CSV export
              const rows: string[] = [];
              const labels = chartData.labels as string[];
              const datasets = chartData.datasets;
              // CSV header
              rows.push(['Date', ...datasets.map((d: any) => d.label)].join(','));
              for (let i = 0; i < labels.length; ++i) {
                const row = [labels[i], ...datasets.map((d: any) => d.data[i] ?? '')];
                rows.push(row.join(','));
              }
              const csv = rows.join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              saveAs(blob, `${assetType === 'stock' ? symbol : cryptoId}_indicators.csv`);
            }} variant="outlined">Export Indicator Data (CSV)</Button>
            <Button style={{ marginRight: 8 }} onClick={async () => {
              if (!chartRef) return;
              const element = chartRef;
              const canvas = await html2canvas(element);
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              pdf.save(`${assetType === 'stock' ? symbol : cryptoId}_chart.pdf`);
            }} variant="outlined">Export Chart as PDF</Button>
          </div>
        </CardContent>
      </Card>
    </ThemeProvider>
  );
}
