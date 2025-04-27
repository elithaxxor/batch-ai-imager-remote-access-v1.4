# WSB-Trading Analytics Platform

## Features
- Institutional-grade analytics for stocks and crypto
- Real-time and historical data from Alpha Vantage, CoinGecko, and TradingView
- Machine learning models (Prophet, ARIMA, LSTM) for forecasting
- Automated price alerts (thresholds and advanced moving average cross)
- Multi-channel notifications (email, Discord, push, Slack, Telegram, SMS) — configurable per user or for all users
- Visual alert history and triggered events log
- Interactive dashboard: widgets and charts for all data sources

## Advanced Alerts
- **Price Threshold**: Get notified when price crosses above/below a set value
- **Moving Average Cross**: Get notified when a short MA crosses above/below a long MA (configurable)
- Alerts can be configured for stocks (Alpha Vantage) and crypto (CoinGecko)
- Alerts can notify all users or only the creator (configurable)

## Visual Alert History
- All triggered alerts are logged and can be viewed in the dashboard
- Alert history includes timestamp, asset, type, price, message, and notified users

## Multi-User & Notification Integration
- Notification settings are user-configurable
- Alerts can be set to notify all users or specific users
- Backend is structured for future expansion to persistent user management

## API Endpoints
- `/api/alphavantage` — Stock data
- `/api/coingecko` — Crypto data
- `/api/tradingview` — Charting & strategies
- `/api/price-alerts` — Manage price and MA cross alerts
- `/api/alert-history` — View and clear alert trigger history

## How to Use
1. Set up your API keys in the backend `.env`
2. Start both backend and frontend
3. Configure your notification settings in the dashboard
4. Add price or MA cross alerts for stocks or crypto
5. View alert history and receive notifications when alerts trigger

---

For more, see the code and widgets in `/client/src/` and `/server/src/`.
