// Custom Premium Colors
const COLOR_GREEN = '#00ffa3';
const COLOR_RED = '#ff3366';
const COLOR_BLUE = '#00e5ff';
const COLOR_ORANGE = '#ffb000';
const COLOR_MUTED = '#8b8b9e';
const COLOR_BG_PANEL = 'rgba(25, 20, 45, 0.45)';
const COLOR_GRID = 'rgba(255,255,255,0.03)';

// Common Chart.js options
Chart.defaults.color = COLOR_MUTED;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.enabled = false;
Chart.defaults.plugins.legend.display = false;

const commonLineOptions = {
    responsive: true, maintainAspectRatio: false,
    elements: { point: { radius: 0, hitRadius: 10, hoverRadius: 4 }, line: { borderWidth: 1.5 } },
    scales: { x: { display: false }, y: { display: false } },
    layout: { padding: { top: 5, bottom: 5, left: 0, right: 0 } },
    plugins: { tooltip: { enabled: true, mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: COLOR_GREEN } },
    animation: false
};

function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

// ==========================================
// TECHNICAL ANALYSIS FUNCTIONS
// ==========================================
function calculateEMA(data, period) {
    if(data.length === 0) return [];
    let ema = Array(data.length).fill(data[0]);
    let k = 2 / (period + 1);
    for(let i=1; i<data.length; i++) ema[i] = data[i] * k + ema[i-1] * (1 - k);
    return ema;
}

function calculateRSI(data, period=14) {
    if (data.length <= period) return Array(data.length).fill(50);
    let rsi = Array(period).fill(50);
    let sumGain = 0, sumLoss = 0;
    for(let i=1; i<=period; i++) {
        let diff = data[i] - data[i-1];
        if (diff >= 0) sumGain += diff; else sumLoss -= diff;
    }
    let avgGain = sumGain / period;
    let avgLoss = sumLoss / period;
    rsi.push(100 - (100 / (1 + (avgLoss===0?100:avgGain/avgLoss))));
    
    for(let i=period+1; i<data.length; i++) {
        let diff = data[i] - data[i-1];
        let gain = diff >= 0 ? diff : 0;
        let loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
        let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
    }
    return rsi;
}

function calculateMACD(data) {
    let ema12 = calculateEMA(data, 12);
    let ema26 = calculateEMA(data, 26);
    let macd = ema12.map((v, i) => v - ema26[i]);
    let signal = calculateEMA(macd, 9);
    let hist = macd.map((v, i) => v - signal[i]);
    return { macd, signal, hist };
}

function calculateZigZag(data, lookback=3) {
    let result = Array(data.length).fill(null);
    let lastVal = data[0].close;
    for(let i=lookback; i<data.length-lookback; i++) {
        let isPeak = true, isTrough = true;
        for(let j=-lookback; j<=lookback; j++) {
            if(j===0) continue;
            if(data[i].high <= data[i+j].high) isPeak = false;
            if(data[i].low >= data[i+j].low) isTrough = false;
        }
        if(isPeak) { result[i] = data[i].high; lastVal = data[i].high; }
        else if(isTrough) { result[i] = data[i].low; lastVal = data[i].low; }
        else { result[i] = lastVal; } // Interpolate for chart display
    }
    return result;
}


// ==========================================
// 1. MAIN CHART & CVD (LIGHTWEIGHT CHARTS)
// ==========================================
const mainChartContainer = document.getElementById('mainChartContainer');
const mainChart = LightweightCharts.createChart(mainChartContainer, {
    layout: { background: { type: 'solid', color: 'transparent' }, textColor: COLOR_MUTED, fontFamily: "'JetBrains Mono', monospace" },
    grid: { vertLines: { color: COLOR_GRID }, horzLines: { color: COLOR_GRID } },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: COLOR_GRID },
    timeScale: { borderColor: COLOR_GRID, timeVisible: true }
});

const candleSeries = mainChart.addCandlestickSeries({
    upColor: COLOR_GREEN, downColor: COLOR_RED, borderDownColor: COLOR_RED, borderUpColor: COLOR_GREEN, wickDownColor: COLOR_RED, wickUpColor: COLOR_GREEN,
});

const volumeSeries = mainChart.addHistogramSeries({
    color: 'rgba(0, 255, 163, 0.2)', priceFormat: { type: 'volume' }, priceScaleId: '', scaleMargins: { top: 0.8, bottom: 0 },
});

const cvdChartContainer = document.getElementById('cvdChartContainer');
const cvdChart = LightweightCharts.createChart(cvdChartContainer, {
    layout: { background: { type: 'solid', color: 'transparent' }, textColor: COLOR_MUTED },
    grid: { vertLines: { visible: false }, horzLines: { color: COLOR_GRID } },
    rightPriceScale: { borderColor: 'transparent' },
    timeScale: { borderColor: 'transparent', visible: false }
});
const cvdSeries = cvdChart.addLineSeries({ color: COLOR_ORANGE, lineWidth: 2 });
mainChart.timeScale().subscribeVisibleTimeRangeChange(range => cvdChart.timeScale().setVisibleRange(range));

new ResizeObserver(() => {
    mainChart.applyOptions({ width: mainChartContainer.clientWidth, height: mainChartContainer.clientHeight });
    cvdChart.applyOptions({ width: cvdChartContainer.clientWidth, height: cvdChartContainer.clientHeight });
}).observe(mainChartContainer);


// ==========================================
// CHARTS INITIALIZATION (Chart.js)
// ==========================================
const ctxRegime = document.getElementById('regimeChart').getContext('2d');
new Chart(ctxRegime, { type: 'doughnut', data: { labels: ['BULL', 'ACC', 'DIST', 'BEAR', 'VOL'], datasets: [{ data: [0.28, 0.21, 0.17, 0.24, 0.10], backgroundColor: [COLOR_GREEN, COLOR_BLUE, COLOR_RED, COLOR_ORANGE, '#555566'], borderWidth: 1, borderColor: '#111' }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%' } });

const ctxElliott = document.getElementById('elliottChart').getContext('2d');
const elliottChartInstance = new Chart(ctxElliott, { type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: COLOR_BLUE, backgroundColor: createGradient(ctxElliott, 'rgba(0, 229, 255, 0.2)', 'rgba(0, 229, 255, 0)'), fill: true, tension: 0 }] }, options: { ...commonLineOptions, scales: { x: { display: true, grid: { display: false, drawBorder: false }, ticks: { display: false } }, y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });

const ctxWyckoff = document.getElementById('wyckoffChart').getContext('2d');
const wyckoffChartInstance = new Chart(ctxWyckoff, { type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: COLOR_ORANGE, backgroundColor: createGradient(ctxWyckoff, 'rgba(255, 176, 0, 0.2)', 'rgba(255, 176, 0, 0)'), fill: true, tension: 0.2 }] }, options: { ...commonLineOptions, scales: { y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });

const ctxRsi = document.getElementById('rsiChart').getContext('2d');
const rsiChartInstance = new Chart(ctxRsi, { type: 'line', data: { labels: [], datasets: [{ data: [], borderColor: '#b026ff', tension: 0.1, borderWidth: 1 }] }, options: commonLineOptions });

const ctxMacd = document.getElementById('macdChart').getContext('2d');
const macdChartInstance = new Chart(ctxMacd, { type: 'bar', data: { labels: [], datasets: [{ data: [], backgroundColor: ctx => ctx.raw > 0 ? COLOR_GREEN : COLOR_RED }] }, options: commonLineOptions });

// Liquidation Map Fake Background
const ctxHeatmap = document.getElementById('heatmapChart').getContext('2d');
const heatmapGradient = ctxHeatmap.createLinearGradient(0, 0, 0, 180);
heatmapGradient.addColorStop(0, 'rgba(255, 176, 0, 0.8)'); heatmapGradient.addColorStop(0.5, 'rgba(255, 51, 102, 0.6)'); heatmapGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
new Chart(ctxHeatmap, { type: 'bar', data: { labels: Array(80).fill(''), datasets: [{ data: Array.from({length: 80}, () => Math.random() * 100 + 20), backgroundColor: heatmapGradient, barPercentage: 1.0, categoryPercentage: 1.0 }] }, options: { ...commonLineOptions, indexAxis: 'y', scales: { x: { display: false }, y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });

// Live Liquidations Chart
const liqChartDataPos = Array(30).fill(0);
const liqChartDataNeg = Array(30).fill(0);
const liqChartInstance = new Chart(document.getElementById('liqChart'), { type: 'bar', data: { labels: Array(30).fill(''), datasets: [ { data: liqChartDataPos, backgroundColor: COLOR_GREEN, barPercentage: 0.8 }, { data: liqChartDataNeg, backgroundColor: COLOR_RED, barPercentage: 0.8 } ] }, options: { ...commonLineOptions, scales: { x: { stacked: true, display: false }, y: { stacked: true, display: false } }, animation: { duration: 200 } } });

const gaugeChartInstance = new Chart(document.getElementById('gaugeChart'), { type: 'doughnut', data: { labels: ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'], datasets: [{ data: [20, 20, 20, 20, 20], backgroundColor: [COLOR_RED, COLOR_ORANGE, '#555566', COLOR_GREEN, '#00b377'], borderWidth: 2, borderColor: '#111', circumference: 180, rotation: 270 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '80%' } });

// Position Chart
const posCtx = document.getElementById('positionChart');
const positionChartInstance = new Chart(posCtx, { type: 'pie', data: { datasets: [{ data: [1.5, 98.5], backgroundColor: [COLOR_GREEN, 'rgba(255,255,255,0.05)'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false } });

const equityData = [50000]; for(let i=1; i<100; i++) equityData.push(equityData[i-1] + (Math.random()-0.45)*500);
const ctxEquity = document.getElementById('equityChart').getContext('2d');
new Chart(ctxEquity, { type: 'line', data: { labels: Array(100).fill(''), datasets: [{ data: equityData, borderColor: COLOR_GREEN, backgroundColor: createGradient(ctxEquity, 'rgba(0, 255, 163, 0.3)', 'rgba(0, 255, 163, 0)'), fill: true, tension: 0.4 }] }, options: { ...commonLineOptions, scales: { y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });


// ==========================================
// BINANCE API & TA INTEGRATION
// ==========================================
const SYMBOL = 'BTCUSDT';
const INTERVAL = '15m'; 

let klinesHistory = [];

async function fetchHistoryAndCalculate() {
    try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&limit=300`);
        const data = await res.json();
        
        const klines = [];
        const volumes = [];
        const cvdData = [];
        let cumVolume = 0;
        let closePrices = [];

        data.forEach(d => {
            const time = d[0] / 1000;
            const open = parseFloat(d[1]);
            const high = parseFloat(d[2]);
            const low = parseFloat(d[3]);
            const close = parseFloat(d[4]);
            const vol = parseFloat(d[5]);
            const isGreen = close >= open;

            klinesHistory.push({ time, open, high, low, close });
            closePrices.push(close);
            
            klines.push({ time, open, high, low, close });
            volumes.push({ time, value: vol, color: isGreen ? 'rgba(0, 255, 163, 0.4)' : 'rgba(255, 51, 102, 0.4)' });
            
            const takerBuyBaseAssetVol = parseFloat(d[9]);
            cumVolume += (takerBuyBaseAssetVol - (vol - takerBuyBaseAssetVol));
            cvdData.push({ time, value: cumVolume });
        });

        candleSeries.setData(klines);
        volumeSeries.setData(volumes);
        cvdSeries.setData(cvdData);

        // Update TA Charts
        const rsiArray = calculateRSI(closePrices);
        const macdObj = calculateMACD(closePrices);
        const zigzag = calculateZigZag(klinesHistory);
        
        rsiChartInstance.data.labels = Array(rsiArray.length).fill('');
        rsiChartInstance.data.datasets[0].data = rsiArray;
        rsiChartInstance.update();

        macdChartInstance.data.labels = Array(macdObj.hist.length).fill('');
        macdChartInstance.data.datasets[0].data = macdObj.hist;
        macdChartInstance.update();

        elliottChartInstance.data.labels = Array(zigzag.length).fill('');
        elliottChartInstance.data.datasets[0].data = zigzag;
        elliottChartInstance.update();
        
        wyckoffChartInstance.data.labels = Array(closePrices.length).fill('');
        wyckoffChartInstance.data.datasets[0].data = closePrices;
        wyckoffChartInstance.update();

    } catch (e) {
        console.error("Error fetching historical data:", e);
    }
}

function connectLive() {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL.toLowerCase()}@kline_${INTERVAL}/${SYMBOL.toLowerCase()}@depth10@100ms`);
    
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        // KLINE UPDATE
        if (msg.e === 'kline') {
            const k = msg.k;
            const time = k.t / 1000;
            const open = parseFloat(k.o);
            const high = parseFloat(k.h);
            const low = parseFloat(k.l);
            const close = parseFloat(k.c);
            const vol = parseFloat(k.v);
            const isGreen = close >= open;
            
            candleSeries.update({ time, open, high, low, close });
            volumeSeries.update({ time, value: vol, color: isGreen ? 'rgba(0, 255, 163, 0.4)' : 'rgba(255, 51, 102, 0.4)' });

            document.querySelector('.ticker').innerHTML = `O ${open.toFixed(1)} H ${high.toFixed(1)} L ${low.toFixed(1)} <span class="${isGreen ? 'green' : 'red'} bold">C ${close.toFixed(1)}</span>`;
            
            // Auto update entry price for calculator if user hasn't typed
            if(document.activeElement.id !== 'calc-entry') {
                document.getElementById('calc-entry').value = close.toFixed(1);
                calculatePositionSize();
            }
        }
        
        // DEPTH UPDATE
        if (msg.lastUpdateId) { 
            const asks = msg.asks.slice(0, 5).reverse();
            const bids = msg.bids.slice(0, 5);
            const tbody = document.querySelector('.dom-table tbody');
            let html = '';
            for(let i=0; i<5; i++) {
                html += `<tr>
                    <td class="green">${parseFloat(bids[i][0]).toFixed(1)}</td>
                    <td class="green">${parseFloat(bids[i][1]).toFixed(3)}</td>
                    <td class="red">${parseFloat(asks[i][1]).toFixed(3)}</td>
                    <td class="red">${parseFloat(asks[i][0]).toFixed(1)}</td>
                </tr>`;
            }
            tbody.innerHTML = html;
        }
    };

    // LIQUIDATIONS WEBSOCKET
    const wsLiq = new WebSocket(`wss://fstream.binance.com/ws/btcusdt@forceOrder`);
    wsLiq.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if(msg.e === 'forceOrder') {
            const side = msg.o.S; // BUY or SELL
            const amount = parseFloat(msg.o.q);
            liqChartDataPos.shift();
            liqChartDataNeg.shift();
            
            if(side === 'SELL') {
                // Long liquidated (Sell order forced) -> RED
                liqChartDataPos.push(0);
                liqChartDataNeg.push(-amount);
                document.querySelector('.panel-9 .flex-between:nth-child(2) span:last-child').innerHTML = `<span style="animation: flashUpdate 1s;">$${(amount*parseFloat(msg.o.p)/1000).toFixed(1)}k</span>`;
            } else {
                // Short liquidated -> GREEN
                liqChartDataPos.push(amount);
                liqChartDataNeg.push(0);
                document.querySelector('.panel-9 .flex-between:nth-child(3) span:last-child').innerHTML = `<span style="animation: flashUpdate 1s;">$${(amount*parseFloat(msg.o.p)/1000).toFixed(1)}k</span>`;
            }
            liqChartInstance.update();
        }
    };
}

// ==========================================
// FEAR & GREED API
// ==========================================
async function fetchFearAndGreed() {
    try {
        const res = await fetch('https://api.alternative.me/fng/');
        const data = await res.json();
        const value = parseInt(data.data[0].value);
        const text = data.data[0].value_classification.toUpperCase();
        
        document.querySelector('.gauge-value').innerText = value;
        document.querySelector('.gauge-container div:last-child').innerText = text;
        
        // Gauge logic (0-100 mapped to the 5 slices)
        // Simplified: just update colors to highlight active
    } catch(e) { console.error("Error F&G", e); }
}

// ==========================================
// POSITION SIZING CALCULATOR
// ==========================================
function calculatePositionSize() {
    const equity = parseFloat(document.getElementById('calc-equity').value) || 0;
    const riskPct = parseFloat(document.getElementById('calc-risk').value) || 0;
    const entry = parseFloat(document.getElementById('calc-entry').value) || 0;
    const stop = parseFloat(document.getElementById('calc-stop').value) || 0;
    
    if(entry === 0 || stop === 0 || entry === stop) return;
    
    const riskAmount = equity * (riskPct / 100);
    const stopDistPct = Math.abs(entry - stop) / entry;
    const positionSize = riskAmount / stopDistPct;
    
    document.getElementById('calc-result').innerText = '$' + positionSize.toLocaleString(undefined, {maximumFractionDigits: 0});
    
    // Update Pie chart
    const leverage = positionSize / equity;
    positionChartInstance.data.datasets[0].data = [leverage, 1]; // Simplified
    positionChartInstance.update();
}

document.querySelectorAll('.interactive-input').forEach(input => {
    input.addEventListener('input', calculatePositionSize);
});


// Init
fetchHistoryAndCalculate().then(connectLive);
fetchFearAndGreed();
calculatePositionSize();
