// ==============================================
// KONFIGURASI DAN DATA
// ==============================================

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
    { symbol: 'AVAX', name: 'Avalanche', binanceSymbol: 'AVAXIDR', cmcId: 5805 }
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

// Demo Data sebagai fallback
const DEMO_DATA = [
    {
        rank: 1,
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        binanceSymbol: 'BTCIDR',
        price: 1156060484.09,
        openPrice: 1100000000,
        highPrice: 1219000000,
        lowPrice: 1084182000,
        change24h: 5.65,
        volume: 1486550000000000,
        quoteVolume: 1486550000000000,
        marketCap: 1370000000000000000,
        supply: 19600000,
        sparkline: Array(24).fill().map((_, i) => 1156060484.09 * (0.95 + Math.random() * 0.1)),
        lastUpdate: new Date()
    },
    {
        rank: 2,
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        binanceSymbol: 'ETHIDR',
        price: 34360891.34,
        openPrice: 31000000,
        highPrice: 35000000,
        lowPrice: 30000000,
        change24h: 10.64,
        volume: 159370000000000,
        quoteVolume: 159370000000000,
        marketCap: 245000000000000,
        supply: 120000000,
        sparkline: Array(24).fill().map((_, i) => 34360891.34 * (0.95 + Math.random() * 0.1)),
        lastUpdate: new Date()
    },
    {
        rank: 3,
        id: 'tether',
        symbol: 'USDT',
        name: 'TetherUS',
        binanceSymbol: 'USDTIDR',
        price: 16850.43,
        openPrice: 16850.00,
        highPrice: 16860.00,
        lowPrice: 16840.00,
        change24h: -0.07,
        volume: 450220000000000,
        quoteVolume: 450220000000000,
        marketCap: 98000000000,
        supply: 98000000000,
        sparkline: Array(24).fill().map((_, i) => 16850.43 * (0.999 + Math.random() * 0.002)),
        lastUpdate: new Date()
    },
    {
        rank: 4,
        id: 'binance-coin',
        symbol: 'BNB',
        name: 'BNB',
        binanceSymbol: 'BNBIDR',
        price: 10823536.70,
        openPrice: 10000000,
        highPrice: 11000000,
        lowPrice: 9800000,
        change24h: 8.42,
        volume: 134610000000000,
        quoteVolume: 134610000000000,
        marketCap: 98700000000,
        supply: 154000000,
        sparkline: Array(24).fill().map((_, i) => 10823536.70 * (0.95 + Math.random() * 0.1)),
        lastUpdate: new Date()
    },
    {
        rank: 5,
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        binanceSymbol: 'SOLIDR',
        price: 1449642.49,
        openPrice: 1350000,
        highPrice: 1500000,
        lowPrice: 1300000,
        change24h: 7.17,
        volume: 881400000000000,
        quoteVolume: 881400000000000,
        marketCap: 37600000000,
        supply: 425000000,
        sparkline: Array(24).fill().map((_, i) => 1449642.49 * (0.95 + Math.random() * 0.1)),
        lastUpdate: new Date()
    }
];

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function formatIDR(number) {
    // Format lengkap tanpa singkatan B/M/K/T
    return `Rp ${Math.round(number).toLocaleString('id-ID')}`;
}

function formatUSD(number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

function getRandomPrice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatChange(change) {
    const sign = change >= 0 ? '+' : '';
    return {
        value: `${sign}${change.toFixed(2)}%`,
        class: change >= 0 ? 'positive' : 'negative'
    };
}

// ==============================================
// BINANCE API CLASS
// ==============================================

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

// ==============================================
// CRYPTO MARKET TABLE CLASS (UNTUK DESAIN BARU)
// ==============================================

class CryptoMarketTable {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    render(data) {
        this.data = data;
        const tableHTML = `
            <div class="crypto-market-container">
                ${this.renderHeader()}
                ${this.renderRows()}
            </div>
        `;
        
        if (this.container) {
            this.container.innerHTML = tableHTML;
        }
    }

    renderHeader() {
        return `
            <div class="table-header">
                <div class="header-item name-col"># Nama</div>
                <div class="header-item price-col">Harga</div>
                <div class="header-item change-col">Perubahan</div>
                <div class="header-item volume-col">Volume 24jam</div>
                <div class="header-item marketcap-col">Kap Pasar</div>
                <div class="header-item action-col">Tindakan</div>
            </div>
        `;
    }

    renderRows() {
        return this.data.map(crypto => this.renderRow(crypto)).join('');
    }

    renderRow(crypto) {
        const change = formatChange(crypto.change24h);
        const priceUSD = crypto.price * 0.000064; // Approx conversion rate
        
        return `
            <div class="crypto-row" data-id="${crypto.id}">
                <div class="row-item name-col">
                    <div class="crypto-info">
                        <span class="crypto-rank">${crypto.rank}</span>
                        <img src="https://cryptologos.cc/logos/${crypto.symbol.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png" 
                             alt="${crypto.name}" class="crypto-icon" 
                             onerror="this.src='https://cryptologos.cc/logos/generic-crypto-logo.png'">
                        <div class="crypto-details">
                            <div class="crypto-name">${crypto.symbol} ${crypto.name}</div>
                            <div class="crypto-symbol">${crypto.symbol}</div>
                        </div>
                    </div>
                </div>
                
                <div class="row-item price-col">
                    <div class="price-primary">${formatUSD(priceUSD)}</div>
                    <div class="price-secondary">${formatIDR(crypto.price)}</div>
                </div>
                
                <div class="row-item change-col">
                    <div class="change-value ${change.class}">${change.value}</div>
                    <div class="change-secondary">${crypto.change24h >= 0 ? '+' : ''}${formatUSD(priceUSD * crypto.change24h / 100)}</div>
                </div>
                
                <div class="row-item volume-col">
                    <div class="volume-value">${formatIDR(crypto.volume)}</div>
                </div>
                
                <div class="row-item marketcap-col">
                    <div class="marketcap-value">${formatIDR(crypto.marketCap)}</div>
                </div>
                
                <div class="row-item action-col">
                    <div class="action-buttons">
                        <button class="btn-action btn-trade" data-symbol="${crypto.symbol}">
                            <span>Trade</span>
                        </button>
                        <button class="btn-action btn-chart" data-symbol="${crypto.symbol}">
                            <i class="fas fa-chart-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Delegate events to container
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                const tradeBtn = e.target.closest('.btn-trade');
                const chartBtn = e.target.closest('.btn-chart');
                const cryptoRow = e.target.closest('.crypto-row');
                
                if (tradeBtn) {
                    this.handleTradeClick(tradeBtn.dataset.symbol);
                }
                
                if (chartBtn) {
                    this.handleChartClick(chartBtn.dataset.symbol);
                }
                
                if (cryptoRow && !tradeBtn && !chartBtn) {
                    this.handleRowClick(cryptoRow.dataset.id);
                }
            });
        }
    }

    handleTradeClick(symbol) {
        console.log(`Trade ${symbol}`);
        alert(`Trading ${symbol} - Fitur akan segera hadir!`);
    }

    handleChartClick(symbol) {
        console.log(`Show chart for ${symbol}`);
        window.location.hash = `#chart/${symbol.toLowerCase()}`;
    }

    handleRowClick(cryptoId) {
        console.log(`View details for ${cryptoId}`);
        window.location.href = `/crypto/${cryptoId}`;
    }

    filterBySearch(term) {
        const filtered = this.data.filter(crypto => 
            crypto.name.toLowerCase().includes(term.toLowerCase()) ||
            crypto.symbol.toLowerCase().includes(term.toLowerCase())
        );
        this.render(filtered);
    }

    sortBy(column, order = 'desc') {
        const sortedData = [...this.data].sort((a, b) => {
            let valueA, valueB;
            
            switch(column) {
                case 'rank':
                    valueA = a.rank;
                    valueB = b.rank;
                    break;
                case 'price':
                    valueA = a.price;
                    valueB = b.price;
                    break;
                case 'change':
                    valueA = a.change24h;
                    valueB = b.change24h;
                    break;
                case 'volume':
                    valueA = a.volume;
                    valueB = b.volume;
                    break;
                case 'marketcap':
                    valueA = a.marketCap;
                    valueB = b.marketCap;
                    break;
                default:
                    valueA = a.rank;
                    valueB = b.rank;
            }
            
            return order === 'desc' ? valueB - valueA : valueA - valueB;
        });
        
        this.render(sortedData);
    }
}

// ==============================================
// MAIN APPLICATION CLASS
// ==============================================

class CryptoMarketApp {
    constructor() {
        this.binanceAPI = new BinanceAPI();
        this.cryptoTable = new CryptoMarketTable('cryptoTableContainer');
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
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        }, 1500);
        
        // Start auto-update
        this.startAutoUpdate();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Search
        const searchCrypto = document.getElementById('searchCrypto');
        if (searchCrypto) {
            searchCrypto.addEventListener('input', (e) => {
                this.filterCrypto(e.target.value);
            });
        }

        // Refresh button
        const refreshData = document.getElementById('refreshData');
        if (refreshData) {
            refreshData.addEventListener('click', () => {
                this.loadAllData();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterByType(e.target.dataset.filter);
            });
        });

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                if (appState.currentPage > 1) {
                    appState.currentPage--;
                    this.renderTable();
                }
            });
        }
        
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                const totalPages = Math.ceil(appState.filteredData.length / appState.itemsPerPage);
                if (appState.currentPage < totalPages) {
                    appState.currentPage++;
                    this.renderTable();
                }
            });
        }

        // Live price update in header
        this.startLivePriceUpdate();
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
            
            // Add rank
            appState.cryptoData.forEach((crypto, index) => {
                crypto.rank = index + 1;
            });
            
            appState.filteredData = [...appState.cryptoData];
            
            // Update BTC details
            const btcData = appState.cryptoData.find(c => c.symbol === 'BTC');
            if (btcData) {
                this.updateBTCDetails(btcData);
            }
            
            // Update global stats
            this.updateGlobalStats();
            
            // Render tables
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
            'AVAX': 400000000
        };
        return supplies[symbol] || 100000000;
    }

    renderTable() {
        // Gunakan CryptoMarketTable untuk render
        if (this.cryptoTable) {
            const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
            const endIndex = startIndex + appState.itemsPerPage;
            const pageData = appState.filteredData.slice(startIndex, endIndex);
            
            this.cryptoTable.render(pageData);
            this.updatePaginationInfo();
        }
    }

    renderTopGainers() {
        const gainers = [...appState.cryptoData]
            .sort((a, b) => b.change24h - a.change24h)
            .slice(0, 5);
        
        const topGainers = document.getElementById('topGainers');
        if (!topGainers) return;
        
        topGainers.innerHTML = '';
        
        gainers.forEach(crypto => {
            const item = document.createElement('div');
            item.className = 'gainer-item';
            const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = crypto.change24h >= 0 ? '+' : '';
            
            item.innerHTML = `
                <div class="gainer-info">
                    <img src="https://cryptologos.cc/logos/${crypto.symbol.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png" 
                         alt="${crypto.name}" width="24" height="24" 
                         onerror="this.src='https://cryptologos.cc/logos/generic-crypto-logo.png'">
                    <div>
                        <div>${crypto.symbol}</div>
                        <div class="gainer-change ${changeClass}">
                            ${changeSign}${crypto.change24h.toFixed(2)}%
                        </div>
                    </div>
                </div>
                <div>${formatIDR(crypto.price)}</div>
            `;
            
            topGainers.appendChild(item);
        });
    }

    renderFeatured() {
        const featured = appState.cryptoData.slice(0, 4);
        
        const featuredCrypto = document.getElementById('featuredCrypto');
        if (!featuredCrypto) return;
        
        featuredCrypto.innerHTML = '';
        
        featured.forEach(crypto => {
            const card = document.createElement('div');
            card.className = 'featured-card';
            const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = crypto.change24h >= 0 ? '+' : '';
            
            card.innerHTML = `
                <div class="featured-card-header">
                    <div class="featured-card-info">
                        <img src="https://cryptologos.cc/logos/${crypto.symbol.toLowerCase()}-${crypto.symbol.toLowerCase()}-logo.png" 
                             alt="${crypto.name}" width="40" height="40" 
                             onerror="this.src='https://cryptologos.cc/logos/generic-crypto-logo.png'">
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
            
            featuredCrypto.appendChild(card);
        });
    }

    updateBTCDetails(btcData) {
        if (!btcData) return;
        
        // Update BTC widgets
        const elements = {
            btcHigh: document.getElementById('btcHigh'),
            btcLow: document.getElementById('btcLow'),
            btcVolume: document.getElementById('btcVolume'),
            btcMarketCap: document.getElementById('btcMarketCap'),
            btcPriceWidget: document.getElementById('btcPriceWidget'),
            btcChangeWidget: document.getElementById('btcChangeWidget'),
            btcUpdateTime: document.getElementById('btcUpdateTime')
        };
        
        if (elements.btcHigh) elements.btcHigh.textContent = formatIDR(btcData.highPrice);
        if (elements.btcLow) elements.btcLow.textContent = formatIDR(btcData.lowPrice);
        if (elements.btcVolume) elements.btcVolume.textContent = formatIDR(btcData.volume);
        if (elements.btcMarketCap) elements.btcMarketCap.textContent = formatIDR(btcData.marketCap);
        if (elements.btcPriceWidget) elements.btcPriceWidget.textContent = formatIDR(btcData.price);
        
        const changeClass = btcData.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = btcData.change24h >= 0 ? '+' : '';
        if (elements.btcChangeWidget) {
            elements.btcChangeWidget.textContent = `${changeSign}${btcData.change24h.toFixed(2)}%`;
            elements.btcChangeWidget.className = `price-change-large ${changeClass}`;
        }
        
        if (elements.btcUpdateTime) {
            elements.btcUpdateTime.textContent = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Update chart
        this.updateChart(btcData);
    }

    updateChart(cryptoData) {
        if (!this.chart || !cryptoData.sparkline || cryptoData.sparkline.length === 0) return;
        
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
        
        // Update elements
        const globalMarketCap = document.getElementById('globalMarketCap');
        const globalVolume = document.getElementById('globalVolume');
        const btcDominanceEl = document.getElementById('btcDominance');
        const fearGreedIndex = document.getElementById('fearGreedIndex');
        
        if (globalMarketCap) globalMarketCap.textContent = formatIDR(totalMarketCap);
        if (globalVolume) globalVolume.textContent = formatIDR(totalVolume);
        if (btcDominanceEl) btcDominanceEl.textContent = `${btcDominance}%`;
        if (fearGreedIndex) {
            const fgi = Math.floor(Math.random() * 40) + 60; // 60-100
            fearGreedIndex.textContent = fgi;
        }
    }

    updatePrices() {
        const btc = appState.cryptoData.find(c => c.symbol === 'BTC');
        if (!btc) return;
        
        // Update main BTC price
        const btcPrice = document.getElementById('btcPrice');
        const btcChange = document.getElementById('btcChange');
        
        if (btcPrice) btcPrice.textContent = formatIDR(btc.price);
        if (btcChange) {
            const changeText = `${btc.change24h >= 0 ? '+' : ''}${btc.change24h.toFixed(2)}%`;
            btcChange.textContent = changeText;
            const changeClass = btc.change24h >= 0 ? 'positive' : 'negative';
            btcChange.className = `chart-change ${changeClass}`;
        }
    }

    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const lastUpdated = document.getElementById('lastUpdated');
        const footerUpdateTime = document.getElementById('footerUpdateTime');
        
        if (lastUpdated) lastUpdated.textContent = timeString;
        if (footerUpdateTime) footerUpdateTime.textContent = timeString;
    }

    startWebSocket() {
        try {
            const symbols = CRYPTO_LIST.slice(0, 5).map(c => c.binanceSymbol.toLowerCase());
            const ws = this.binanceAPI.createWebSocket(symbols, (data) => {
                this.handleWebSocketMessage(data);
            });
            
            appState.wsConnections.main = ws;
        } catch (error) {
            console.error('Error starting WebSocket:', error);
        }
    }

    handleWebSocketMessage(data) {
        const symbol = data.s.toUpperCase();
        const crypto = appState.cryptoData.find(c => c.binanceSymbol === symbol);
        
        if (crypto) {
            crypto.price = parseFloat(data.c);
            crypto.change24h = parseFloat(data.P);
            crypto.highPrice = parseFloat(data.h);
            crypto.lowPrice = parseFloat(data.l);
            crypto.volume = parseFloat(data.v);
            
            // Update tables
            this.renderTable();
            this.renderTopGainers();
            this.renderFeatured();
            
            if (crypto.symbol === 'BTC') {
                this.updatePrices();
                this.updateBTCDetails(crypto);
            }
            
            this.updateTimestamp();
        }
    }

    startLivePriceUpdate() {
        const liveBtcPrice = document.getElementById('liveBtcPrice');
        if (!liveBtcPrice) return;
        
        // Update live price every 5 seconds
        setInterval(() => {
            const btc = appState.cryptoData.find(c => c.symbol === 'BTC');
            if (btc) {
                // Simulate small price changes
                const randomChange = (Math.random() * 0.02 - 0.01);
                const newPrice = btc.price * (1 + randomChange);
                
                liveBtcPrice.textContent = formatIDR(newPrice);
                liveBtcPrice.style.color = randomChange >= 0 ? '#00d2d3' : '#ff4757';
                
                setTimeout(() => {
                    liveBtcPrice.style.color = '';
                }, 1000);
            }
        }, 5000);
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
        const ctx = document.getElementById('btcChart');
        if (!ctx) return;
        
        this.chart = new Chart(ctx.getContext('2d'), {
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
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: {
                            color: 'rgba(255,255,255,0.7)',
                            callback: (value) => `Rp ${Math.round(value).toLocaleString('id-ID')}`
                        }
                    }
                }
            }
        });
    }

    updatePaginationInfo() {
        const startItem = document.getElementById('startItem');
        const endItem = document.getElementById('endItem');
        const totalItems = document.getElementById('totalItems');
        
        if (startItem && endItem && totalItems) {
            const start = (appState.currentPage - 1) * appState.itemsPerPage + 1;
            const end = Math.min(appState.currentPage * appState.itemsPerPage, appState.filteredData.length);
            
            startItem.textContent = start;
            endItem.textContent = end;
            totalItems.textContent = appState.filteredData.length;
        }
    }

    setTheme(theme) {
        appState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    toggleTheme() {
        const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    startAutoUpdate() {
        setInterval(() => {
            if (!CONFIG.useWebSocket || Object.keys(appState.wsConnections).length === 0) {
                this.loadAllData();
            }
        }, CONFIG.updateInterval * 3);
    }

    useDemoData() {
        appState.cryptoData = DEMO_DATA;
        appState.filteredData = [...DEMO_DATA];
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
        
        setTimeout(() => errorDiv.remove(), 5000);
        
        errorDiv.querySelector('.error-close').addEventListener('click', () => {
            errorDiv.remove();
        });
    }
}

// ==============================================
// INITIALIZE APPLICATION
// ==============================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cryptoApp = new CryptoMarketApp();
});

// Global utility functions
window.formatIDR = formatIDR;
window.formatChange = formatChange;

// Auto-refresh when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.cryptoApp) {
        window.cryptoApp.loadAllData();
    }
});

// Live price in header
setInterval(() => {
    const liveBtcPrice = document.getElementById('liveBtcPrice');
    if (liveBtcPrice && window.cryptoApp) {
        const btc = window.cryptoApp.cryptoData?.find(c => c.symbol === 'BTC');
        if (btc) {
            const randomChange = (Math.random() * 0.02 - 0.01);
            const newPrice = btc.price * (1 + randomChange);
            liveBtcPrice.textContent = formatIDR(newPrice);
        }
    }
}, 5000);
