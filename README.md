<p align="center">
  <img src="logo.png" alt="Bitcoin Dashboard Logo" width="300">
</p>

# Bitcoin Algorithmic Trading Dashboard 🚀

A real-time, client-side only Bitcoin Trading Dashboard built exclusively with HTML, CSS, and vanilla JavaScript. Designed with a premium **Cyberpunk / Glassmorphism** aesthetic.

This project was built for **educational purposes** to demonstrate how to aggregate real-time financial data, technical analysis algorithms, and risk management calculators directly in the browser, without relying on any backend server.

## 🎯 Features

- **Real-Time Data Integration**: Directly connects to Binance Spot & Futures APIs (`fapi.binance.com` & `fstream.binance.com`).
- **Live Orderbook & Liquidations**: Uses WebSockets to stream the top of the DOM (Depth of Market) and live futures liquidations.
- **Client-Side Technical Analysis**: Calculates RSI, MACD, and Exponential Moving Averages (EMA) locally in JavaScript based on the latest 300 15m klines.
- **Market Structure Simulator**: Includes a custom ZigZag algorithm to map out local highs and lows, visualizing Elliott Waves and Wyckoff Schematics.
- **Fear & Greed Index**: Fetches the daily sentiment from the `alternative.me` public API.
- **Interactive Risk Management**: A dynamic Position Sizing Calculator that adjusts required capital based on user-defined Risk % and Stop Loss distances.
- **Responsive Layout**: Fluid CSS Grid that adapts and provides scrollbars for smaller screens.

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Charting Libraries**: 
  - [Lightweight Charts (TradingView)](https://tradingview.github.io/lightweight-charts/) for high-performance candlestick and volume rendering.
  - [Chart.js](https://www.chartjs.org/) for oscillators, liquidation bars, and gauge charts.

## ⚠️ Architectural Constraints & Decisions

During development, we explored the possibility of deploying this as a Python **Streamlit** app to enable real Machine Learning models (LSTMs, XGBoost, HMM). However, we deliberately chose to keep it a **Static Frontend Site (GitHub Pages)** due to the following strict constraints:

1. **Sub-second WebSocket Performance**: Streamlit executes its entire Python script from top to bottom on every state change. Handling a 100ms WebSocket stream (like Binance's orderbook) would cause severe UI lag or crashing. A static JS frontend handles this effortlessly.
2. **Memory & "Sleep" Limitations**: Free cloud tiers (like Streamlit Community Cloud) provide ~1GB RAM and put apps to "sleep" after inactivity. Waking the app and loading heavy ML models would destroy the "instant" UX of a trading terminal.
3. **Pixel-Perfect UI Control**: Achieving the complex, absolute-positioned, dense Cyberpunk Grid layout is natively supported via CSS Grid, whereas Streamlit's UI components are highly rigid.
4. **100% Free Hosting**: By relying solely on client-side JS to do the heavy lifting (math calculations, API fetching), the entire dashboard can be hosted for free forever on GitHub Pages.

*Note: The "Machine Learning Models" panel currently displays simulated/static predictions for visual representation, as running deep learning inference purely on the client side without a backend was out of scope.*

## 🚀 How to Run

1. Clone the repository.
2. Open `index.html` in any modern web browser.
3. No build steps, no npm install, no backend server required!

---
*Disclaimer: This dashboard is purely for educational purposes and is not financial advice.*
