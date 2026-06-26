// Custom Premium Colors
const COLOR_GREEN = '#00ffa3';
const COLOR_RED = '#ff3366';
const COLOR_BLUE = '#00e5ff';
const COLOR_ORANGE = '#ffb000';
const COLOR_MUTED = '#8b8b9e';
const COLOR_BG_PANEL = 'rgba(15, 15, 20, 0.65)';
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
    plugins: { tooltip: { enabled: true, mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: COLOR_GREEN } }
};

function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
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
// BINANCE API INTEGRATION (LIVE DATA)
// ==========================================
const SYMBOL = 'BTCUSDT';
const INTERVAL = '15m'; // using 15m for more action

// 1. Fetch Historical Data
async function fetchHistory() {
    try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&limit=500`);
        const data = await res.json();
        
        const klines = [];
        const volumes = [];
        const cvdData = [];
        let cumVolume = 0;

        data.forEach(d => {
            const time = d[0] / 1000;
            const open = parseFloat(d[1]);
            const high = parseFloat(d[2]);
            const low = parseFloat(d[3]);
            const close = parseFloat(d[4]);
            const vol = parseFloat(d[5]);
            const isGreen = close >= open;

            klines.push({ time, open, high, low, close });
            volumes.push({ time, value: vol, color: isGreen ? 'rgba(0, 255, 163, 0.4)' : 'rgba(255, 51, 102, 0.4)' });
            
            // Fake CVD calculation (Delta = Buy Vol - Sell Vol roughly)
            const takerBuyBaseAssetVol = parseFloat(d[9]);
            const sellVol = vol - takerBuyBaseAssetVol;
            const delta = takerBuyBaseAssetVol - sellVol;
            cumVolume += delta;
            cvdData.push({ time, value: cumVolume });
        });

        candleSeries.setData(klines);
        volumeSeries.setData(volumes);
        cvdSeries.setData(cvdData);
    } catch (e) {
        console.error("Error fetching historical data:", e);
    }
}

// 2. Connect WebSockets for Live Updates
function connectLive() {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL.toLowerCase()}@kline_${INTERVAL}/${SYMBOL.toLowerCase()}@depth10@100ms`);
    
    let lastCVD = cvdSeries.data().length > 0 ? cvdSeries.data()[cvdSeries.data().length-1].value : 0;

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

            // Update Header Ticker
            document.querySelector('.ticker').innerHTML = `O ${open.toFixed(1)} H ${high.toFixed(1)} L ${low.toFixed(1)} <span class="${isGreen ? 'green' : 'red'} bold">C ${close.toFixed(1)}</span>`;

            // Update CVD live (approx)
            if (k.x) { // if candle closed, reset base or add proper delta logic, for simplicity we skip exact live tick CVD here
            }
        }
        
        // DEPTH UPDATE (ORDERBOOK)
        if (msg.lastUpdateId) { 
            const asks = msg.asks.slice(0, 5).reverse(); // Top 5 asks
            const bids = msg.bids.slice(0, 5); // Top 5 bids
            
            const tbody = document.querySelector('.dom-table tbody');
            let html = '';
            
            // We alternate showing rows. The image has Bids and Asks side by side, let's format it.
            for(let i=0; i<5; i++) {
                const bidPrice = parseFloat(bids[i][0]).toFixed(1);
                const bidSize = parseFloat(bids[i][1]).toFixed(3);
                const askPrice = parseFloat(asks[i][0]).toFixed(1);
                const askSize = parseFloat(asks[i][1]).toFixed(3);
                
                html += `<tr>
                    <td class="green">${bidPrice}</td>
                    <td class="green">${bidSize}</td>
                    <td class="red">${askSize}</td>
                    <td class="red">${askPrice}</td>
                </tr>`;
            }
            tbody.innerHTML = html;
        }
    };
}

fetchHistory().then(connectLive);


// ==========================================
// MOCK DATA FOR THE REST OF THE PANELS
// ==========================================

// --- Panel 2: Regime Chart ---
const ctxRegime = document.getElementById('regimeChart').getContext('2d');
new Chart(ctxRegime, { type: 'doughnut', data: { labels: ['BULL', 'ACC', 'DIST', 'BEAR', 'VOL'], datasets: [{ data: [0.28, 0.21, 0.17, 0.24, 0.10], backgroundColor: [COLOR_GREEN, COLOR_BLUE, COLOR_RED, COLOR_ORANGE, '#555566'], borderWidth: 2, borderColor: '#050508' }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%' } });

// --- Panel 4: Elliott Chart ---
const elliottData = [10, 8, 15, 12, 22, 16, 28, 20, 35, 25, 45];
const ctxElliott = document.getElementById('elliottChart').getContext('2d');
new Chart(ctxElliott, { type: 'line', data: { labels: Array(11).fill(''), datasets: [{ data: elliottData, borderColor: COLOR_BLUE, backgroundColor: createGradient(ctxElliott, 'rgba(0, 229, 255, 0.2)', 'rgba(0, 229, 255, 0)'), fill: true, tension: 0.3 }] }, options: { ...commonLineOptions, scales: { x: { display: true, grid: { display: false, drawBorder: false }, ticks: { display: false } }, y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });

// --- Panel 5: Wyckoff Chart ---
const wyckoffData = [20, 15, 18, 10, 22, 25, 18, 30, 28, 35, 32, 40, 20, 15];
const ctxWyckoff = document.getElementById('wyckoffChart').getContext('2d');
new Chart(ctxWyckoff, { type: 'line', data: { labels: Array(wyckoffData.length).fill(''), datasets: [{ data: wyckoffData, borderColor: COLOR_ORANGE, backgroundColor: createGradient(ctxWyckoff, 'rgba(255, 176, 0, 0.2)', 'rgba(255, 176, 0, 0)'), fill: true, tension: 0.4 }] }, options: { ...commonLineOptions, scales: { y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });

// --- Panel 8: Heatmap (Density Simulation) ---
const ctxHeatmap = document.getElementById('heatmapChart').getContext('2d');
const heatmapGradient = ctxHeatmap.createLinearGradient(0, 0, 0, 180);
heatmapGradient.addColorStop(0, 'rgba(255, 176, 0, 0.8)');
heatmapGradient.addColorStop(0.5, 'rgba(255, 51, 102, 0.6)');
heatmapGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
new Chart(ctxHeatmap, { type: 'bar', data: { labels: Array(80).fill(''), datasets: [{ data: Array.from({length: 80}, () => Math.random() * 100 + 20), backgroundColor: heatmapGradient, barPercentage: 1.0, categoryPercentage: 1.0 }] }, options: { ...commonLineOptions, indexAxis: 'y', scales: { x: { display: false }, y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });

// --- Panel 9: Liquidations Chart ---
new Chart(document.getElementById('liqChart'), { type: 'bar', data: { labels: Array(30).fill(''), datasets: [ { data: Array.from({length: 30}, () => Math.random() * 10), backgroundColor: COLOR_GREEN, barPercentage: 0.8 }, { data: Array.from({length: 30}, () => -Math.random() * 12), backgroundColor: COLOR_RED, barPercentage: 0.8 } ] }, options: { ...commonLineOptions, scales: { x: { stacked: true, display: false }, y: { stacked: true, display: false } } } });

// --- Panel 10: Gauge Chart ---
new Chart(document.getElementById('gaugeChart'), { type: 'doughnut', data: { labels: ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'], datasets: [{ data: [20, 20, 20, 20, 20], backgroundColor: [COLOR_RED, COLOR_ORANGE, '#555566', COLOR_GREEN, '#00b377'], borderWidth: 2, borderColor: '#050508', circumference: 180, rotation: 270 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '80%' } });

// --- Panel 12: Oscillators ---
const makeOscData = () => Array.from({length: 80}, () => Math.random() * 100);
new Chart(document.getElementById('rsiChart').getContext('2d'), { type: 'line', data: { labels: Array(80).fill(''), datasets: [{ data: makeOscData(), borderColor: '#b026ff', tension: 0.3, borderWidth: 1 }] }, options: commonLineOptions });
new Chart(document.getElementById('macdChart').getContext('2d'), { type: 'bar', data: { labels: Array(80).fill(''), datasets: [{ data: Array.from({length: 80}, () => (Math.random()-0.5)*10), backgroundColor: ctx => ctx.raw > 0 ? COLOR_GREEN : COLOR_RED }] }, options: commonLineOptions });
new Chart(document.getElementById('stochChart').getContext('2d'), { type: 'line', data: { labels: Array(80).fill(''), datasets: [{ data: makeOscData(), borderColor: COLOR_BLUE, tension: 0.3, borderWidth: 1 }, { data: makeOscData(), borderColor: COLOR_ORANGE, tension: 0.3, borderWidth: 1 }] }, options: commonLineOptions });

// --- Panel 16: Position Chart ---
new Chart(document.getElementById('positionChart'), { type: 'pie', data: { datasets: [{ data: [1.5, 98.5], backgroundColor: [COLOR_GREEN, '#222233'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false } });

// --- Panel 19: Equity Chart ---
const equityData = [50000];
for(let i=1; i<100; i++) equityData.push(equityData[i-1] + (Math.random()-0.45)*500);
const ctxEquity = document.getElementById('equityChart').getContext('2d');
new Chart(ctxEquity, { type: 'line', data: { labels: Array(100).fill(''), datasets: [{ data: equityData, borderColor: COLOR_GREEN, backgroundColor: createGradient(ctxEquity, 'rgba(0, 255, 163, 0.3)', 'rgba(0, 255, 163, 0)'), fill: true, tension: 0.4 }] }, options: { ...commonLineOptions, scales: { y: { display: true, position: 'right', grid: { color: COLOR_GRID } } } } });
