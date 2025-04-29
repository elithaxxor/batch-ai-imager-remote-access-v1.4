# WSB Trading Analytics Dashboard

## Overview

WSB Trading is a full-stack analytics dashboard for stocks and cryptocurrencies, designed for advanced retail traders and hobbyists. It provides deep analytics, real-time alerts, and multi-channel notifications, empowering users to make informed decisions based on technical indicators, projections, and sentiment data.

## Purpose

The goal of this project is to offer a highly interactive, extensible, and user-friendly platform for:
- Monitoring real-time and historical prices of stocks and crypto assets
- Receiving automated alerts for price, technical indicator events, and sentiment shifts
- Visualizing advanced analytics (Sharpe Ratio, Max Drawdown, Volatility, Correlation Matrix)
- Comparing projection models (Prophet, ARIMA, LSTM)
- Managing and exporting alert history and notes
- Integrating with popular notification channels (Email, Discord, Slack, Push, Telegram, SMS)

## How It Works

- **Frontend:** Built with React and TypeScript, the client provides an interactive dashboard for displaying charts, managing alerts, and configuring analytics. Users can set custom alerts, view technical overlays, and annotate charts.
- **Backend:** A Node.js/Express server manages alert scheduling, price polling, and notification dispatch. Alerts are evaluated in real-time, and triggered events are logged for audit and export.
- **Alert System:** Users can set up alerts for price movements, technical indicator crossings (MA, RSI, MACD, etc.), and sentiment changes. Alerts are evaluated against live price feeds and technical calculations.
- **Notification Channels:** The system supports multiple notification channels, allowing users to receive alerts via their preferred platform.
- **Extensibility:** The architecture is modular, making it easy to add new analytics, indicators, or notification integrations.

## Key Features

- Interactive analytics dashboard for stocks and crypto
- Advanced analytics: Sharpe Ratio, Max Drawdown, Volatility, Correlation Matrix
- Multiple projection models (Prophet, ARIMA, LSTM)
- Visual technical indicators and overlays
- Custom notes, export, and PDF/chart download
- Automated price/sentiment/indicator alerts (Price, MA Cross, RSI, Volume Spike, Bollinger Bands, MACD)
- Alert history and export
- Multi-channel notification support (Email, Discord, Slack, Push, Telegram, SMS)
- Accessibility, dark mode, and mobile support
- Help overlay and onboarding

## Build & Deployment

To build the app for production:

```sh
npm run build
```

The output will be in the `build` folder. To serve the production build locally:

```sh
npm install -g serve
serve -s build
```

The app will be available at [http://localhost:5000](http://localhost:5000) by default.

## Rooms for Improvement

- **Persistence:** Currently, some alert and price data may be stored in-memory for demonstration. A production deployment should use a robust database (e.g., PostgreSQL, MongoDB) for persistence and scalability.
- **Authentication:** User authentication and role-based access control can be added to support multi-user environments.
- **Backtesting:** Adding historical backtesting for alerts and strategies would enhance analytics.
- **More Integrations:** Additional notification channels and brokerage APIs can be integrated.
- **UI/UX:** Further improvements to onboarding, accessibility, and mobile responsiveness are possible.
- **Performance:** Optimizations for large-scale data and real-time updates can be explored.

## Recent Updates (2025-04-29)

- Improved PriceAlertsWidget:
  - Added error and success user feedback for alert actions (add, remove, test).
  - Reset alert input state after adding to prevent stale data.
  - Disabled Add Alert and Test Alert buttons while loading.
  - Added error handling for all API calls for reliability.
- Expanded README with detailed project overview, purpose, architecture, and improvement roadmap.
- Added section on rooms for improvement.
- See `CHANGELOG.md` for full update history.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
