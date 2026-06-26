<p align="center">
  <img src="logo.png" alt="Bitcoin Dashboard Logo" width="300">
</p>

<h1 align="center">Bitcoin Algorithmic Trading Dashboard 🚀</h1>

<p align="center">
  <strong>A Real-Time, Client-Side Trading Terminal built with Vanilla JavaScript</strong><br>
  <em>Cyberpunk Aesthetic | Sub-second WebSockets | Zero Backend</em>
</p>

<p align="center">
  <a href="https://karidasd.github.io/bitcoin-dashboard/"><b>🌐 VIEW LIVE DASHBOARD HERE</b></a>
</p>

---

## 📖 Project Overview

This project was developed as a **Master Plan Proof-of-Concept** to demonstrate how modern browsers can handle heavy financial data aggregation, mathematical computations, and real-time WebSocket streaming entirely on the client side. 

By eliminating the need for a backend server or database, this dashboard runs 100% locally in the browser and can be hosted for free on GitHub Pages. It integrates concepts from **ICT (Inner Circle Trader)**, **Wyckoff Theory**, **Elliott Waves**, and **Orderflow / Liquidity Analysis**.

---

## ⚡ Core Features

### 📡 Real-Time Data Streams (Binance API)
- **Zero-Latency Data**: Direct connection to Binance Futures API (`fapi.binance.com`) and WebSockets (`fstream.binance.com`).
- **Live DOM (Depth of Market)**: 100ms real-time updates of the top orderbook bids and asks.
- **Liquidations Tracker**: Listens to the `@forceOrder` stream to instantly visualize when over-leveraged long or short positions are liquidated.

### 🧮 Client-Side Technical Analysis (TA)
- **Algorithmic Indicators**: RSI, MACD, and Stochastic oscillators are calculated purely in JavaScript using the latest 300 15m Klines.
- **ZigZag / Market Structure**: A custom client-side ZigZag algorithm maps out local Highs and Lows to simulate Elliott Wave counts and Wyckoff Schematics.
- **Fear & Greed Index**: Dynamically fetches daily crypto market sentiment from the public `alternative.me` API.

### 🛡️ Interactive Risk Management
- **Position Sizing Calculator**: An interactive panel where traders can input their Account Equity, Risk Percentage, Entry, and Stop Loss. The JavaScript engine instantly calculates the exact USDT position size and leverage ratio required to maintain strict risk parameters.
- **Portfolio Metrics**: Visualizes Drawdown, Value at Risk (VaR), and Sharpe Ratios.

### 🎨 Cyberpunk UI / UX
- **Glassmorphism Design**: Custom CSS gradients, neon accents (Green/Red/Orange), and animated backgrounds.
- **Responsive Grid**: Built with CSS Grid `minmax` functions and flexbox to ensure the layout adapts to smaller laptop screens with proper scrollable overflow limits.

---

## ⚠️ Architectural Constraints & Educational Limitations

This project is an **Educational Sandbox** and explicitly highlights the trade-offs between Client-Side Architectures and traditional Backend deployments.

### Why not Streamlit or Python?
During development, deploying this as a Python **Streamlit** app was considered to enable real Machine Learning models (LSTMs, XGBoost, HMM). However, it was rejected in favor of a Static Frontend for the following reasons:
1. **WebSocket Freezing**: Streamlit is synchronous and reruns the entire script on every state change. Handling a 100ms Binance WebSocket stream causes severe UI lag, memory leaks, and crashing.
2. **"Sleep" Mode & Resource Limits**: Free cloud tiers (like Streamlit Community Cloud) provide limited RAM (1GB) and put apps to "sleep" after inactivity. A trading terminal must be instant.
3. **UI Rigidity**: Streamlit's UI is grid-locked. Achieving our absolute-positioned, dense Cyberpunk Grid layout is natively supported via CSS, whereas Streamlit components are highly rigid.

### The Trade-off (What is Fake/Simulated?)
Because there is no Python Backend running continuously, **Machine Learning inference is impossible on the client side**. 
- The **Market Regime Detection (HMM)** and **Machine Learning Models** (LSTM, XGBoost) panels display **simulated/static visual approximations**. They are UI placeholders demonstrating *where* backend model outputs would theoretically feed into the dashboard.

---

## 🚨 DISCLAIMER & RISK WARNING (NOT FINANCIAL ADVICE)

**FOR EDUCATIONAL AND RESEARCH PURPOSES ONLY.**

This dashboard is a programming demonstration. It is **NOT** a financial tool, **NOT** trading advice, and **NOT** a recommendation to buy or sell any asset.

- **High Risk**: Trading cryptocurrencies, especially Perpetual Futures with leverage, involves an extremely high level of risk and may not be suitable for all investors. You can lose your entire capital.
- **Bugs and Latency**: This dashboard runs locally in your browser. API rate limits, browser memory limits, or network latency can cause the data shown to be delayed, inaccurate, or completely wrong.
- **No Liability**: The creator of this code accepts absolutely no liability for any financial losses, data inaccuracies, or bugs. **Never make financial decisions based on a JavaScript web application.**

---

## 🛠️ Technology Stack

- **Frontend Core**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Charting Libraries**: 
  - [Lightweight Charts (TradingView)](https://tradingview.github.io/lightweight-charts/) (v4.1.1) for high-performance candlestick rendering.
  - [Chart.js](https://www.chartjs.org/) (v4.4.1) for analytical graphs, liquidation bars, and gauge charts.
- **Deployment**: GitHub Pages (100% Serverless).

---

## 🚀 How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/karidasd/bitcoin-dashboard.git
   ```
2. Open `index.html` in any modern web browser (Chrome, Edge, Brave, Firefox).
3. **No build steps, no npm install, no backend server required!**
