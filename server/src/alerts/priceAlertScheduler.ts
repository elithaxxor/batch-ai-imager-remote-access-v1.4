import axios from 'axios';
import { sendEmailNotification } from '../notifications/email';
import { sendDiscordNotification } from '../notifications/discord';
import { sendPushNotification } from '../notifications/push';
import { sendSlackNotification } from '../notifications/slack';
import { sendTelegramNotification } from '../notifications/telegram';
import { sendSMSNotification } from '../notifications/sms_twilio';
import { logAlertEvent } from './alertHistoryStore';
import { calculateRSI, detectVolumeSpike, calculateBollingerBands, calculateMACD } from './advancedIndicators';

// This would be loaded from a database in production
let priceAlerts: any[] = [];

// In production, this would be a User DB
let allUsers: any[] = [];
export function setAllUsers(users: any[]) {
  allUsers = users;
}

export function addPriceAlert(alert: any) {
  priceAlerts.push(alert);
}

export function removePriceAlert(idx: number) {
  priceAlerts.splice(idx, 1);
}

// Polling interval in ms
const INTERVAL = 60 * 1000;

async function pollAndNotify() {
  for (const alert of priceAlerts) {
    try {
      let price = null;
      if (alert.type === 'stock') {
        // Alpha Vantage
        const { data } = await axios.get(`http://localhost:4000/api/alphavantage?function=GLOBAL_QUOTE&symbol=${alert.symbol}`);
        price = parseFloat(data['Global Quote']?.['05. price']);
      } else if (alert.type === 'crypto') {
        // CoinGecko
        const { data } = await axios.get(`http://localhost:4000/api/coingecko/simple/price?ids=${alert.id}&vs_currencies=${alert.vs}`);
        price = data[alert.id]?.[alert.vs];
      }
      if (price == null) continue;
      let triggered = false;
      if (alert.direction === 'above' && price > alert.threshold) triggered = true;
      if (alert.direction === 'below' && price < alert.threshold) triggered = true;
      // Advanced: Moving Average Cross
      if (alert.type === 'ma_cross' && Array.isArray(alert.history)) {
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
      // Advanced: RSI Alert
      if (alert.type === 'rsi' && Array.isArray(alert.history)) {
        const rsi = calculateRSI(alert.history, alert.period);
        if (rsi !== null) {
          if (alert.direction === 'above' && rsi > alert.threshold) triggered = true;
          if (alert.direction === 'below' && rsi < alert.threshold) triggered = true;
        }
      }
      // Advanced: Volume Spike
      if (alert.type === 'volume_spike' && Array.isArray(alert.volumes)) {
        if (detectVolumeSpike(alert.volumes, alert.window, alert.threshold)) triggered = true;
      }
      // Advanced: Bollinger Bands
      if (alert.type === 'bollinger_band' && Array.isArray(alert.history)) {
        const bands = calculateBollingerBands(alert.history, alert.window, alert.numStdDev);
        if (bands) {
          if (alert.direction === 'crosses_above_upper' && alert.history[alert.history.length - 1] > bands.upper) triggered = true;
          if (alert.direction === 'crosses_below_lower' && alert.history[alert.history.length - 1] < bands.lower) triggered = true;
        }
      }
      // Advanced: MACD
      if (alert.type === 'macd' && Array.isArray(alert.history)) {
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
      if (triggered && !alert.notified) {
        const msg = `${alert.type === 'stock' ? alert.symbol : alert.id} price is ${price} (${alert.direction} ${alert.threshold || ''})`;
        // Send notifications to all users if alert.notify.allUsers is true
        let notifiedUsers: string[] = [];
        const targets = alert.notify.allUsers ? allUsers : [alert.notify];
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
      // Reset notification if price goes back
      if (!triggered) alert.notified = false;
    } catch (e) {
      // Ignore errors for now
    }
  }
  setTimeout(pollAndNotify, INTERVAL);
}

// Start polling
pollAndNotify();
