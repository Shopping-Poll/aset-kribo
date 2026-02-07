// Konfigurasi untuk Binance API
const CONFIG = {
    updateInterval: 10000, // 10 detik untuk real-time
    defaultCurrency: 'IDR',
    defaultFiat: 'IDR',
    useWebSocket: true // Gunakan WebSocket untuk real-time
};

// Data cryptocurrency yang akan di-track
const CRYPTO_LIST = [
    { symbol: 'BTC', name: 'Bitcoin', binanceSymbol: 'BTCIDR', cmcId: 1 },
    { symbol: 'ETH', name: 'Ethereum', binanceSymbol: 'ETHIDR', cmcId: 1027 },
    { symbol: 'BNB', name: 'Binance Coin', binanceSymbol: 'BNBIDR', cmcId: 1839 },
    { symbol: 'SOL', name: 'Solana', binanceSymbol: 'SOLIDR', cmcId: 5426 },
    { symbol: 'XRP', name: 'Ripple', binanceSymbol: 'XRPIDR', cmcId: 52 },
    { symbol: 'ADA', name: 'Cardano', binanceSymbol: 'ADAIDR', cmcId: 2010 },
    { symbol: 'DOGE', name: 'Dogecoin', binanceSymbol: 'DOGEIDR', cmcId: 74 },
    { symbol: 'DOT', name: 'Polkadot', binanceSymbol: 'DOTIDR', cmcId: 6636 },
    { symbol: 'MATIC', name: 'Polygon', binanceSymbol: 'MATICIDR', cmcId: 3890 },
    { symbol: 'AVAX', name: 'Avalanche', binanceSymbol: 'AVAXIDR', cmcId: 5805 },
    { symbol: 'LTC', name: 'Litecoin', binanceSymbol: 'LTCIDR', cmcId: 2 },
    { symbol: 'LINK', name: 'Chainlink', binanceSymbol: 'LINKIDR', cmcId: 1975 },
    { symbol: 'UNI', name: 'Uniswap', binanceSymbol: 'UNIIDR', cmcId: 7083 },
    { symbol: 'SHIB', name: 'Shiba Inu', binanceSymbol: 'SHIBIDR', cmcId: 5994 },
    { symbol: 'TRX', name: 'TRON', binanceSymbol: 'TRXIDR', cmcId: 1958 },
    { symbol: 'ATOM', name: 'Cosmos', binanceSymbol: 'ATOMIDR', cmcId: 3794 },
    { symbol: 'NEAR', name: 'NEAR Protocol', binanceSymbol: 'NEARIDR', cmcId: 6535 },
    { symbol: 'ALGO', name: 'Algorand', binanceSymbol: 'ALGOIDR', cmcId: 4030 },
    { symbol: 'VET', name: 'VeChain', binanceSymbol: 'VETIDR', cmcId: 3077 },
    { symbol: 'AXS', name: 'Axie Infinity', binanceSymbol: 'AXSIDR', cmcId: 6783 }
];

// State aplikasi
let appState = {
    cryptoData: [],
    filteredData: [],
    currentPage: 1,
    itemsPerPage: 20,
    currentCurrency: CONFIG.defaultCurrency,
    theme: 'dark',
    sortBy: 'volume',
    sortOrder: 'desc',
    wsConnections: {},
    chartData: {}
};

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loadingScreen'),
    cryptoTableBody: document.getElementById('cryptoTableBody'),
    topGainers: document.getElementById('topGainers'),
    featuredCrypto: document.getElementById('featuredCrypto'),
    searchCrypto: document.getElementById('searchCrypto'),
    currencySelect: document.getElementById('currencySelect'),
    refreshData: document.getElementById('refreshData'),
    lastUpdated: document.getElementById('lastUpdated'),
    themeToggle: document.getElementById('themeToggle'),
    btcChart: document.getElementById('btcChart'),
    cryptoPriceElements: {
        btcPrice: document.getElementById('btcPrice'),
        btcChange: document.getElementById('btcChange'),
        btcPriceWidget: document.getElementById('btcPriceWidget'),
        btcChangeWidget: document.getElementById('btcChangeWidget'),
        btcHigh: document.getElementById('btcHigh'),
        btcLow: document.getElementById('btcLow'),
        btcVolume: document.getElementById('btcVolume'),
        btcMarketCap: document.getElementById('btcMarketCap'),
        btcUpdateTime: document.getElementById('btcUpdateTime')
    },
    globalStats: {
        marketCap: document.getElementById('globalMarketCap'),
        volume: document.getElementById('globalVolume'),
        dominance: document.getElementById('btcDominance'),
        fearGreed: document.getElementById('fearGreedIndex')
    }
};

// Utility functions
function formatIDR(number) {
    // Format lengkap tanpa singkatan B/M/K
    return `Rp ${Math.round(number).toLocaleString('id-ID')}`;
}

function formatNumber(num) {
    // Untuk USD, juga tanpa singkatan
    return `$${Math.round(num).toLocaleString('id-ID')}`;
}

function getRandomPrice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Binance API Class
class BinanceAPI {
    constructor() {
        this.baseURL = 'https://api.binance.com/api/v3';
        this.wsURL = 'wss://stream.binance.com:9443/ws';
    }

    // Get 24hr ticker for a symbol
    async getTicker24hr(symbol) {
        try {
            const response = await fetch(`${this.baseURL}/ticker/24hr?symbol=${symbol}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            return null;
        }
    }

    // Get ticker price
    async getTickerPrice(symbol) {
        try {
            const response = await fetch(`${this.baseURL}/ticker/price?symbol=${symbol}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching price ${symbol}:`, error);
            return null;
        }
    }

    // Get order book
    async getOrderBook(symbol, limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/depth?symbol=${symbol}&limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching order book ${symbol}:`, error);
            return null;
        }
    }

    // Get klines/candlestick data
    async getKlines(symbol, interval = '1h', limit = 24) {
        try {
            const response = await fetch(`${this.baseURL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching klines ${symbol}:`, error);
            return null;
        }
    }

    // Get exchange info
    async getExchangeInfo() {
        try {
            const response = await fetch(`${this.baseURL}/exchangeInfo`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching exchange info:', error);
            return null;
        }
    }

    // WebSocket for real-time updates
    createWebSocket(symbols, callback) {
        const streamNames = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
        const ws = new WebSocket(`${this.wsURL}/${streamNames}`);
        
        ws.onopen = () => {
            console.log(`WebSocket connected for ${symbols.join(', ')}`);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(() => {
                this.createWebSocket(symbols, callback);
            }, 3000);
        };

        return ws;
    }
}

// Main Application Class
class CryptoMarketApp {
    constructor() {
        this.binanceAPI = new BinanceAPI();
        this.chart = null;
        this.init();
    }

    async init() {
        // Set theme
        this.setTheme(localStorage.getItem('theme') || 'dark');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize chart
        this.initChart();
        
        // Load initial data
        await this.loadAllData();
        
        // Start WebSocket for real-time updates
        if (CONFIG.useWebSocket) {
            this.startWebSocket();
        }
        
        // Hide loading screen
        setTimeout(() => {
            elements.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
            }, 300);
        }, 1500);
        
        // Start auto-update
        this.startAutoUpdate();
    }

    setupEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Search
        elements.searchCrypto.addEventListener('input', (e) => {
            this.filterCrypto(e.target.value);
        });

        // Refresh button
        elements.refreshData.addEventListener('click', () => {
            this.loadAllData();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterByType(e.target.dataset.filter);
            });
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (appState.currentPage > 1) {
                appState.currentPage--;
                this.renderTable();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(appState.filteredData.length / appState.itemsPerPage);
            if (appState.currentPage < totalPages) {
                appState.currentPage++;
                this.renderTable();
            }
        });

        // Page numbers
        document.querySelectorAll('.page-number').forEach((num, index) => {
            num.addEventListener('click', () => {
                appState.currentPage = index + 1;
                this.renderTable();
                document.querySelectorAll('.page-number').forEach(n => n.classList.remove('active'));
                num.classList.add('active');
            });
        });

        // Buy/Sell buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-buy')) {
                const cryptoId = e.target.dataset.id;
                this.showBuyModal(cryptoId);
            }
            if (e.target.classList.contains('btn-sell')) {
                const cryptoId = e.target.dataset.id;
                this.showSellModal(cryptoId);
            }
            if (e.target.classList.contains('btn-details')) {
                const cryptoId = e.target.dataset.id;
                this.showDetailsModal(cryptoId);
            }
        });

        // Modal close
        document.getElementById('closeModal')?.addEventListener('click', () => {
            document.getElementById('tradingModal')?.classList.remove('active');
        });
    }

    async loadAllData() {
        try {
            console.log('Loading data from Binance API...');
            
            // Load data for all cryptocurrencies
            const promises = CRYPTO_LIST.map(crypto => this.loadCryptoData(crypto));
            const results = await Promise.allSettled(promises);
            
            // Filter out null results and get successful ones
            appState.cryptoData = results
                .filter(result => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);
            
            // If no data, use demo data
            if (appState.cryptoData.length === 0) {
                throw new Error('No data received from Binance');
            }
            
            appState.filteredData = [...appState.cryptoData];
            
            // Update BTC details
            const btcData = appState.cryptoData.find(c => c.symbol === 'BTC');
            if (btcData) {
                this.updateBTCDetails(btcData);
            }
            
            // Update global stats
            this.updateGlobalStats();
            
            // Render data
            this.renderTable();
            this.renderTopGainers();
            this.renderFeatured();
            this.updatePrices();
            
            // Update timestamp
            this.updateTimestamp();
            
            console.log(`Data loaded successfully! ${appState.cryptoData.length} cryptocurrencies`);
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Gagal memuat data dari Binance. Menggunakan data demo.');
            this.useDemoData();
        }
    }

    async loadCryptoData(crypto) {
        try {
            const tickerData = await this.binanceAPI.getTicker24hr(crypto.binanceSymbol);
            
            if (!tickerData || tickerData.code) {
                console.warn(`No data for ${crypto.symbol}:`, tickerData?.msg);
                return null;
            }
            
            // Get historical data for sparkline
            const klines = await this.binanceAPI.getKlines(crypto.binanceSymbol, '1h', 24);
            const sparkline = klines ? klines.map(k => parseFloat(k[4])) : [];
            
            // Calculate market cap (approximation)
            const supply = this.getEstimatedSupply(crypto.symbol);
            const marketCap = parseFloat(tickerData.lastPrice) * supply;
            
            return {
                id: crypto.cmcId,
                name: crypto.name,
                symbol: crypto.symbol,
                binanceSymbol: crypto.binanceSymbol,
                price: parseFloat(tickerData.lastPrice),
                openPrice: parseFloat(tickerData.openPrice),
                highPrice: parseFloat(tickerData.highPrice),
                lowPrice: parseFloat(tickerData.lowPrice),
                change24h: parseFloat(tickerData.priceChangePercent),
                volume: parseFloat(tickerData.volume),
                quoteVolume: parseFloat(tickerData.quoteVolume),
                marketCap: marketCap,
                supply: supply,
                sparkline: sparkline,
                lastUpdate: new Date(tickerData.closeTime)
            };
            
        } catch (error) {
            console.error(`Error loading ${crypto.symbol}:`, error);
            return null;
        }
    }

    getEstimatedSupply(symbol) {
        const supplies = {
            'BTC': 19600000,
            'ETH': 120000000,
            'BNB': 154000000,
            'SOL': 425000000,
            'XRP': 54000000000,
            'ADA': 35000000000,
            'DOGE': 141000000000,
            'DOT': 1200000000,
            'MATIC': 10000000000,
            'AVAX': 400000000,
            'LTC': 73000000,
            'LINK': 1000000000,
            'UNI': 1000000000,
            'SHIB': 589000000000000,
            'TRX': 92000000000,
            'ATOM': 300000000,
            'NEAR': 1000000000,
            'ALGO': 7000000000,
            'VET': 72700000000,
            'AXS': 270000000
        };
        return supplies[symbol] || 100000000;
    }

    updateBTCDetails(btcData) {
        if (!btcData) return;
        
        elements.cryptoPriceElements.btcHigh.textContent = formatIDR(btcData.highPrice);
        elements.cryptoPriceElements.btcLow.textContent = formatIDR(btcData.lowPrice);
        elements.cryptoPriceElements.btcVolume.textContent = `${formatIDR(btcData.volume)} ${btcData.symbol}`;
        elements.cryptoPriceElements.btcMarketCap.textContent = formatIDR(btcData.marketCap);
        
        // Update chart data
        this.updateChart(btcData);
    }

    updateChart(cryptoData) {
        if (!this.chart || !cryptoData.sparkline || cryptoData.sparkline.length === 0) return;
        
        // Update chart with new data
        const labels = cryptoData.sparkline.map((_, i) => `${i}h`);
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = cryptoData.sparkline;
        this.chart.update('none');
    }

    updateGlobalStats() {
        const totalVolume = appState.cryptoData.reduce((sum, crypto) => sum + crypto.volume, 0);
        const btc = appState.cryptoData.find(c => c.symbol === 'BTC');
        const totalMarketCap = appState.cryptoData.reduce((sum, crypto) => sum + crypto.marketCap, 0);
        const btcDominance = btc ? (btc.marketCap / totalMarketCap * 100).toFixed(1) : '52.8';
        
        // Format tanpa singkatan
        elements.globalStats.volume.textContent = formatIDR(totalVolume);
        elements.globalStats.marketCap.textContent = formatIDR(totalMarketCap);
        elements.globalStats.dominance.textContent = `${btcDominance}%`;
        
        // Update fear & greed index (random for demo)
        const fgi = Math.floor(Math.random() * 40) + 60; // 60-100
        elements.globalStats.fearGreed.textContent = fgi;
    }

    renderTable() {
        const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
        const endIndex = startIndex + appState.itemsPerPage;
        const pageData = appState.filteredData.slice(startIndex, endIndex);
        
        elements.cryptoTableBody.innerHTML = '';
        
        pageData.forEach((crypto, index) => {
            const row = this.createTableRow(crypto, startIndex + index + 1);
            elements.cryptoTableBody.appendChild(row);
            
            // Render mini chart
            this.renderMiniChart(crypto);
        });
        
        this.updatePaginationInfo();
    }

    createTableRow(crypto, index) {
        const row = document.createElement('tr');
        const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = crypto.change24h >= 0 ? '+' : '';
        
        row.innerHTML = `
            <td class="sticky-col">${index}</td>
            <td class="sticky-col">
                <div class="crypto-name-cell">
                    <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png" 
                         alt="${crypto.name}" class="crypto-icon-small" onerror="this.src='https://cryptologos.cc/logos/${crypto.symbol.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png?v=029'">
                    <div>
                        <div>${crypto.name}</div>
                        <div class="crypto-symbol">${crypto.symbol}</div>
                    </div>
                </div>
            </td>
            <td class="price-cell">${formatIDR(crypto.price)}</td>
            <td>
                <div class="change-cell ${changeClass}">
                    ${changeSign}${crypto.change24h.toFixed(2)}%
                </div>
            </td>
            <td>${formatIDR(crypto.volume)}</td>
            <td>${formatIDR(crypto.marketCap)}</td>
            <td>
                <canvas class="mini-chart" id="chart-${crypto.symbol}" width="100" height="30"></canvas>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-buy" data-id="${crypto.symbol}">Buy</button>
                    <button class="btn-action btn-sell" data-id="${crypto.symbol}">Sell</button>
                    <button class="btn-action btn-details" data-id="${crypto.symbol}">Details</button>
                </div>
            </td>
        `;
        
        return row;
    }

    renderMiniChart(crypto) {
        const canvas = document.getElementById(`chart-${crypto.symbol}`);
        if (!canvas || !crypto.sparkline || crypto.sparkline.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const data = crypto.sparkline;
        const width = canvas.width;
        const height = canvas.height;
        const step = width / (data.length - 1);
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Find min and max for scaling
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        
        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = crypto.change24h >= 0 ? '#00d2d3' : '#ff4757';
        ctx.lineWidth = 2;
        
        data.forEach((value, index) => {
            const x = index * step;
            const y = height - ((value - min) / range * height);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    renderTopGainers() {
        const gainers = [...appState.cryptoData]
            .sort((a, b) => b.change24h - a.change24h)
            .slice(0, 5);
        
        elements.topGainers.innerHTML = '';
        
        gainers.forEach(crypto => {
            const item = this.createGainerItem(crypto);
            elements.topGainers.appendChild(item);
        });
    }

    createGainerItem(crypto) {
        const item = document.createElement('div');
        item.className = 'gainer-item';
        const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = crypto.change24h >= 0 ? '+' : '';
        
        item.innerHTML = `
            <div class="gainer-info">
                <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/${crypto.id}.png" 
                     alt="${crypto.name}" width="24" height="24" onerror="this.src='https://cryptologos.cc/logos/${crypto.symbol.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png?v=029'">
                <div>
                    <div>${crypto.symbol}</div>
                    <div class="gainer-change ${changeClass}">
                        ${changeSign}${crypto.change24h.toFixed(2)}%
                    </div>
                </div>
            </div>
            <div>${formatIDR(crypto.price)}</div>
        `;
        
        return item;
    }

    renderFeatured() {
        const featured = appState.cryptoData.slice(0, 4);
        
        elements.featuredCrypto.innerHTML = '';
        
        featured.forEach(crypto => {
            const card = this.createFeaturedCard(crypto);
            elements.featuredCrypto.appendChild(card);
        });
    }

    createFeaturedCard(crypto) {
        const card = document.createElement('div');
        card.className = 'featured-card';
        const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = crypto.change24h >= 0 ? '+' : '';
        
        card.innerHTML = `
            <div class="featured-card-header">
                <div class="featured-card-info">
                    <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png" 
                         alt="${crypto.name}" width="40" height="40" onerror="this.src='https://cryptologos.cc/logos/${crypto.symbol.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png?v=029'">
                    <div>
                        <div>${crypto.name}</div>
                        <div>${crypto.symbol}</div>
                    </div>
                </div>
                <div class="featured-change ${changeClass}">
                    ${changeSign}${crypto.change24h.toFixed(2)}%
                </div>
            </div>
            <div class="featured-price">${formatIDR(crypto.price)}</div>
            <div class="featured-stats">
                <div>Volume 24j</div>
                <div>${formatIDR(crypto.volume)}</div>
            </div>
        `;
        
        return card;
    }

    updatePrices() {
        const btc = appState.cryptoData.find(c => c.symbol === 'BTC');
        if (btc) {
            elements.cryptoPriceElements.btcPrice.textContent = formatIDR(btc.price);
            elements.cryptoPriceElements.btcPriceWidget.textContent = formatIDR(btc.price);
            
            const changeText = `${btc.change24h >= 0 ? '+' : ''}${btc.change24h.toFixed(2)}%`;
            elements.cryptoPriceElements.btcChange.textContent = changeText;
            elements.cryptoPriceElements.btcChangeWidget.textContent = changeText;
            
            // Update change color
            const changeClass = btc.change24h >= 0 ? 'positive' : 'negative';
            elements.cryptoPriceElements.btcChange.className = `chart-change ${changeClass}`;
            elements.cryptoPriceElements.btcChangeWidget.className = `price-change-large ${changeClass}`;
            
            // Update time
            elements.cryptoPriceElements.btcUpdateTime.textContent = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        elements.lastUpdated.textContent = timeString;
        elements.cryptoPriceElements.btcUpdateTime.textContent = timeString;
        document.getElementById('footerUpdateTime').textContent = timeString;
    }

    startWebSocket() {
        try {
            // Get symbols for WebSocket (limit to 5 for stability)
            const symbols = CRYPTO_LIST.slice(0, 5).map(c => c.binanceSymbol.toLowerCase());
            
            // Create WebSocket connection
            const ws = this.binanceAPI.createWebSocket(symbols, (data) => {
                this.handleWebSocketMessage(data);
            });
            
            appState.wsConnections.main = ws;
        } catch (error) {
            console.error('Error starting WebSocket:', error);
        }
    }

    handleWebSocketMessage(data) {
        // Update specific cryptocurrency data
        const symbol = data.s.toUpperCase(); // Symbol from Binance (e.g., BTCIDR)
        const crypto = appState.cryptoData.find(c => c.binanceSymbol === symbol);
        
        if (crypto) {
            // Update crypto data
            crypto.price = parseFloat(data.c); // Current price
            crypto.change24h = parseFloat(data.P); // Price change percent
            crypto.highPrice = parseFloat(data.h); // High price
            crypto.lowPrice = parseFloat(data.l); // Low price
            crypto.volume = parseFloat(data.v); // Volume
            
            // Update UI if this crypto is currently displayed
            this.updateCryptoUI(crypto);
            
            // If it's BTC, update main widgets
            if (crypto.symbol === 'BTC') {
                this.updatePrices();
                this.updateBTCDetails(crypto);
            }
            
            // Update timestamp
            this.updateTimestamp();
        }
    }

    updateCryptoUI(crypto) {
        // Find and update table row
        const rows = document.querySelectorAll('#cryptoTableBody tr');
        rows.forEach(row => {
            const symbolCell = row.querySelector('.crypto-symbol');
            if (symbolCell && symbolCell.textContent === crypto.symbol) {
                // Update price cell
                const priceCell = row.querySelector('.price-cell');
                if (priceCell) {
                    priceCell.textContent = formatIDR(crypto.price);
                }
                
                // Update change cell
                const changeCell = row.querySelector('.change-cell');
                if (changeCell) {
                    const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
                    const changeSign = crypto.change24h >= 0 ? '+' : '';
                    changeCell.className = `change-cell ${changeClass}`;
                    changeCell.textContent = `${changeSign}${crypto.change24h.toFixed(2)}%`;
                }
                
                // Update volume cell
                const volumeCell = row.querySelector('td:nth-child(5)');
                if (volumeCell) {
                    volumeCell.textContent = formatIDR(crypto.volume);
                }
            }
        });
        
        // Update top gainers if affected
        this.renderTopGainers();
        
        // Update featured if affected
        this.renderFeatured();
    }

    filterCrypto(searchTerm) {
        if (!searchTerm.trim()) {
            appState.filteredData = [...appState.cryptoData];
        } else {
            const term = searchTerm.toLowerCase();
            appState.filteredData = appState.cryptoData.filter(crypto => 
                crypto.name.toLowerCase().includes(term) || 
                crypto.symbol.toLowerCase().includes(term)
            );
        }
        
        appState.currentPage = 1;
        this.renderTable();
    }

    filterByType(type) {
        switch(type) {
            case 'gainers':
                appState.filteredData = [...appState.cryptoData].sort((a, b) => b.change24h - a.change24h);
                break;
            case 'losers':
                appState.filteredData = [...appState.cryptoData].sort((a, b) => a.change24h - b.change24h);
                break;
            case 'volume':
                appState.filteredData = [...appState.cryptoData].sort((a, b) => b.volume - a.volume);
                break;
            default:
                appState.filteredData = [...appState.cryptoData];
        }
        
        appState.currentPage = 1;
        this.renderTable();
    }

    initChart() {
        const ctx = elements.btcChart.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price',
                    data: [],
                    borderColor: '#2962ff',
                    backgroundColor: 'rgba(41, 98, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return formatIDR(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: false,
                        grid: { display: false }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                            color: 'rgba(255,255,255,0.7)',
                            callback: (value) => {
                                return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
    }

    updatePaginationInfo() {
        const startItem = (appState.currentPage - 1) * appState.itemsPerPage + 1;
        const endItem = Math.min(appState.currentPage * appState.itemsPerPage, appState.filteredData.length);
        
        document.getElementById('startItem').textContent = startItem;
        document.getElementById('endItem').textContent = endItem;
        document.getElementById('totalItems').textContent = appState.filteredData.length;
    }

    setTheme(theme) {
        appState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = elements.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    toggleTheme() {
        const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    startAutoUpdate() {
        // Update data periodically (fallback if WebSocket fails)
        setInterval(() => {
            if (!CONFIG.useWebSocket || Object.keys(appState.wsConnections).length === 0) {
                this.loadAllData();
            }
        }, CONFIG.updateInterval * 3); // Every 30 seconds
    }

    useDemoData() {
        // Generate demo data
        appState.cryptoData = CRYPTO_LIST.map(crypto => {
            const price = getRandomPrice(1000, 2000000000);
            const change = (Math.random() * 20 - 10).toFixed(2);
            const supply = this.getEstimatedSupply(crypto.symbol);
            
            return {
                id: crypto.cmcId,
                name: crypto.name,
                symbol: crypto.symbol,
                binanceSymbol: crypto.binanceSymbol,
                price: price,
                openPrice: price * (1 - parseFloat(change) / 100),
                highPrice: price * (1 + Math.random() * 0.05),
                lowPrice: price * (1 - Math.random() * 0.05),
                change24h: parseFloat(change),
                volume: getRandomPrice(10000000, 100000000000),
                quoteVolume: getRandomPrice(10000000, 100000000000),
                marketCap: price * supply,
                supply: supply,
                sparkline: Array(24).fill().map(() => price * (0.95 + Math.random() * 0.1)),
                lastUpdate: new Date()
            };
        });
        
        appState.filteredData = [...appState.cryptoData];
        this.renderTable();
        this.renderTopGainers();
        this.renderFeatured();
        this.updatePrices();
        this.updateGlobalStats();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button class="error-close">&times;</button>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4757, #ff6b6b);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 9999;
            box-shadow: 0 10px 25px rgba(255, 71, 87, 0.3);
            border-left: 5px solid #ff3838;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        
        errorDiv.querySelector('.error-close').addEventListener('click', () => {
            errorDiv.remove();
        });
    }

    showBuyModal(symbol) {
        const crypto = appState.cryptoData.find(c => c.symbol === symbol);
        if (!crypto) return;
        
        // Create modal
        const modal = document.getElementById('tradingModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="buy-modal">
                <h4>Buy ${crypto.name} (${crypto.symbol})</h4>
                <div class="current-price">Current Price: ${formatIDR(crypto.price)}</div>
                
                <div class="buy-form">
                    <div class="form-group">
                        <label>Amount (${crypto.symbol})</label>
                        <input type="number" id="buyAmount" step="0.000001" placeholder="0.000000">
                    </div>
                    <div class="form-group">
                        <label>Total (IDR)</label>
                        <input type="text" id="buyTotal" readonly value="Rp 0">
                    </div>
                    <button class="btn-buy-confirm">Confirm Buy</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Add calculation
        const amountInput = document.getElementById('buyAmount');
        const totalInput = document.getElementById('buyTotal');
        
        amountInput.addEventListener('input', () => {
            const amount = parseFloat(amountInput.value) || 0;
            const total = amount * crypto.price;
            totalInput.value = formatIDR(total);
        });
    }

    showSellModal(symbol) {
        const crypto = appState.cryptoData.find(c => c.symbol === symbol);
        if (!crypto) return;
        
        // Create modal
        const modal = document.getElementById('tradingModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="sell-modal">
                <h4>Sell ${crypto.name} (${crypto.symbol})</h4>
                <div class="current-price">Current Price: ${formatIDR(crypto.price)}</div>
                
                <div class="sell-form">
                    <div class="form-group">
                        <label>Amount (${crypto.symbol})</label>
                        <input type="number" id="sellAmount" step="0.000001" placeholder="0.000000">
                    </div>
                    <div class="form-group">
                        <label>Total (IDR)</label>
                        <input type="text" id="sellTotal" readonly value="Rp 0">
                    </div>
                    <button class="btn-sell-confirm">Confirm Sell</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Add calculation
        const amountInput = document.getElementById('sellAmount');
        const totalInput = document.getElementById('sellTotal');
        
        amountInput.addEventListener('input', () => {
            const amount = parseFloat(amountInput.value) || 0;
            const total = amount * crypto.price;
            totalInput.value = formatIDR(total);
        });
    }

    showDetailsModal(symbol) {
        const crypto = appState.cryptoData.find(c => c.symbol === symbol);
        if (!crypto) return;
        
        const modal = document.getElementById('tradingModal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="crypto-detail">
                <div class="detail-header">
                    <img src="https://s2.coinmarketcap.com/static/img/coins/128x128/${crypto.id}.png" 
                         alt="${crypto.name}" width="64" height="64" onerror="this.src='https://cryptologos.cc/logos/${crypto.symbol.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png?v=029'">
                    <div>
                        <h3>${crypto.name} (${crypto.symbol})</h3>
                        <div class="detail-price">${formatIDR(crypto.price)}</div>
                        <div class="detail-change ${crypto.change24h >= 0 ? 'positive' : 'negative'}">
                            ${crypto.change24h >= 0 ? '+' : ''}${crypto.change24h.toFixed(2)}% (24h)
                        </div>
                    </div>
                </div>
                <div class="detail-stats">
                    <div class="stat-row">
                        <span>High 24h:</span>
                        <span>${formatIDR(crypto.highPrice)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Low 24h:</span>
                        <span>${formatIDR(crypto.lowPrice)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Volume 24h:</span>
                        <span>${formatIDR(crypto.volume)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Market Cap:</span>
                        <span>${formatIDR(crypto.marketCap)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Circulating Supply:</span>
                        <span>${crypto.supply.toLocaleString('id-ID')} ${crypto.symbol}</span>
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn-action btn-buy" style="width: 100%; margin-bottom: 10px;" data-id="${crypto.symbol}">Buy ${crypto.symbol}</button>
                    <button class="btn-action btn-sell" style="width: 100%;" data-id="${crypto.symbol}">Sell ${crypto.symbol}</button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cryptoApp = new CryptoMarketApp();
});

// Global utility functions
window.formatIDR = formatIDR;
window.formatChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    const colorClass = change >= 0 ? 'positive' : 'negative';
    return {
        text: `${sign}${change.toFixed(2)}%`,
        class: colorClass,
        isPositive: change >= 0
    };
};

// Auto-refresh when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.cryptoApp) {
        window.cryptoApp.loadAllData();
    }
});
// Tambahkan di script.js
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // Capture performance metrics
        if ('performance' in window) {
            this.capturePerformanceMetrics();
        }
        
        // Monitor WebSocket performance
        this.monitorWebSocket();
        
        // Monitor API response times
        this.monitorAPI();
    }

    capturePerformanceMetrics() {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.fcp = entry.startTime;
                    console.log(`FCP: ${entry.startTime}ms`);
                }
            }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.metrics.lcp = entry.startTime;
                console.log(`LCP: ${entry.startTime}ms`);
            }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.metrics.fid = entry.processingStart - entry.startTime;
                console.log(`FID: ${this.metrics.fid}ms`);
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.metrics.cls = clsValue;
                    console.log(`CLS: ${clsValue}`);
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    monitorWebSocket() {
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(...args) {
            const ws = new originalWebSocket(...args);
            const startTime = Date.now();
            
            ws.addEventListener('open', () => {
                const connectTime = Date.now() - startTime;
                this.metrics.wsConnectTime = connectTime;
                console.log(`WebSocket connected in ${connectTime}ms`);
            });
            
            ws.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                this.reportError('WebSocket', error);
            });
            
            return ws;
        };
    }

    monitorAPI() {
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const startTime = Date.now();
            
            try {
                const response = await originalFetch(...args);
                const responseTime = Date.now() - startTime;
                
                console.log(`API ${args[0]} responded in ${responseTime}ms`);
                
                // Track slow responses
                if (responseTime > 1000) {
                    console.warn(`Slow API response: ${args[0]} (${responseTime}ms)`);
                }
                
                return response;
            } catch (error) {
                console.error('API fetch error:', error);
                throw error;
            }
        };
    }

    reportError(type, error) {
        // Send to analytics
        if (window.gtag) {
            gtag('event', 'exception', {
                description: `${type}: ${error.message}`,
                fatal: false
            });
        }
    }

    getMetrics() {
        return this.metrics;
    }
}

// Initialize performance monitoring
window.performanceMonitor = new PerformanceMonitor();
