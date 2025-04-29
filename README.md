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

## 🛠️ Backend Alert Logic & API

The backend price alert system is implemented in TypeScript with clear modularity and verbose documentation. See:
- `server/src/alerts/priceAlertScheduler.ts`: Main alert scheduler, polling, and notification logic. **Now includes verbose docstrings and comments for all alert types (price, MA cross, RSI, MACD, ADX, etc.)**
- `server/src/routes/price_alerts.ts`: Express API routes for CRUD, status, and testing of price alerts. **Now fully documented with endpoint docstrings and inline explanations.**

### Example: Adding an ADX Alert
```json
{
  "type": "adx",
  "symbol": "AAPL",
  "highs": [/* ... */],
  "lows": [/* ... */],
  "history": [/* closes ... */],
  "period": 14,
  "threshold": 25,
  "direction": "above",
  "notify": { "email": "user@example.com" }
}
```

### API Endpoints
- `GET /api/price-alerts` — List all alerts
- `GET /api/price-alerts/status` — Status for each alert (symbol, type, threshold, direction)
- `GET /api/price-alerts/history` — Recent alert events
- `POST /api/price-alerts` — Add a new alert (see above JSON)
- `DELETE /api/price-alerts/:idx` — Remove alert by index
- `POST /api/price-alerts/test/:idx` — Simulate/trigger alert for testing

### Alert Structure
See `server/src/alerts/priceAlertScheduler.ts` for the full `PriceAlert` and `User` interface documentation. All notification fields and supported indicators are described inline.

## 📝 Development Notes
- All backend alert logic is now **modular, extensible, and fully documented**.
- To add new indicators, extend the logic in `priceAlertScheduler.ts` and update the API route as needed.
- For advanced usage (multi-condition alerts, broadcast to all users, etc.), see the docstrings and comments in the scheduler file.

## 📚 Documentation
- All major backend modules and API endpoints now include verbose comments and docstrings for easy onboarding and extension.
- For roadmap, see `MEMORY[0fab6083-99d7-4a66-965a-ee955bbb8877]` (recommendations for indicators, modularity, and UI/UX).

## 🚀 Quickstart
1. `cd wsb-trading/server && npm install && npm start` (backend)
2. `cd wsb-trading/client && npm install && npm start` (frontend)
3. Use the API or UI to add, test, and monitor price alerts!

## 🔗 GitHub
For the latest code, issues, and documentation, visit:
https://github.com/YOUR_GITHUB_USERNAME/wsb-trading

---

*Last updated: 2025-04-29*

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
