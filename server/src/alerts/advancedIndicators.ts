// Utility functions for advanced indicators

// RSI (Relative Strength Index)
export function calculateRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (gains + losses === 0) return 50;
  const rs = gains / (losses || 1e-10);
  return 100 - 100 / (1 + rs);
}

// Volume Spike (percent increase over average)
export function detectVolumeSpike(volumes: number[], window: number = 20, threshold: number = 2): boolean {
  if (volumes.length < window + 1) return false;
  const avg = volumes.slice(-window-1, -1).reduce((a, b) => a + b, 0) / window;
  return volumes[volumes.length - 1] > avg * threshold;
}

// Bollinger Bands
export function calculateBollingerBands(closes: number[], window: number = 20, numStdDev: number = 2): { upper: number, middle: number, lower: number } | null {
  if (closes.length < window) return null;
  const recent = closes.slice(-window);
  const mean = recent.reduce((a, b) => a + b, 0) / window;
  const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window;
  const stdDev = Math.sqrt(variance);
  return {
    upper: mean + numStdDev * stdDev,
    middle: mean,
    lower: mean - numStdDev * stdDev
  };
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(closes: number[], fast: number = 12, slow: number = 26, signal: number = 9): { macd: number, signal: number, histogram: number } | null {
  if (closes.length < slow + signal) return null;
  function ema(period: number, arr: number[]) {
    const k = 2 / (period + 1);
    let emaPrev = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < arr.length; i++) {
      emaPrev = arr[i] * k + emaPrev * (1 - k);
    }
    return emaPrev;
  }
  const fastEma = ema(fast, closes);
  const slowEma = ema(slow, closes);
  const macd = fastEma - slowEma;
  const macdArr = closes.slice(-slow - signal + 1).map((_, i, arr) => {
    const fastEma = ema(fast, arr.slice(i));
    const slowEma = ema(slow, arr.slice(i));
    return fastEma - slowEma;
  });
  const signalLine = ema(signal, macdArr);
  return {
    macd,
    signal: signalLine,
    histogram: macd - signalLine
  };
}

// Stochastic Oscillator
export function calculateStochastic(closes: number[], highs: number[], lows: number[], kPeriod: number = 14, dPeriod: number = 3): { k: number, d: number } | null {
  if (closes.length < kPeriod || highs.length < kPeriod || lows.length < kPeriod) return null;
  const recentCloses = closes.slice(-kPeriod);
  const recentHighs = highs.slice(-kPeriod);
  const recentLows = lows.slice(-kPeriod);
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  const k = 100 * (recentCloses[recentCloses.length - 1] - lowestLow) / (highestHigh - lowestLow);
  // D is the SMA of last dPeriod K values
  const kValues = [];
  for (let i = closes.length - kPeriod - dPeriod + 1; i <= closes.length - kPeriod; i++) {
    const subCloses = closes.slice(i, i + kPeriod);
    const subHighs = highs.slice(i, i + kPeriod);
    const subLows = lows.slice(i, i + kPeriod);
    const high = Math.max(...subHighs);
    const low = Math.min(...subLows);
    kValues.push(100 * (subCloses[subCloses.length - 1] - low) / (high - low));
  }
  const d = kValues.reduce((a, b) => a + b, 0) / dPeriod;
  return { k, d };
}

// ATR (Average True Range)
export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number | null {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) return null;
  let trs: number[] = [];
  for (let i = highs.length - period; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  return trs.reduce((a, b) => a + b, 0) / period;
}

// Correlation (Pearson correlation coefficient)
export function calculateCorrelation(seriesA: number[], seriesB: number[], window: number = 20): number | null {
  if (seriesA.length < window || seriesB.length < window) return null;
  const a = seriesA.slice(-window);
  const b = seriesB.slice(-window);
  const meanA = a.reduce((x, y) => x + y, 0) / window;
  const meanB = b.reduce((x, y) => x + y, 0) / window;
  let num = 0, denomA = 0, denomB = 0;
  for (let i = 0; i < window; i++) {
    num += (a[i] - meanA) * (b[i] - meanB);
    denomA += (a[i] - meanA) ** 2;
    denomB += (b[i] - meanB) ** 2;
  }
  if (denomA === 0 || denomB === 0) return null;
  return num / Math.sqrt(denomA * denomB);
}

// Sharpe Ratio
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number | null {
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const excessReturns = returns.map(r => r - riskFreeRate);
  const meanExcess = excessReturns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(excessReturns.reduce((a, b) => a + (b - meanExcess) ** 2, 0) / (returns.length - 1));
  if (stdDev === 0) return null;
  return meanExcess / stdDev;
}
