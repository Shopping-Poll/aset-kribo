// Konfigurasi
const CONFIG = {
    apiKey: 'YOUR_COINMARKETCAP_API_KEY',
    updateInterval: 30000, // 30 detik
    demoMode: true, // Set false untuk API real
    defaultCurrency: 'IDR'
};

// State aplikasi
let appState = {
    cryptoData: [],
    filteredData: [],
    currentPage: 1,
    itemsPerPage: 20,
    currentCurrency: CONFIG.defaultCurrency,
    theme: 'dark',
    sortBy: 'market_cap',
    sortOrder: 'desc'
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

// Demo Data (jika API tidak tersedia)
const DEMO_DATA = {
    cryptocurrencies: [
        {
            id: 1,
            name: "Bitcoin",
            symbol: "BTC",
            price: 1196700000,
            change24h: 8.90,
            marketCap: 23600000000000000,
            volume24h: 137800000000,
            supply: 19600000,
            sparkline: [1100000000, 1120000000, 1150000000, 1170000000, 1160000000, 1180000000, 1196700000]
        },
        {
            id: 1027,
            name: "Ethereum",
            symbol: "ETH",
            price: 68250000,
            change24h: 5.20,
            marketCap: 8200000000000000,
            volume24h: 98700000000,
            supply: 120000000,
            sparkline: [65000000, 65500000, 66000000, 67000000, 67500000, 68000000, 68250000]
        },
        {
            id: 1839,
            name: "Binance Coin",
            symbol: "BNB",
            price: 4350000,
            change24h: 3.45,
            marketCap: 670000000000000,
            volume24h: 23400000000,
            supply: 154000000,
            sparkline: [4200000, 4250000, 4280000, 4300000, 4320000, 4340000, 4350000]
        },
        {
            id: 52,
            name: "XRP",
            symbol: "XRP",
            price: 8500,
            change24h: -1.20,
            marketCap: 456000000000000,
            volume24h: 34500000000,
            supply: 54000000000,
            sparkline: [8600, 8550, 8500, 8450, 8480, 8490, 8500]
        },
        {
            id: 2010,
            name: "Cardano",
            symbol: "ADA",
            price: 6500,
            change24h: 12.30,
            marketCap: 230000000000000,
            volume24h: 12300000000,
            supply: 35000000000,
            sparkline: [5800, 5900, 6100, 6300, 6400, 6450, 6500]
        },
        {
            id: 74,
            name: "Dogecoin",
            symbol: "DOGE",
            price: 850,
            change24h: 25.60,
            marketCap: 120000000000000,
            volume24h: 45600000000,
            supply: 141000000000,
            sparkline: [680, 720, 750, 780, 800, 830, 850]
        },
        {
            id: 5426,
            name: "Solana",
            symbol: "SOL",
            price: 1250000,
            change24h: -2.30,
            marketCap: 530000000000000,
            volume24h: 89000000000,
            supply: 425000000,
            sparkline: [1280000, 1270000, 1265000, 1260000, 1255000, 1252000, 1250000]
        },
        {
            id: 2,
            name: "Litecoin",
            symbol: "LTC",
            price: 875000,
            change24h: 1.80,
            marketCap: 64000000000000,
            volume24h: 5600000000,
            supply: 73000000,
            sparkline: [860000, 865000, 868000, 870000, 872000, 874000, 875000]
        }
    ],
    btcDetails: {
        high24h: 1219000000,
        low24h: 1084182000,
        volume: 137800000000,
        marketCap: 23600000000000000
    }
};

// Initialize Application
class CryptoMarketApp {
    constructor() {
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
        
        // Load data
        await this.loadData();
        
        // Hide loading screen
        setTimeout(() => {
            elements.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
            }, 300);
        }, 1000);
        
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

        // Currency select
        elements.currencySelect.addEventListener('change', (e) => {
            appState.currentCurrency = e.target.value;
            this.updatePrices();
        });

        // Refresh button
        elements.refreshData.addEventListener('click', () => {
            this.loadData();
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
    }

    async loadData() {
        try {
            if (CONFIG.demoMode) {
                // Use demo data
                appState.cryptoData = DEMO_DATA.cryptocurrencies;
                appState.filteredData = [...appState.cryptoData];
                
                // Update BTC details
                this.updateBTCDetails(DEMO_DATA.btcDetails);
                
                // Update global stats
                this.updateGlobalStats();
            } else {
                // Fetch from CoinMarketCap API
                const data = await this.fetchFromAPI();
                appState.cryptoData = data;
                appState.filteredData = [...data];
            }
            
            // Render data
            this.renderTable();
            this.renderTopGainers();
            this.renderFeatured();
            this.updatePrices();
            
            // Update timestamp
            this.updateTimestamp();
            
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to demo data
            appState.cryptoData = DEMO_DATA.cryptocurrencies;
            appState.filteredData = [...appState.cryptoData];
            this.renderTable();
        }
    }

    async fetchFromAPI() {
        const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&convert=${appState.currentCurrency}`;
        
        const response = await fetch(url, {
            headers: {
                'X-CMC_PRO_API_KEY': CONFIG.apiKey,
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        return data.data.map(crypto => ({
            id: crypto.id,
            name: crypto.name,
            symbol: crypto.symbol,
            price: crypto.quote[appState.currentCurrency].price,
            change24h: crypto.quote[appState.currentCurrency].percent_change_24h,
            marketCap: crypto.quote[appState.currentCurrency].market_cap,
            volume24h: crypto.quote[appState.currentCurrency].volume_24h,
            supply: crypto.circulating_supply,
            sparkline: [] // API tidak menyediakan sparkline langsung
        }));
    }

    renderTable() {
        const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
        const endIndex = startIndex + appState.itemsPerPage;
        const pageData = appState.filteredData.slice(startIndex, endIndex);
        
        elements.cryptoTableBody.innerHTML = '';
        
        pageData.forEach((crypto, index) => {
            const row = document.createElement('tr');
            const globalIndex = startIndex + index + 1;
            
            const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = crypto.change24h >= 0 ? '+' : '';
            
            row.innerHTML = `
                <td class="sticky-col">${globalIndex}</td>
                <td class="sticky-col">
                    <div class="crypto-name-cell">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png" 
                             alt="${crypto.name}" class="crypto-icon-small">
                        <div>
                            <div>${crypto.name}</div>
                            <div class="crypto-symbol">${crypto.symbol}</div>
                        </div>
                    </div>
                </td>
                <td class="price-cell">${this.formatPrice(crypto.price)}</td>
                <td>
                    <div class="change-cell ${changeClass}">
                        ${changeSign}${crypto.change24h.toFixed(2)}%
                    </div>
                </td>
                <td>${this.formatNumber(crypto.volume24h)}</td>
                <td>${this.formatNumber(crypto.marketCap)}</td>
                <td>
                    <canvas class="mini-chart" id="chart-${crypto.id}" width="100" height="30"></canvas>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-buy" data-id="${crypto.id}">Buy</button>
                        <button class="btn-action btn-sell" data-id="${crypto.id}">Sell</button>
                        <button class="btn-action btn-details" data-id="${crypto.id}">Details</button>
                    </div>
                </td>
            `;
            
            elements.cryptoTableBody.appendChild(row);
            
            // Render mini chart
            this.renderMiniChart(crypto);
        });
        
        // Update pagination info
        this.updatePaginationInfo();
    }

    renderMiniChart(crypto) {
        const canvas = document.getElementById(`chart-${crypto.id}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = crypto.sparkline || Array(7).fill(crypto.price * 0.9).map((v, i) => v + (crypto.price * 0.1 * Math.random()));
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        
        const width = canvas.width;
        const height = canvas.height;
        const step = width / (data.length - 1);
        
        ctx.clearRect(0, 0, width, height);
        
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
            const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = crypto.change24h >= 0 ? '+' : '';
            
            const item = document.createElement('div');
            item.className = 'gainer-item';
            item.innerHTML = `
                <div class="gainer-info">
                    <img src="https://s2.coinmarketcap.com/static/img/coins/32x32/${crypto.id}.png" 
                         alt="${crypto.name}" width="24" height="24">
                    <div>
                        <div>${crypto.symbol}</div>
                        <div class="gainer-change ${changeClass}">
                            ${changeSign}${crypto.change24h.toFixed(2)}%
                        </div>
                    </div>
                </div>
                <div>${this.formatPrice(crypto.price)}</div>
            `;
            
            elements.topGainers.appendChild(item);
        });
    }

    renderFeatured() {
        const featured = appState.cryptoData.slice(0, 4);
        
        elements.featuredCrypto.innerHTML = '';
        
        featured.forEach(crypto => {
            const changeClass = crypto.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = crypto.change24h >= 0 ? '+' : '';
            
            const card = document.createElement('div');
            card.className = 'featured-card';
            card.innerHTML = `
                <div class="featured-card-header">
                    <div class="featured-card-info">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png" 
                             alt="${crypto.name}" width="40" height="40">
                        <div>
                            <div>${crypto.name}</div>
                            <div>${crypto.symbol}</div>
                        </div>
                    </div>
                    <div class="featured-change ${changeClass}">
                        ${changeSign}${crypto.change24h.toFixed(2)}%
                    </div>
                </div>
                <div class="featured-price">${this.formatPrice(crypto.price)}</div>
                <div class="featured-stats">
                    <div>Market Cap</div>
                    <div>${this.formatNumber(crypto.marketCap)}</div>
                </div>
            `;
            
            elements.featuredCrypto.appendChild(card);
        });
    }

    updatePrices() {
        // Format semua harga berdasarkan currency
        const formatPrice = (price) => {
            if (appState.currentCurrency === 'IDR') {
                return `Rp ${Math.round(price).toLocaleString('id-ID')}`;
            } else {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: appState.currentCurrency,
                    minimumFractionDigits: 2
                }).format(price);
            }
        };

        // Update BTC elements
        const btc = appState.cryptoData.find(c => c.symbol === 'BTC');
        if (btc) {
            elements.cryptoPriceElements.btcPrice.textContent = formatPrice(btc.price);
            elements.cryptoPriceElements.btcPriceWidget.textContent = formatPrice(btc.price);
            
            const changeText = `${btc.change24h >= 0 ? '+' : ''}${btc.change24h.toFixed(2)}%`;
            elements.cryptoPriceElements.btcChange.textContent = changeText;
            elements.cryptoPriceElements.btcChangeWidget.textContent = changeText;
            
            // Update change color
            const changeClass = btc.change24h >= 0 ? 'positive' : 'negative';
            elements.cryptoPriceElements.btcChange.className = `chart-change ${changeClass}`;
            elements.cryptoPriceElements.btcChangeWidget.className = `price-change-large ${changeClass}`;
        }
    }

    updateBTCDetails(details) {
        elements.cryptoPriceElements.btcHigh.textContent = `Rp ${Math.round(details.high24h).toLocaleString('id-ID')}`;
        elements.cryptoPriceElements.btcLow.textContent = `Rp ${Math.round(details.low24h).toLocaleString('id-ID')}`;
        elements.cryptoPriceElements.btcVolume.textContent = `${(details.volume / 1000000000).toFixed(1)}B IDR`;
        elements.cryptoPriceElements.btcMarketCap.textContent = `Rp ${(details.marketCap / 1000000000000).toFixed(1)}T`;
    }

    updateGlobalStats() {
        // Hitung total market cap dan volume
        const totalMarketCap = appState.cryptoData.reduce((sum, crypto) => sum + crypto.marketCap, 0);
        const totalVolume = appState.cryptoData.reduce((sum, crypto) => sum + crypto.volume24h, 0);
        
        // BTC dominance
        const btc = appState.cryptoData.find(c => c.symbol === 'BTC');
        const btcDominance = btc ? (btc.marketCap / totalMarketCap * 100).toFixed(1) : '52.8';
        
        elements.globalStats.marketCap.textContent = `$${(totalMarketCap / 1000000000000).toFixed(1)}T`;
        elements.globalStats.volume.textContent = `$${(totalVolume / 1000000000).toFixed(1)}B`;
        elements.globalStats.dominance.textContent = `${btcDominance}%`;
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

    updatePaginationInfo() {
        const startItem = (appState.currentPage - 1) * appState.itemsPerPage + 1;
        const endItem = Math.min(appState.currentPage * appState.itemsPerPage, appState.filteredData.length);
        
        document.getElementById('startItem').textContent = startItem;
        document.getElementById('endItem').textContent = endItem;
        document.getElementById('totalItems').textContent = appState.filteredData.length;
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
                appState.filteredData = [...appState.cryptoData].sort((a, b) => b.volume24h - a.volume24h);
                break;
            default:
                appState.filteredData = [...appState.cryptoData];
        }
        
        appState.currentPage = 1;
        this.renderTable();
    }

    initChart() {
        const ctx = elements.btcChart.getContext('2d');
        
        // Data demo untuk chart
        const data = {
            labels: ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'],
            datasets: [{
                label: 'BTC Price',
                data: [1100000000, 1150000000, 1050000000, 950000000, 850000000, 700000000, 500000000],
                borderColor: '#2962ff',
                backgroundColor: 'rgba(41, 98, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `Rp ${context.raw.toLocaleString('id-ID')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                            color: 'rgba(255,255,255,0.7)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        },
                        ticks: {
                            color: 'rgba(255,255,255,0.7)',
                            callback: (value) => {
                                return `Rp ${(value / 1000000).toFixed(0)}M`;
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

    formatPrice(price) {
        if (appState.currentCurrency === 'IDR') {
            return `Rp ${Math.round(price).toLocaleString('id-ID')}`;
        } else {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: appState.currentCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 8
            }).format(price);
        }
    }

    formatNumber(num) {
        if (num >= 1000000000000) {
            return `$${(num / 1000000000000).toFixed(2)}T`;
        } else if (num >= 1000000000) {
            return `$${(num / 1000000000).toFixed(2)}B`;
        } else if (num >= 1000000) {
            return `$${(num / 1000000).toFixed(2)}M`;
        } else if (num >= 1000) {
            return `$${(num / 1000).toFixed(2)}K`;
        }
        return `$${num.toFixed(2)}`;
    }

    setTheme(theme) {
        appState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon
        const icon = elements.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    toggleTheme() {
        const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    startAutoUpdate() {
        setInterval(() => {
            this.loadData();
        }, CONFIG.updateInterval);
    }
}

// Initialize app ketika DOM siap
document.addEventListener('DOMContentLoaded', () => {
    window.cryptoApp = new CryptoMarketApp();
});

// Tambahkan beberapa fungsi utilitas global
window.formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

window.formatChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    const colorClass = change >= 0 ? 'positive' : 'negative';
    return {
        text: `${sign}${change.toFixed(2)}%`,
        class: colorClass,
        isPositive: change >= 0
    };
};
