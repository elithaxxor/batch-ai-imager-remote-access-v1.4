/**
 * Scheduler and logic for polling price alerts and sending notifications.
 * Includes advanced indicator alert logic (ADX, MA, RSI, MACD, etc.).
 *
 * Exports:
 *   - priceAlerts: The main array of active alerts.
 *   - addPriceAlert: Adds a new alert to the scheduler.
 *   - removePriceAlert: Removes an alert by index.
 *   - pollAndNotify: Main polling loop for evaluating alerts.
 *   - User, PriceAlert: TypeScript interfaces for alert/user structure.
 */

import axios from 'axios';
import fetch from 'node-fetch';
import { sendEmailNotification } from '../notifications/email';
import { sendDiscordNotification } from '../notifications/discord';
import { sendPushNotification } from '../notifications/push';
import { sendSlackNotification } from '../notifications/slack';
import { sendTelegramNotification } from '../notifications/telegram';
import { sendSMSNotification } from '../notifications/sms_twilio';
import { logAlertEvent } from './alertHistoryStore';
import { calculateRSI, detectVolumeSpike, calculateBollingerBands, calculateMACD, calculateStochastic, calculateATR, calculateCorrelation, calculateSharpeRatio, calculateADX } from './advancedIndicators';
import { broadcastAlertUpdate } from '../websocket';
import { getAlertEvents } from './alertHistoryStore';

/**
 * User notification preferences for alerts.
 */
export interface User {
  /**
   * Email address for notifications.
   */
  email?: string;
  /**
   * Discord webhook or user.
   */
  discord?: string;
  /**
   * Push notification endpoint.
   */
  push?: string;
  /**
   * Slack webhook or user.
   */
  slack?: string;
  /**
   * Telegram bot token.
   */
  telegramBotToken?: string;
  /**
   * Telegram chat ID.
   */
  telegramChatId?: string;
  /**
   * Twilio SMS SID.
   */
  smsSid?: string;
  /**
   * Twilio token.
   */
  smsToken?: string;
  /**
   * SMS sender.
   */
  smsFrom?: string;
  /**
   * SMS recipient.
   */
  smsTo?: string;
}

/**
 * Structure of a price alert, including all supported indicator types.
 */
export interface PriceAlert {
  /**
   * Alert type (price, ma_cross, rsi, macd, adx, etc.).
   */
  type: string;
  /**
   * Stock symbol.
   */
  symbol?: string;
  /**
   * Crypto asset ID.
   */
  id?: string;
  /**
   * Quote currency.
   */
  vs?: string;
  /**
   * Threshold value for triggering.
   */
  threshold?: number;
  /**
   * Direction (above, below, crosses_above, etc.).
   */
  direction?: string;
  /**
   * Historical price/indicator data.
   */
  history?: number[];
  /**
   * Volume data.
   */
  volumes?: number[];
  /**
   * Window size for indicators.
   */
  window?: number;
  /**
   * Short MA period.
   */
  short?: number;
  /**
   * Long MA period.
   */
  long?: number;
  /**
   * Last cross direction.
   */
  lastCross?: string;
  /**
   * Period for indicators (RSI, ADX, ATR, etc.).
   */
  period?: number;
  /**
   * Std dev for Bollinger Bands.
   */
  numStdDev?: number;
  /**
   * Fast EMA period (MACD).
   */
  fast?: number;
  /**
   * Slow EMA period (MACD).
   */
  slow?: number;
  /**
   * Signal line period (MACD).
   */
  signal?: number;
  /**
   * Stochastic K period.
   */
  smoothK?: number;
  /**
   * Stochastic D period.
   */
  smoothD?: number;
  /**
   * High prices for indicators.
   */
  highs?: number[];
  /**
   * Low prices for indicators.
   */
  lows?: number[];
  /**
   * For manual triggers.
   */
  triggerTimestamp?: number;
  /**
   * Whether this alert has been notified.
   */
  notified?: boolean;
  /**
   * Notification target(s).
   */
  notify: User | { allUsers: boolean };
  /**
   * For correlation.
   */
  historyA?: number[];
  /**
   * For correlation.
   */
  historyB?: number[];
  /**
   * For Sharpe ratio.
   */
  riskFreeRate?: number;
  /**
   * TradingView params.
   */
  tradingViewParams?: { interval?: string, exchange?: string };
}

/**
 * Main array of active price alerts.
 * Exported so that routes and polling logic are always in sync.
 */
export let priceAlerts: PriceAlert[] = [];

/**
 * All users in the system (for broadcast alerts).
 */
let allUsers: User[] = [];

/**
 * Set the list of all users (for broadcast notifications).
 * @param users List of users.
 */
export function setAllUsers(users: User[]) {
  allUsers = users;
}

/**
 * Add a new price alert to the scheduler.
 * @param alert PriceAlert to add.
 */
export function addPriceAlert(alert: PriceAlert) {
  priceAlerts.push(alert);
}

/**
 * Remove a price alert by index.
 * @param idx Index of the alert to remove.
 */
export function removePriceAlert(idx: number) {
  priceAlerts.splice(idx, 1);
}

/**
 * Polls all alerts, fetches prices, and evaluates all alert conditions.
 * Sends notifications if triggered. Runs on a fixed interval.
 */
async function pollAndNotify() {
  for (let idx = 0; idx < priceAlerts.length; idx++) {
    const alert = priceAlerts[idx];
    try {
      let price = null;
      // Try TradingView first for stocks
      if (alert.type === 'price' && alert.symbol) {
        price = await fetchTradingViewPrice(alert.symbol, alert.tradingViewParams);
      }
      // Fallback to existing logic if TradingView fails or for non-stock alerts
      if (price === null) {
        if (alert.type === 'stock') {
          // Alpha Vantage
          const { data } = await axios.get(`http://localhost:4000/api/alphavantage?function=GLOBAL_QUOTE&symbol=${alert.symbol}`);
          price = parseFloat(data['Global Quote']?.['05. price']);
        } else if (alert.type === 'crypto') {
          // CoinGecko
          const { data } = await axios.get(`http://localhost:4000/api/coingecko/simple/price?ids=${alert.id}&vs_currencies=${alert.vs}`);
          if (
            alert.id !== undefined &&
            alert.vs !== undefined &&
            data[alert.id] &&
            data[alert.id][alert.vs] !== undefined
          ) {
            price = data[alert.id][alert.vs];
          }
        }
      }
      if (price == null) continue;
      let triggered = false;
      // --- Alert Condition Logic ---
      // (Verbose comments for each alert type below)

      // Basic price alert: triggers when price crosses above/below threshold
      if ((alert.direction === 'above' || alert.direction === 'below') && typeof alert.threshold === 'number') {
        if (alert.direction === 'above' && price > alert.threshold) triggered = true;
        if (alert.direction === 'below' && price < alert.threshold) triggered = true;
      }
      // Moving Average Cross alert: triggers on MA cross events
      if (alert.type === 'ma_cross' && Array.isArray(alert.history) && typeof alert.short === 'number' && typeof alert.long === 'number') {
        const maShort = alert.history.slice(-alert.short).reduce((a: number, b: number) => a + b, 0) / alert.short;
        const maLong = alert.history.slice(-alert.long).reduce((a: number, b: number) => a + b, 0) / alert.long;
        if (alert.direction === 'crosses_above' && maShort > maLong && alert.lastCross !== 'above') {
          triggered = true;
          alert.lastCross = 'above';
        }
        if (alert.direction === 'crosses_below' && maShort < maLong && alert.lastCross !== 'below') {
          triggered = true;
          alert.lastCross = 'below';
        }
      }
      // RSI alert: triggers when RSI crosses threshold
      if (alert.type === 'rsi' && Array.isArray(alert.history) && typeof alert.period === 'number' && typeof alert.threshold === 'number') {
        const rsi = calculateRSI(alert.history, alert.period);
        if (rsi !== null) {
          if (alert.direction === 'above' && rsi > alert.threshold) triggered = true;
          if (alert.direction === 'below' && rsi < alert.threshold) triggered = true;
        }
      }
      // Volume Spike alert: triggers on abnormal volume
      if (alert.type === 'volume_spike' && Array.isArray(alert.volumes) && typeof alert.window === 'number' && typeof alert.threshold === 'number') {
        if (detectVolumeSpike(alert.volumes, alert.window, alert.threshold)) triggered = true;
      }
      // Bollinger Band alert: triggers on band cross
      if (alert.type === 'bollinger_band' && Array.isArray(alert.history) && typeof alert.window === 'number' && typeof alert.numStdDev === 'number') {
        const bands = calculateBollingerBands(alert.history, alert.window, alert.numStdDev);
        if (bands) {
          const last = alert.history[alert.history.length - 1];
          if (alert.direction === 'crosses_above_upper' && last > bands.upper) triggered = true;
          if (alert.direction === 'crosses_below_lower' && last < bands.lower) triggered = true;
        }
      }
      // MACD alert: triggers on MACD cross
      if (alert.type === 'macd' && Array.isArray(alert.history) && typeof alert.fast === 'number' && typeof alert.slow === 'number' && typeof alert.signal === 'number') {
        const macdObj = calculateMACD(alert.history, alert.fast, alert.slow, alert.signal);
        if (macdObj) {
          if (alert.direction === 'crosses_above' && macdObj.macd > macdObj.signal && (!alert.lastCross || alert.lastCross !== 'above')) {
            triggered = true;
            alert.lastCross = 'above';
          }
          if (alert.direction === 'crosses_below' && macdObj.macd < macdObj.signal && (!alert.lastCross || alert.lastCross !== 'below')) {
            triggered = true;
            alert.lastCross = 'below';
          }
        }
      }
      // Stochastic Oscillator alert: triggers on Stoch K crossing threshold
      if (alert.type === 'stochastic' && Array.isArray(alert.history) && Array.isArray(alert.highs) && Array.isArray(alert.lows) && typeof alert.window === 'number' && typeof alert.smoothK === 'number' && typeof alert.smoothD === 'number' && alert.highs.length === alert.history.length && alert.lows.length === alert.history.length) {
        const stoch = calculateStochastic(alert.history, alert.highs, alert.lows, alert.smoothK, alert.smoothD);
        if (stoch) {
          if (alert.direction === 'above' && typeof alert.threshold === 'number' && stoch.k > alert.threshold) triggered = true;
          if (alert.direction === 'below' && typeof alert.threshold === 'number' && stoch.k < alert.threshold) triggered = true;
        }
      }
      // ATR alert: triggers on ATR crossing threshold
      if (alert.type === 'atr' && Array.isArray(alert.history) && Array.isArray(alert.highs) && Array.isArray(alert.lows) && typeof alert.period === 'number' && alert.highs.length === alert.history.length && alert.lows.length === alert.history.length && typeof alert.threshold === 'number') {
        const atr = calculateATR(alert.highs, alert.lows, alert.history, alert.period);
        if (atr !== null) {
          if (alert.direction === 'above' && atr > alert.threshold) triggered = true;
          if (alert.direction === 'below' && atr < alert.threshold) triggered = true;
        }
      }
      // ADX alert: triggers on ADX crossing threshold
      if (alert.type === 'adx' && Array.isArray(alert.highs) && Array.isArray(alert.lows) && Array.isArray(alert.history) && typeof alert.period === 'number' && typeof alert.threshold === 'number') {
        const adxResult = calculateADX(alert.highs, alert.lows, alert.history, alert.period);
        if (adxResult) {
          if (alert.direction === 'above' && adxResult.adx > alert.threshold) triggered = true;
          if (alert.direction === 'below' && adxResult.adx < alert.threshold) triggered = true;
        }
      }
      // Manual/Custom Note alert: triggers at a specific timestamp
      if (alert.type === 'manual' && alert.triggerTimestamp && Date.now() >= alert.triggerTimestamp && !alert.notified) {
        triggered = true;
      }
      // Correlation alert: triggers on correlation crossing threshold
      if (alert.type === 'correlation' && Array.isArray(alert.historyA) && Array.isArray(alert.historyB) && typeof alert.window === 'number' && typeof alert.threshold === 'number') {
        const corr = calculateCorrelation(alert.historyA, alert.historyB, alert.window);
        if (corr !== null) {
          if (alert.direction === 'above' && corr > alert.threshold) triggered = true;
          if (alert.direction === 'below' && corr < alert.threshold) triggered = true;
        }
      }
      // Sharpe Ratio alert: triggers on Sharpe ratio crossing threshold
      if (alert.type === 'sharpe' && Array.isArray(alert.history) && typeof alert.riskFreeRate === 'number' && typeof alert.threshold === 'number') {
        const sharpe = calculateSharpeRatio(alert.history, alert.riskFreeRate);
        if (sharpe !== null) {
          if (alert.direction === 'above' && sharpe > alert.threshold) triggered = true;
          if (alert.direction === 'below' && sharpe < alert.threshold) triggered = true;
        }
      }
      // --- End of alert logic ---

      // Track status for API
      alertStatus.lastKnownPrices[idx] = price;
      alertStatus.lastTriggered[idx] = triggered;
      if (triggered && !alert.notified) {
        const msg = `${alert.type === 'stock' ? alert.symbol : alert.id} price is ${price} (${alert.direction} ${alert.threshold || ''})`;
        // Send notifications to all users if alert.notify has allUsers true
        let notifiedUsers: string[] = [];
        let targets: User[] = [];
        if (typeof alert.notify === 'object' && 'allUsers' in alert.notify && alert.notify.allUsers) {
          targets = allUsers;
        } else if (typeof alert.notify === 'object') {
          targets = [alert.notify as User];
        }
        for (const notify of targets) {
          if (notify.email) { await sendEmailNotification(notify.email, 'Price Alert', msg); notifiedUsers.push(notify.email); }
          if (notify.discord) { await sendDiscordNotification(notify.discord, msg); notifiedUsers.push(notify.discord); }
          if (notify.push) { await sendPushNotification(notify.push, msg); notifiedUsers.push(notify.push); }
          if (notify.slack) { await sendSlackNotification(notify.slack, msg); notifiedUsers.push(notify.slack); }
          if (notify.telegramBotToken && notify.telegramChatId) { await sendTelegramNotification(notify.telegramBotToken, notify.telegramChatId, msg); notifiedUsers.push(notify.telegramChatId); }
          if (notify.smsSid && notify.smsToken && notify.smsFrom && notify.smsTo) { await sendSMSNotification(notify.smsSid, notify.smsToken, notify.smsFrom, notify.smsTo, msg); notifiedUsers.push(notify.smsTo); }
        }
        logAlertEvent({ timestamp: Date.now(), alert, price, message: msg, notifiedUsers });
        alert.notified = true;
      }
      if (!triggered) alert.notified = false;
    } catch (e) {
      console.error('Error in pollAndNotify:', e);
    }
  }
  // Optionally broadcast updates to clients
  broadcastAlertUpdate({ alertStatus, alertHistory: getAlertEvents(10) });
  setTimeout(pollAndNotify, INTERVAL);
}

// Polling interval in ms
const INTERVAL = 60 * 1000;

/**
 * Exported alert status object for API routes.
 */
export const alertStatus: {
  lastKnownPrices: { [idx: number]: number | null },
  lastTriggered: { [idx: number]: boolean }
} = {
  lastKnownPrices: {},
  lastTriggered: {}
};

/**
 * Fetch price from TradingView REST endpoint with custom params.
 * Used as primary price source for stocks.
 * @param symbol Stock symbol.
 * @param params TradingView params.
 */
async function fetchTradingViewPrice(symbol: string, params?: { interval?: string, exchange?: string }): Promise<number | null> {
  try {
    const url = new URL('http://localhost:8000/api/tradingview/market-data');
    url.searchParams.set('symbol', symbol);
    if (params?.interval) url.searchParams.set('interval', params.interval);
    if (params?.exchange) url.searchParams.set('exchange', params.exchange);
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const data = await resp.json();
    // Adjust this depending on your TradingView proxy response
    if (typeof data.price === 'number') return data.price;
    if (data.result && typeof data.result.price === 'number') return data.result.price;
    if (data.c && Array.isArray(data.c) && data.c.length) return data.c[data.c.length - 1];
    return null;
  } catch (e) {
    return null;
  }
}

// Start polling loop
pollAndNotify();
