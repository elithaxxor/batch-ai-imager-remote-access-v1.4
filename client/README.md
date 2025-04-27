# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Features

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

## Recent Updates (2025-04-27)

- Fixed all TypeScript build errors and warnings for production.
- Improved type safety for chart and overlay data.
- Added explicit types for chart data and alert markers.
- Enhanced alert markers logic for chart annotations.
- Updated dependencies including `chartjs-plugin-annotation`.
- Improved documentation for build and deployment.

See `CHANGELOG.md` for full update history.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
