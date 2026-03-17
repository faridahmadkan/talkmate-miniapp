// ==================== CONFIGURATION ====================
const CONFIG = {
    // Free APIs - No Keys Required
    WEATHER_API: 'https://api.open-meteo.com/v1/forecast',
    GEO_API: 'https://geocoding-api.open-meteo.com/v1/search',
    NEWS_API: 'https://gnews.io/api/v4/top-headlines',
    NEWS_API_KEY: 'pub_45510b243dd7ce29fdf845a2e7940cec57568',
    CRYPTO_API: 'https://api.coingecko.com/api/v3',
    QUOTE_API: 'https://api.quotable.io',
    JOKE_API: 'https://v2.jokeapi.dev/joke',
    FACT_API: 'https://uselessfacts.jsph.pl/api/v2/facts/random',
    NASA_API: 'https://api.nasa.gov/planetary/apod',
    NASA_KEY: 'DEMO_KEY',
    MOVIE_API: 'https://api.themoviedb.org/3',
    MOVIE_KEY: '5201df5afc74c55e69e8d95e878a67b5',
    TRIVIA_API: 'https://opentdb.com/api.php',
    DICTIONARY_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    TRANSLATE_API: 'https://api.mymemory.translated.net/get',
    QR_API: 'https://api.qrserver.com/v1/create-qr-code/',
    IP_API: 'https://api.ipify.org?format=json',
    IP_GEOLOCATION: 'https://ipapi.co/json/'
};

// ==================== TELEGRAM INTEGRATION ====================
let tg = null;
try {
    tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();
    }
} catch (e) {
    console.log('Not in Telegram');
}

// ==================== APP STATE ====================
const state = {
    currentPage: 'dashboard',
    darkMode: localStorage.getItem('darkMode') === 'true',
    user: {
        name: 'Explorer',
        points: parseInt(localStorage.getItem('userPoints')) || 1250,
        level: 5,
        achievements: parseInt(localStorage.getItem('achievements')) || 8,
        streak: parseInt(localStorage.getItem('streak')) || 7,
        favorites: JSON.parse(localStorage.getItem('favorites')) || []
    },
    weather: {
        city: localStorage.getItem('lastCity') || 'Kabul',
        unit: 'celsius'
    },
    games: {
        snake: { score: 0, highScore: parseInt(localStorage.getItem('snakeHighScore')) || 0 },
        tetris: { score: 0, highScore: parseInt(localStorage.getItem('tetrisHighScore')) || 0 },
        memory: { moves: 0, matches: 0 },
        game2048: { score: 0, best: parseInt(localStorage.getItem('2048Best')) || 0 }
    },
    activity: JSON.parse(localStorage.getItem('activity')) || []
};

// ==================== DOM ELEMENTS ====================
const elements = {
    splash: document.getElementById('splashScreen'),
    mainApp: document.getElementById('mainApp'),
    header: document.getElementById('header'),
    sideMenu: document.getElementById('sideMenu'),
    overlay: document.getElementById('overlay'),
    menuToggle: document.getElementById('menuToggle'),
    closeMenu: document.getElementById('closeMenu'),
    themeToggle: document.getElementById('themeToggle'),
    notificationBell: document.getElementById('notificationBell'),
    globalSearch: document.getElementById('globalSearch'),
    searchResults: document.getElementById('searchResults'),
    navBtns: document.querySelectorAll('.nav-btn'),
    menuItems: document.querySelectorAll('.menu-item'),
    pages: document.querySelectorAll('.page'),
    toastContainer: document.getElementById('toastContainer'),
    achievementPopup: document.getElementById('achievementPopup'),
    achievementName: document.getElementById('achievementName'),
    currentDateTime: document.getElementById('currentDateTime')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Show splash screen with tips
    const tips = [
        'Loading galaxies...',
        'Connecting to APIs...',
        'Preparing games...',
        'Gathering facts...',
        'Almost ready...'
    ];
    
    let tipIndex = 0;
    const tipElement = document.querySelector('.loading-tip');
    const tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % tips.length;
        tipElement.textContent = tips[tipIndex];
    }, 400);
    
    // Initialize particles
    if (window.particlesJS) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: '#6366f1' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: false },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: '#6366f1', opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: false, straight: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'repulse' } }
            }
        });
    }
    
    // Load initial data
    await Promise.all([
        updateDateTime(),
        loadUserData(),
        loadQuickStats()
    ]);
    
    // Hide splash screen
    setTimeout(() => {
        clearInterval(tipInterval);
        elements.splash.style.display = 'none';
        elements.mainApp.style.display = 'block';
        showToast('Welcome to TalkMate Universe!', 'success');
    }, 2500);
    
    // Apply saved theme
    applyTheme();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load current page data
    loadPageData('dashboard');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Menu toggles
    elements.menuToggle.addEventListener('click', toggleMenu);
    elements.closeMenu.addEventListener('click', toggleMenu);
    elements.overlay.addEventListener('click', toggleMenu);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            navigateTo(page);
        });
    });
    
    elements.menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
            toggleMenu();
        });
    });
    
    // Global search
    elements.globalSearch.addEventListener('input', debounce(handleSearch, 500));
    
    // Notification bell
    elements.notificationBell.addEventListener('click', showNotifications);
    
    // Settings
    document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
        state.darkMode = e.target.checked;
        applyTheme();
    });
    
    document.getElementById('clearCache')?.addEventListener('click', clearCache);
    document.getElementById('exportData')?.addEventListener('click', exportUserData);
    
    // Page specific listeners
    setupPageListeners();
}

function setupPageListeners() {
    // Weather
    document.getElementById('weatherSearchBtn')?.addEventListener('click', () => {
        const city = document.getElementById('weatherSearch').value;
        if (city) getWeather(city);
    });
    
    document.getElementById('weatherSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = e.target.value;
            if (city) getWeather(city);
        }
    });
    
    // News
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            getNews(btn.dataset.category);
        });
    });
    
    // Facts
    document.getElementById('refreshFact')?.addEventListener('click', getRandomFact);
    document.querySelectorAll('.fact-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => getFactByCategory(btn.dataset.cat));
    });
    
    // Jokes
    document.getElementById('nextJoke')?.addEventListener('click', getRandomJoke);
    document.getElementById('revealJoke')?.addEventListener('click', revealPunchline);
    document.querySelectorAll('.joke-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.joke-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            getJokeByType(btn.dataset.type);
        });
    });
    
    // Quotes
    document.getElementById('refreshQuote')?.addEventListener('click', getRandomQuote);
    document.getElementById('quoteCategory')?.addEventListener('change', getQuoteByCategory);
    
    // Crypto
    document.getElementById('refreshCrypto')?.addEventListener('click', getCryptoPrices);
    document.getElementById('convertCrypto')?.addEventListener('click', convertCrypto);
    
    // Movies
    document.getElementById('searchMovies')?.addEventListener('click', searchMovies);
    document.querySelectorAll('.movie-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.movie-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            getMovies(btn.dataset.cat);
        });
    });
    
    // Trivia
    document.getElementById('startTrivia')?.addEventListener('click', startTrivia);
    
    // Dictionary
    document.getElementById('searchWord')?.addEventListener('click', searchWord);
    document.getElementById('wordSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWord();
    });
    
    // Translator
    document.getElementById('translateBtn')?.addEventListener('click', translateText);
    document.getElementById('swapLangs')?.addEventListener('click', swapLanguages);
    
    // QR Generator
    document.getElementById('generateQR')?.addEventListener('click', generateQR);
    document.getElementById('downloadQR')?.addEventListener('click', downloadQR);
    
    // Password Generator
    document.getElementById('generatePassword')?.addEventListener('click', generatePassword);
    document.getElementById('copyPassword')?.addEventListener('click', copyPassword);
    document.getElementById('passwordLength')?.addEventListener('input', (e) => {
        document.getElementById('lengthValue').textContent = e.target.value;
    });
}

// ==================== NAVIGATION ====================
function navigateTo(page, gameType = null) {
    // Update active states
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    elements.menuItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Hide all pages
    elements.pages.forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = page;
        
        // Load page data
        loadPageData(page, gameType);
    }
    
    // Close menu if open
    if (elements.sideMenu.classList.contains('active')) {
        toggleMenu();
    }
    
    // Add to activity
    addActivity('navigation', `Navigated to ${page}`);
}

function loadPageData(page, gameType = null) {
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'weather':
            getWeather(state.weather.city);
            break;
        case 'news':
            getNews('general');
            break;
        case 'games':
            if (gameType) {
                setTimeout(() => startGame(gameType), 100);
            }
            break;
        case 'facts':
            getRandomFact();
            break;
        case 'jokes':
            getRandomJoke();
            break;
        case 'quotes':
            getRandomQuote();
            break;
        case 'crypto':
            getCryptoPrices();
            break;
        case 'movies':
            getMovies('popular');
            break;
        case 'dictionary':
            searchWord('hello');
            break;
        case 'password':
            generatePassword();
            break;
    }
}

// ==================== THEME FUNCTIONS ====================
function toggleTheme() {
    state.darkMode = !state.darkMode;
    applyTheme();
    localStorage.setItem('darkMode', state.darkMode);
}

function applyTheme() {
    document.body.classList.toggle('dark-mode', state.darkMode);
    const icon = elements.themeToggle.querySelector('i');
    icon.className = state.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    
    // Update dark mode toggle in settings
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) darkModeToggle.checked = state.darkMode;
}

// ==================== MENU FUNCTIONS ====================
function toggleMenu() {
    elements.sideMenu.classList.toggle('active');
    elements.overlay.classList.toggle('active');
}

// ==================== USER FUNCTIONS ====================
function loadUserData() {
    document.getElementById('profileName').textContent = state.user.name;
    document.getElementById('userPoints').textContent = state.user.points;
    document.getElementById('userLevel').textContent = state.user.level;
    document.getElementById('userAchievements').textContent = state.user.achievements;
    document.getElementById('userStreak').textContent = state.user.streak;
}

function addActivity(type, description) {
    const activity = {
        type,
        description,
        timestamp: new Date().toISOString()
    };
    
    state.activity.unshift(activity);
    if (state.activity.length > 10) state.activity.pop();
    
    localStorage.setItem('activity', JSON.stringify(state.activity));
    updateActivityFeed();
}

function updateActivityFeed() {
    const feed = document.getElementById('activityList');
    if (!feed) return;
    
    feed.innerHTML = state.activity.map(act => `
        <div class="activity-item">
            <i class="fas fa-${getActivityIcon(act.type)}" style="color: var(--primary)"></i>
            <span>${act.description}</span>
            <small>${moment(act.timestamp).fromNow()}</small>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        navigation: 'compass',
        weather: 'cloud-sun',
        news: 'newspaper',
        game: 'gamepad',
        fact: 'lightbulb',
        joke: 'laugh',
        quote: 'quote-right',
        achievement: 'trophy'
    };
    return icons[type] || 'circle';
}

function addPoints(points) {
    state.user.points += points;
    state.user.level = Math.floor(state.user.points / 500) + 1;
    
    document.getElementById('userPoints').textContent = state.user.points;
    document.getElementById('userLevel').textContent = state.user.level;
    
    localStorage.setItem('userPoints', state.user.points);
    
    // Check for level up
    if (state.user.points % 500 < points) {
        showAchievement(`Level ${state.user.level} Reached!`);
    }
}

function showAchievement(name) {
    state.user.achievements++;
    document.getElementById('userAchievements').textContent = state.user.achievements;
    localStorage.setItem('achievements', state.user.achievements);
    
    elements.achievementName.textContent = name;
    elements.achievementPopup.classList.add('show');
    
    setTimeout(() => {
        elements.achievementPopup.classList.remove('show');
    }, 3000);
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${type.toUpperCase()}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// ==================== SEARCH ====================
async function handleSearch(e) {
    const query = e.target.value.trim();
    if (query.length < 2) {
        elements.searchResults.classList.remove('show');
        return;
    }
    
    // Search across multiple sources
    const results = [];
    
    // Search news
    try {
        const newsRes = await axios.get(`${CONFIG.NEWS_API}?q=${query}&token=${CONFIG.NEWS_API_KEY}&max=3`);
        if (newsRes.data.articles) {
            results.push(...newsRes.data.articles.map(a => ({
                type: 'news',
                title: a.title,
                url: a.url
            })));
        }
    } catch (e) {}
    
    // Search dictionary
    try {
        const dictRes = await axios.get(`${CONFIG.DICTIONARY_API}/${query}`);
        if (dictRes.data[0]) {
            results.push({
                type: 'dictionary',
                title: dictRes.data[0].word,
                definition: dictRes.data[0].meanings[0].definitions[0].definition
            });
        }
    } catch (e) {}
    
    // Display results
    if (results.length > 0) {
        elements.searchResults.innerHTML = results.map(r => `
            <div class="search-result-item" onclick="handleResultClick('${r.type}', '${r.title}')">
                <i class="fas fa-${r.type === 'news' ? 'newspaper' : 'book'}"></i>
                <span>${r.title}</span>
            </div>
        `).join('');
        elements.searchResults.classList.add('show');
    } else {
        elements.searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        elements.searchResults.classList.add('show');
    }
}

function handleResultClick(type, value) {
    if (type === 'news') {
        navigateTo('news');
        document.querySelector('.category-btn[data-category="general"]').click();
    }
    elements.globalSearch.value = '';
    elements.searchResults.classList.remove('show');
}

// ==================== DASHBOARD ====================
async function loadDashboardData() {
    updateDateTime();
    updateActivityFeed();
    
    // Load quick stats
    await loadQuickStats();
    
    // Load daily content
    getRandomQuote();
    getRandomFact();
    getRandomJoke();
}

function updateDateTime() {
    if (elements.currentDateTime) {
        elements.currentDateTime.textContent = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
    }
    setTimeout(updateDateTime, 1000);
}

async function loadQuickStats() {
    try {
        // Quick weather
        const weather = await getWeather(state.weather.city, true);
        document.getElementById('quickWeather').textContent = weather ? `${weather.temp}°C, ${weather.condition}` : 'Loading...';
        
        // Quick news
        const news = await getNews('general', true);
        document.getElementById('quickNews').textContent = news ? `${news.total} articles` : 'Loading...';
        
        // Quick crypto
        const crypto = await getCryptoPrices(true);
        if (crypto && crypto.bitcoin) {
            document.getElementById('quickBtc').textContent = `$${crypto.bitcoin.usd.toLocaleString()}`;
        }
    } catch (e) {
        console.log('Quick stats error:', e);
    }
}

// ==================== WEATHER FUNCTIONS ====================
async function getWeather(city, quick = false) {
    try {
        // Get coordinates
        const geoRes = await axios.get(CONFIG.GEO_API, {
            params: { name: city, count: 1 }
        });
        
        if (!geoRes.data.results || geoRes.data.results.length === 0) {
            throw new Error('City not found');
        }
        
        const { latitude, longitude, name, country } = geoRes.data.results[0];
        
        // Get weather data
        const weatherRes = await axios.get(CONFIG.WEATHER_API, {
            params: {
                latitude,
                longitude,
                current_weather: true,
                hourly: 'temperature_2m,relativehumidity_2m,weathercode,windspeed_10m',
                daily: 'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset',
                timezone: 'auto'
            }
        });
        
        const data = weatherRes.data;
        state.weather.city = city;
        localStorage.setItem('lastCity', city);
        
        if (quick) {
            return {
                temp: Math.round(data.current_weather.temperature),
                condition: getWeatherCondition(data.current_weather.weathercode)
            };
        }
        
        displayWeather(data, name, country);
        addActivity('weather', `Checked weather in ${name}`);
        addPoints(10);
        
        return data;
    } catch (error) {
        console.error('Weather error:', error);
        if (!quick) {
            document.getElementById('currentWeather').innerHTML = '<div class="error">❌ City not found</div>';
        }
        return null;
    }
}

function getWeatherCondition(code) {
    const conditions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        95: 'Thunderstorm'
    };
    return conditions[code] || 'Unknown';
}

function getWeatherIcon(code, isDay = true) {
    const icons = {
        0: isDay ? 'sun' : 'moon',
        1: isDay ? 'cloud-sun' : 'cloud-moon',
        2: 'cloud',
        3: 'cloud',
        45: 'smog',
        48: 'smog',
        51: 'cloud-rain',
        53: 'cloud-rain',
        55: 'cloud-showers-heavy',
        61: 'cloud-rain',
        63: 'cloud-rain',
        65: 'cloud-showers-heavy',
        71: 'snowflake',
        73: 'snowflake',
        75: 'snowflake',
        95: 'bolt'
    };
    return icons[code] || 'cloud';
}

function displayWeather(data, city, country) {
    const current = data.current_weather;
    const hourly = data.hourly;
    const daily = data.daily;
    const isDay = current.time.includes('T') ? parseInt(current.time.split('T')[1]) > 6 && parseInt(current.time.split('T')[1]) < 18 : true;
    
    // Current weather
    document.getElementById('currentWeather').innerHTML = `
        <div class="weather-main">
            <div>
                <div class="weather-temp">${Math.round(current.temperature)}°C</div>
                <div class="weather-city">${city}, ${country}</div>
                <div class="weather-desc">${getWeatherCondition(current.weathercode)}</div>
            </div>
            <div class="weather-icon">
                <i class="fas fa-${getWeatherIcon(current.weathercode, isDay)}"></i>
            </div>
        </div>
    `;
    
    // Weather details
    document.getElementById('weatherDetails').innerHTML = `
        <h3>Weather Details</h3>
        <div class="weather-detail-item">
            <span>Wind Speed</span>
            <span>${current.windspeed} km/h</span>
        </div>
        <div class="weather-detail-item">
            <span>Humidity</span>
            <span>${hourly.relativehumidity_2m[0]}%</span>
        </div>
        <div class="weather-detail-item">
            <span>Pressure</span>
            <span>1013 hPa</span>
        </div>
        <div class="weather-detail-item">
            <span>Visibility</span>
            <span>10 km</span>
        </div>
        <div class="weather-detail-item">
            <span>UV Index</span>
            <span>5 (Moderate)</span>
        </div>
    `;
    
    // Forecast
    const forecastHTML = daily.time.map((day, i) => `
        <div class="forecast-item">
            <div class="forecast-day">${moment(day).format('ddd')}</div>
            <i class="fas fa-${getWeatherIcon(daily.weathercode[i])}"></i>
            <div class="forecast-temp">${Math.round(daily.temperature_2m_max[i])}°/${Math.round(daily.temperature_2m_min[i])}°</div>
        </div>
    `).join('');
    
    document.getElementById('forecastList').innerHTML = forecastHTML;
    
    // Air Quality (mock data for now)
    document.getElementById('airQualityData').innerHTML = `
        <div class="air-quality-value">42</div>
        <div>Good</div>
        <small>PM2.5: 12 µg/m³</small>
    `;
    
    // UV Index
    document.getElementById('uvData').innerHTML = `
        <div class="uv-value">5</div>
        <div>Moderate</div>
        <small>Use sunscreen</small>
    `;
    
    // Weather map (simple visualization)
    drawWeatherMap();
}

function drawWeatherMap() {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    // Draw simple weather map
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw temperature gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(0.5, '#f59e0b');
    gradient.addColorStop(1, '#ef4444');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some clouds
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(100, 100, 30, 0, Math.PI * 2);
    ctx.arc(140, 90, 25, 0, Math.PI * 2);
    ctx.arc(70, 80, 20, 0, Math.PI * 2);
    ctx.fill();
}

// ==================== NEWS FUNCTIONS ====================
async function getNews(category, quick = false) {
    try {
        const response = await axios.get(CONFIG.NEWS_API, {
            params: {
                category: category,
                lang: 'en',
                country: 'us',
                max: 12,
                token: CONFIG.NEWS_API_KEY
            }
        });
        
        const articles = response.data.articles;
        
        if (quick) {
            return { total: articles.length };
        }
        
        displayNews(articles);
        addActivity('news', `Read ${category} news`);
        addPoints(5);
        
        return articles;
    } catch (error) {
        console.error('News error:', error);
        if (!quick) {
            getFallbackNews();
        }
        return null;
    }
}

function displayNews(articles) {
    const grid = document.getElementById('newsGrid');
    
    if (!articles || articles.length === 0) {
        grid.innerHTML = '<div class="loading">No news available</div>';
        return;
    }
    
    grid.innerHTML = articles.map(article => `
        <div class="news-card" onclick="window.open('${article.url}', '_blank')">
            <img src="${article.image || 'https://via.placeholder.com/300x200?text=News'}" 
                 alt="${article.title}" 
                 class="news-image"
                 onerror="this.src='https://via.placeholder.com/300x200?text=News'">
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || 'Click to read more'}</p>
                <div class="news-meta">
                    <span class="news-source">${article.source.name || 'News'}</span>
                    <span class="news-date">${moment(article.publishedAt).fromNow()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getFallbackNews() {
    const fallback = [
        {
            title: 'Global Tech Summit Highlights AI Advancements',
            source: { name: 'Tech News' },
            description: 'World leaders discuss future of artificial intelligence.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Tech+News',
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Breakthrough in Renewable Energy Research',
            source: { name: 'Science Daily' },
            description: 'Scientists announce major breakthrough in solar efficiency.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Science',
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Space Mission Discovers New Exoplanet',
            source: { name: 'Space News' },
            description: 'NASA telescope finds Earth-like planet in habitable zone.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Space',
            publishedAt: new Date().toISOString()
        }
    ];
    
    displayNews(fallback);
}

// ==================== FACT FUNCTIONS ====================
async function getRandomFact() {
    try {
        const response = await axios.get(CONFIG.FACT_API);
        displayFact(response.data);
    } catch (error) {
        // Fallback facts
        const facts = [
            { text: 'Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs, still edible!', source: 'history' },
            { text: 'Octopuses have three hearts and blue blood.', source: 'animals' },
            { text: 'Bananas are berries, but strawberries are not.', source: 'science' },
            { text: 'A day on Venus is longer than a year on Venus.', source: 'space' },
            { text: 'The first computer virus was created in 1983.', source: 'technology' }
        ];
        displayFact(facts[Math.floor(Math.random() * facts.length)]);
    }
}

async function getFactByCategory(category) {
    // Using fallback for category-based facts
    const facts = {
        science: ['The human stomach gets a new lining every 3-4 days.', 'Hot water freezes faster than cold water (Mpemba effect).'],
        history: ['Cleopatra lived closer to the moon landing than to the construction of the pyramids.', 'The Great Wall of China is not visible from space.'],
        animals: ['A group of flamingos is called a "flamboyance".', 'Sloths can hold their breath longer than dolphins.'],
        space: ['There is a planet made of diamonds (55 Cancri e).', 'One day on Mercury is equivalent to 59 Earth days.'],
        technology: ['The first 1GB hard drive weighed over 500 pounds.', 'More people have cell phones than toilets.']
    };
    
    const categoryFacts = facts[category] || facts.science;
    const fact = categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
    
    displayFact({ text: fact, source: category });
}

function displayFact(fact) {
    document.getElementById('factText').textContent = fact.text;
    document.getElementById('factCategory').textContent = fact.source || 'Interesting Fact';
    
    // Add to history
    const history = document.getElementById('factHistory');
    if (history) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = fact.text.substring(0, 50) + '...';
        history.insertBefore(historyItem, history.firstChild);
        
        if (history.children.length > 5) {
            history.removeChild(history.lastChild);
        }
    }
    
    addActivity('fact', 'Learned a new fact');
    addPoints(5);
}

// ==================== JOKE FUNCTIONS ====================
async function getRandomJoke() {
    try {
        const response = await axios.get(`${CONFIG.JOKE_API}/Any?type=twopart`);
        displayJoke(response.data);
    } catch (error) {
        // Fallback jokes
        const jokes = [
            { setup: 'Why do programmers prefer dark mode?', delivery: 'Because light attracts bugs!' },
            { setup: 'What do you call a fake noodle?', delivery: 'An impasta!' },
            { setup: 'Why did the scarecrow win an award?', delivery: 'Because he was outstanding in his field!' }
        ];
        displayJoke(jokes[Math.floor(Math.random() * jokes.length)]);
    }
}

async function getJokeByType(type) {
    try {
        const response = await axios.get(`${CONFIG.JOKE_API}/${type}?type=twopart`);
        displayJoke(response.data);
    } catch (error) {
        getRandomJoke();
    }
}

function displayJoke(joke) {
    document.getElementById('jokeSetup').textContent = joke.setup;
    document.getElementById('jokePunchline').textContent = joke.delivery;
    document.getElementById('jokePunchline').classList.remove('revealed');
    document.getElementById('revealJoke').style.display = 'inline-block';
    
    // Update stats
    const jokesToday = parseInt(document.getElementById('jokesToday').textContent) || 0;
    document.getElementById('jokesToday').textContent = jokesToday + 1;
}

function revealPunchline() {
    document.getElementById('jokePunchline').classList.add('revealed');
    document.getElementById('revealJoke').style.display = 'none';
    
    addActivity('joke', 'Told a joke');
    addPoints(5);
}

function saveJokeToFavorites() {
    const setup = document.getElementById('jokeSetup').textContent;
    const punchline = document.getElementById('jokePunchline').textContent;
    
    const joke = { setup, punchline };
    state.user.favorites.push(joke);
    localStorage.setItem('favorites', JSON.stringify(state.user.favorites));
    
    updateFavoritesList();
    showToast('Joke saved to favorites!', 'success');
}

function updateFavoritesList() {
    const list = document.getElementById('favoriteJokesList');
    if (!list) return;
    
    list.innerHTML = state.user.favorites.map((joke, index) => `
        <div class="favorite-item">
            <span>${joke.setup.substring(0, 30)}...</span>
            <button onclick="removeFavorite(${index})"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

function removeFavorite(index) {
    state.user.favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(state.user.favorites));
    updateFavoritesList();
}

// ==================== QUOTE FUNCTIONS ====================
async function getRandomQuote() {
    try {
        const response = await axios.get(`${CONFIG.QUOTE_API}/random`);
        displayQuote(response.data);
    } catch (error) {
        // Fallback quotes
        const quotes = [
            { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
            { content: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
            { content: 'The future depends on what you do today.', author: 'Mahatma Gandhi' }
        ];
        displayQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
}

async function getQuoteByCategory() {
    const category = document.getElementById('quoteCategory').value;
    try {
        const response = await axios.get(`${CONFIG.QUOTE_API}/quotes?tag=${category}&limit=1`);
        if (response.data.results && response.data.results.length > 0) {
            displayQuote(response.data.results[0]);
        } else {
            getRandomQuote();
        }
    } catch (error) {
        getRandomQuote();
    }
}

function displayQuote(quote) {
    document.getElementById('quoteText').textContent = `"${quote.content}"`;
    document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
    
    addActivity('quote', 'Read an inspirational quote');
    addPoints(5);
}

function shareQuote() {
    const quote = document.getElementById('quoteText').textContent;
    const author = document.getElementById('quoteAuthor').textContent;
    
    if (navigator.share) {
        navigator.share({
            title: 'Inspirational Quote',
            text: `${quote} ${author}`,
        });
    } else {
        navigator.clipboard.writeText(`${quote} ${author}`);
        showToast('Quote copied to clipboard!', 'success');
    }
}

function saveQuote() {
    const quote = document.getElementById('quoteText').textContent;
    const author = document.getElementById('quoteAuthor').textContent;
    
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];
    savedQuotes.push({ quote, author });
    localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));
    
    updateSavedQuotes();
    showToast('Quote saved!', 'success');
}

function updateSavedQuotes() {
    const list = document.getElementById('savedQuotesList');
    if (!list) return;
    
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];
    list.innerHTML = savedQuotes.map(q => `
        <div class="saved-quote-item">
            <p>"${q.quote.substring(0, 50)}..."</p>
            <small>— ${q.author}</small>
        </div>
    `).join('');
}

// ==================== CRYPTO FUNCTIONS ====================
async function getCryptoPrices(quick = false) {
    try {
        const response = await axios.get(`${CONFIG.CRYPTO_API}/simple/price`, {
            params: {
                ids: 'bitcoin,ethereum,cardano,ripple,dogecoin,solana',
                vs_currencies: 'usd',
                include_24hr_change: true
            }
        });
        
        const data = response.data;
        
        if (quick) {
            return data;
        }
        
        displayCryptoPrices(data);
        return data;
    } catch (error) {
        console.error('Crypto error:', error);
        if (!quick) {
            getFallbackCrypto();
        }
        return null;
    }
}

function displayCryptoPrices(data) {
    const grid = document.getElementById('cryptoGrid');
    const cryptos = [
        { id: 'bitcoin', name: 'Bitcoin', icon: 'fab fa-bitcoin' },
        { id: 'ethereum', name: 'Ethereum', icon: 'fab fa-ethereum' },
        { id: 'cardano', name: 'Cardano', icon: 'fas fa-circle' },
        { id: 'ripple', name: 'XRP', icon: 'fas fa-circle' },
        { id: 'dogecoin', name: 'Dogecoin', icon: 'fas fa-dog' },
        { id: 'solana', name: 'Solana', icon: 'fas fa-sun' }
    ];
    
    grid.innerHTML = cryptos.map(crypto => {
        const coin = data[crypto.id];
        if (!coin) return '';
        
        const changeClass = coin.usd_24h_change >= 0 ? 'positive' : 'negative';
        const changeIcon = coin.usd_24h_change >= 0 ? 'arrow-up' : 'arrow-down';
        
        return `
            <div class="crypto-card">
                <div class="crypto-icon">
                    <i class="${crypto.icon}"></i>
                </div>
                <div class="crypto-info">
                    <h3>${crypto.name}</h3>
                    <div class="crypto-price">$${coin.usd.toLocaleString()}</div>
                    <div class="crypto-change ${changeClass}">
                        <i class="fas fa-${changeIcon}"></i>
                        ${Math.abs(coin.usd_24h_change).toFixed(2)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getFallbackCrypto() {
    const data = {
        bitcoin: { usd: 43250, usd_24h_change: 2.5 },
        ethereum: { usd: 2250, usd_24h_change: -1.2 },
        cardano: { usd: 0.45, usd_24h_change: 5.8 },
        ripple: { usd: 0.52, usd_24h_change: -0.5 },
        dogecoin: { usd: 0.08, usd_24h_change: 1.5 },
        solana: { usd: 98, usd_24h_change: 3.2 }
    };
    displayCryptoPrices(data);
}

async function convertCrypto() {
    const amount = document.getElementById('cryptoAmount').value;
    const from = document.getElementById('cryptoFrom').value;
    const to = document.getElementById('cryptoTo').value;
    
    try {
        const response = await axios.get(`${CONFIG.CRYPTO_API}/simple/price`, {
            params: {
                ids: from,
                vs_currencies: to
            }
        });
        
        const rate = response.data[from][to];
        const result = amount * rate;
        
        document.getElementById('conversionResult').innerHTML = `
            ${amount} ${from.toUpperCase()} = ${result.toFixed(2)} ${to.toUpperCase()}
        `;
    } catch (error) {
        document.getElementById('conversionResult').innerHTML = 'Conversion failed';
    }
}

// ==================== MOVIE FUNCTIONS ====================
async function getMovies(category) {
    try {
        const response = await axios.get(`${CONFIG.MOVIE_API}/movie/${category}`, {
            params: {
                api_key: CONFIG.MOVIE_KEY,
                language: 'en-US',
                page: 1
            }
        });
        
        displayMovies(response.data.results);
    } catch (error) {
        console.error('Movie error:', error);
        getFallbackMovies();
    }
}

async function searchMovies() {
    const query = document.getElementById('movieSearch').value;
    if (!query) return;
    
    try {
        const response = await axios.get(`${CONFIG.MOVIE_API}/search/movie`, {
            params: {
                api_key: CONFIG.MOVIE_KEY,
                query: query,
                language: 'en-US'
            }
        });
        
        displayMovies(response.data.results);
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displayMovies(movies) {
    const grid = document.getElementById('moviesGrid');
    
    grid.innerHTML = movies.slice(0, 12).map(movie => `
        <div class="movie-card" onclick="showMovieDetails(${movie.id})">
            <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">
            <div class="movie-info">
                <h4 class="movie-title">${movie.title}</h4>
                <div class="movie-rating">
                    <i class="fas fa-star"></i>
                    <span>${movie.vote_average.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getFallbackMovies() {
    const movies = [
        { title: 'Inception', poster_path: '', vote_average: 8.8, id: 1 },
        { title: 'The Dark Knight', poster_path: '', vote_average: 9.0, id: 2 },
        { title: 'Interstellar', poster_path: '', vote_average: 8.6, id: 3 },
        { title: 'The Matrix', poster_path: '', vote_average: 8.7, id: 4 }
    ];
    displayMovies(movies);
}

// ==================== TRIVIA FUNCTIONS ====================
let triviaQuestions = [];
let triviaCurrent = 0;
let triviaScore = 0;

async function startTrivia() {
    const category = document.getElementById('triviaCategory').value;
    const difficulty = document.getElementById('triviaDifficulty').value;
    
    try {
        const response = await axios.get(CONFIG.TRIVIA_API, {
            params: {
                amount: 10,
                category: category,
                difficulty: difficulty,
                type: 'multiple'
            }
        });
        
        triviaQuestions = response.data.results;
        triviaCurrent = 0;
        triviaScore = 0;
        
        displayTriviaQuestion();
    } catch (error) {
        console.error('Trivia error:', error);
        showToast('Failed to load trivia questions', 'error');
    }
}

function displayTriviaQuestion() {
    if (triviaCurrent >= triviaQuestions.length) {
        showTriviaResults();
        return;
    }
    
    const question = triviaQuestions[triviaCurrent];
    const options = [...question.incorrect_answers, question.correct_answer];
    const shuffled = options.sort(() => Math.random() - 0.5);
    
    document.getElementById('triviaQuestion').innerHTML = question.question;
    document.getElementById('triviaOptions').innerHTML = shuffled.map(opt => `
        <div class="trivia-option" onclick="checkTriviaAnswer('${opt}', '${question.correct_answer}')">
            ${opt}
        </div>
    `).join('');
    
    document.getElementById('triviaScore').textContent = triviaScore;
    document.getElementById('triviaCurrent').textContent = triviaCurrent + 1;
    document.getElementById('triviaTotal').textContent = triviaQuestions.length;
}

function checkTriviaAnswer(selected, correct) {
    const options = document.querySelectorAll('.trivia-option');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.textContent === correct) {
            opt.classList.add('correct');
        } else if (opt.textContent === selected && selected !== correct) {
            opt.classList.add('wrong');
        }
    });
    
    if (selected === correct) {
        triviaScore += 10;
        showToast('Correct! +10 points', 'success');
    } else {
        showToast(`Wrong! Correct answer: ${correct}`, 'error');
    }
    
    document.getElementById('triviaScore').textContent = triviaScore;
    
    setTimeout(() => {
        triviaCurrent++;
        displayTriviaQuestion();
    }, 2000);
}

function showTriviaResults() {
    document.getElementById('triviaContainer').innerHTML = `
        <div style="text-align: center">
            <h2>Quiz Complete!</h2>
            <p>Your Score: ${triviaScore}/100</p>
            <button onclick="startTrivia()" class="start-game-btn">Play Again</button>
        </div>
    `;
    
    addActivity('trivia', `Scored ${triviaScore} in trivia`);
    addPoints(triviaScore);
}

// ==================== DICTIONARY FUNCTIONS ====================
async function searchWord(word) {
    word = word || document.getElementById('wordSearch').value;
    if (!word) return;
    
    try {
        const response = await axios.get(`${CONFIG.DICTIONARY_API}/${word}`);
        displayWordDefinition(response.data[0]);
    } catch (error) {
        document.getElementById('dictionaryContainer').innerHTML = `
            <div class="error">Word not found</div>
        `;
    }
}

function displayWordDefinition(data) {
    const word = data.word;
    const phonetic = data.phonetic || '';
    const meanings = data.meanings;
    
    let html = `
        <div class="word-header">
            <h2 class="word-title">${word}</h2>
            <span class="word-phonetic">${phonetic}</span>
        </div>
    `;
    
    meanings.forEach(meaning => {
        html += `
            <h3 class="part-of-speech">${meaning.partOfSpeech}</h3>
        `;
        
        meaning.definitions.slice(0, 3).forEach(def => {
            html += `
                <div class="definition-item">
                    <p>${def.definition}</p>
                    ${def.example ? `<p class="example">"${def.example}"</p>` : ''}
                </div>
            `;
        });
    });
    
    document.getElementById('dictionaryContainer').innerHTML = html;
    addActivity('dictionary', `Looked up word: ${word}`);
    addPoints(5);
}

// ==================== TRANSLATOR FUNCTIONS ====================
async function translateText() {
    const sourceText = document.getElementById('sourceText').value;
    const sourceLang = document.getElementById('sourceLang').value;
    const targetLang = document.getElementById('targetLang').value;
    
    if (!sourceText) return;
    
    try {
        const response = await axios.get(CONFIG.TRANSLATE_API, {
            params: {
                q: sourceText,
                langpair: `${sourceLang}|${targetLang}`
            }
        });
        
        document.getElementById('targetText').value = response.data.responseData.translatedText;
        addActivity('translation', 'Translated text');
    } catch (error) {
        console.error('Translation error:', error);
        showToast('Translation failed', 'error');
    }
}

function swapLanguages() {
    const source = document.getElementById('sourceLang');
    const target = document.getElementById('targetLang');
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    
    [source.value, target.value] = [target.value, source.value];
    [sourceText.value, targetText.value] = [targetText.value, sourceText.value];
}

// ==================== QR GENERATOR FUNCTIONS ====================
function generateQR() {
    const text = document.getElementById('qrText').value;
    const size = document.getElementById('qrSize').value;
    
    if (!text) {
        showToast('Please enter text or URL', 'warning');
        return;
    }
    
    const qrUrl = `${CONFIG.QR_API}?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    document.getElementById('qrPreview').innerHTML = `<img src="${qrUrl}" alt="QR Code">`;
    
    addActivity('qr', 'Generated QR code');
    addPoints(5);
}

function downloadQR() {
    const img = document.querySelector('#qrPreview img');
    if (!img) {
        showToast('Generate a QR code first', 'warning');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = img.src;
    link.click();
}

// ==================== PASSWORD GENERATOR ====================
function generatePassword() {
    const length = document.getElementById('passwordLength').value;
    const includeUppercase = document.getElementById('includeUppercase').checked;
    const includeLowercase = document.getElementById('includeLowercase').checked;
    const includeNumbers = document.getElementById('includeNumbers').checked;
    const includeSymbols = document.getElementById('includeSymbols').checked;
    
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;
    
    if (chars === '') {
        showToast('Select at least one character type', 'warning');
        return;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    document.getElementById('passwordOutput').value = password;
    updatePasswordStrength(password);
}

function updatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengthMeter = document.getElementById('strengthMeter').querySelector('.strength-bar');
    const strengthText = document.getElementById('strengthText');
    
    const percentage = (strength / 6) * 100;
    strengthMeter.style.width = `${percentage}%`;
    
    if (strength <= 2) {
        strengthMeter.className = 'strength-bar weak';
        strengthText.textContent = 'Weak';
    } else if (strength <= 4) {
        strengthMeter.className = 'strength-bar medium';
        strengthText.textContent = 'Medium';
    } else {
        strengthMeter.className = 'strength-bar strong';
        strengthText.textContent = 'Strong';
    }
}

function copyPassword() {
    const password = document.getElementById('passwordOutput').value;
    if (!password) {
        showToast('Generate a password first', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(password);
    showToast('Password copied to clipboard!', 'success');
}

// ==================== GAME FUNCTIONS ====================
function startGame(gameType) {
    switch(gameType) {
        case 'snake':
            startSnake();
            break;
        case 'tetris':
            startTetris();
            break;
        case 'memory':
            initMemoryGame();
            break;
        case '2048':
            start2048();
            break;
    }
}

// Snake Game
let snakeCanvas, snakeCtx;
let snake, snakeDirection, snakeFood, snakeGameLoop;
let snakeScore = 0;
let snakeGameActive = false;

function startSnake() {
    snakeCanvas = document.getElementById('snakeCanvas');
    snakeCtx = snakeCanvas.getContext('2d');
    
    document.getElementById('snakeOverlay').classList.add('hidden');
    
    resetSnake();
    snakeGameActive = true;
    snakeGameLoop = setInterval(updateSnake, 100);
}

function resetSnake() {
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    snakeDirection = 'right';
    snakeScore = 0;
    generateSnakeFood();
    updateSnakeScore();
}

function generateSnakeFood() {
    snakeFood = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20)
    };
}

function updateSnake() {
    if (!snakeGameActive) return;
    
    // Move snake
    const head = {...snake[0]};
    
    switch(snakeDirection) {
        case 'right': head.x++; break;
        case 'left': head.x--; break;
        case 'up': head.y--; break;
        case 'down': head.y++; break;
    }
    
    // Check collision with walls
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
        gameOver('snake');
        return;
    }
    
    // Check collision with self
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver('snake');
        return;
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === snakeFood.x && head.y === snakeFood.y) {
        snakeScore += 10;
        updateSnakeScore();
        generateSnakeFood();
    } else {
        snake.pop();
    }
    
    drawSnake();
}

function drawSnake() {
    snakeCtx.fillStyle = '#0f172a';
    snakeCtx.fillRect(0, 0, 400, 400);
    
    // Draw snake
    snake.forEach((segment, i) => {
        snakeCtx.fillStyle = i === 0 ? '#22c55e' : '#4ade80';
        snakeCtx.fillRect(segment.x * 20, segment.y * 20, 18, 18);
    });
    
    // Draw food
    snakeCtx.fillStyle = '#ef4444';
    snakeCtx.fillRect(snakeFood.x * 20, snakeFood.y * 20, 18, 18);
}

function updateSnakeScore() {
    document.getElementById('snakeScore').textContent = snakeScore;
    if (snakeScore > state.games.snake.highScore) {
        state.games.snake.highScore = snakeScore;
        document.getElementById('snakeHighScore').textContent = snakeScore;
        localStorage.setItem('snakeHighScore', snakeScore);
    }
}

function controlSnake(direction) {
    if (!snakeGameActive) return;
    
    const opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };
    
    if (opposites[direction] !== snakeDirection) {
        snakeDirection = direction;
    }
}

function gameOver(game) {
    snakeGameActive = false;
    clearInterval(snakeGameLoop);
    document.getElementById('snakeOverlay').classList.remove('hidden');
    document.querySelector('#snakeOverlay h3').textContent = `Game Over! Score: ${snakeScore}`;
    addActivity('game', `Scored ${snakeScore} in Snake`);
    addPoints(snakeScore);
}

// Tetris Game
let tetrisCanvas, tetrisCtx, tetrisNextCanvas, tetrisNextCtx;
let tetrisBoard, tetrisPiece, tetrisGameLoop;
let tetrisScore = 0, tetrisLines = 0, tetrisLevel = 1;
let tetrisActive = false;

const TETRIS_PIECES = [
    { shape: [[1,1,1,1]], color: '#22c55e' }, // I
    { shape: [[1,1],[1,1]], color: '#f59e0b' }, // O
    { shape: [[0,1,0],[1,1,1]], color: '#3b82f6' }, // T
    { shape: [[1,0,0],[1,1,1]], color: '#ef4444' }, // L
    { shape: [[0,0,1],[1,1,1]], color: '#8b5cf6' }, // J
    { shape: [[0,1,1],[1,1,0]], color: '#ec4899' }, // S
    { shape: [[1,1,0],[0,1,1]], color: '#14b8a6' } // Z
];

function startTetris() {
    tetrisCanvas = document.getElementById('tetrisCanvas');
    tetrisCtx = tetrisCanvas.getContext('2d');
    tetrisNextCanvas = document.getElementById('tetrisNextCanvas');
    tetrisNextCtx = tetrisNextCanvas.getContext('2d');
    
    document.getElementById('tetrisOverlay').classList.add('hidden');
    
    resetTetris();
    tetrisActive = true;
    tetrisGameLoop = setInterval(updateTetris, 500 / tetrisLevel);
}

function resetTetris() {
    tetrisBoard = Array(20).fill().map(() => Array(10).fill(0));
    tetrisScore = 0;
    tetrisLines = 0;
    tetrisLevel = 1;
    updateTetrisScore();
    spawnTetrisPiece();
}

function spawnTetrisPiece() {
    const piece = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
    tetrisPiece = {
        shape: piece.shape.map(row => [...row]),
        color: piece.color,
        x: Math.floor((10 - piece.shape[0].length) / 2),
        y: 0
    };
    
    // Check collision immediately
    if (checkTetrisCollision()) {
        gameOver('tetris');
    }
}

function checkTetrisCollision() {
    for (let y = 0; y < tetrisPiece.shape.length; y++) {
        for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
            if (tetrisPiece.shape[y][x]) {
                const boardX = tetrisPiece.x + x;
                const boardY = tetrisPiece.y + y;
                if (boardY >= 20 || boardX < 0 || boardX >= 10 || 
                    (boardY >= 0 && tetrisBoard[boardY][boardX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergeTetrisPiece() {
    for (let y = 0; y < tetrisPiece.shape.length; y++) {
        for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
            if (tetrisPiece.shape[y][x]) {
                const boardY = tetrisPiece.y + y;
                if (boardY >= 0) {
                    tetrisBoard[boardY][tetrisPiece.x + x] = tetrisPiece.color;
                }
            }
        }
    }
    
    // Check for completed lines
    let linesCleared = 0;
    for (let y = 19; y >= 0; y--) {
        if (tetrisBoard[y].every(cell => cell !== 0)) {
            tetrisBoard.splice(y, 1);
            tetrisBoard.unshift(Array(10).fill(0));
            y++;
            linesCleared++;
        }
    }
    
    if (linesCleared > 0) {
        tetrisLines += linesCleared;
        tetrisScore += [0, 100, 300, 500, 800][linesCleared];
        tetrisLevel = Math.floor(tetrisLines / 5) + 1;
        updateTetrisScore();
        
        // Update game speed
        clearInterval(tetrisGameLoop);
        tetrisGameLoop = setInterval(updateTetris, 500 / tetrisLevel);
    }
    
    spawnTetrisPiece();
}

function updateTetris() {
    if (!tetrisActive) return;
    
    tetrisPiece.y++;
    if (checkTetrisCollision()) {
        tetrisPiece.y--;
        mergeTetrisPiece();
    }
    
    drawTetris();
}

function drawTetris() {
    // Clear main board
    tetrisCtx.fillStyle = '#0f172a';
    tetrisCtx.fillRect(0, 0, 300, 600);
    
    // Draw board
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            if (tetrisBoard[y][x]) {
                tetrisCtx.fillStyle = tetrisBoard[y][x];
                tetrisCtx.fillRect(x * 30, y * 30, 28, 28);
            }
        }
    }
    
    // Draw current piece
    if (tetrisPiece) {
        for (let y = 0; y < tetrisPiece.shape.length; y++) {
            for (let x = 0; x < tetrisPiece.shape[y].length; x++) {
                if (tetrisPiece.shape[y][x]) {
                    const boardX = (tetrisPiece.x + x) * 30;
                    const boardY = (tetrisPiece.y + y) * 30;
                    tetrisCtx.fillStyle = tetrisPiece.color;
                    tetrisCtx.fillRect(boardX, boardY, 28, 28);
                }
            }
        }
    }
    
    // Draw next piece
    if (tetrisNextCtx) {
        tetrisNextCtx.fillStyle = '#0f172a';
        tetrisNextCtx.fillRect(0, 0, 120, 120);
        
        const nextPiece = TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
        const size = 30;
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    tetrisNextCtx.fillStyle = nextPiece.color;
                    tetrisNextCtx.fillRect(x * size + 10, y * size + 10, size - 4, size - 4);
                }
            }
        }
    }
}

function updateTetrisScore() {
    document.getElementById('tetrisScore').textContent = tetrisScore;
    document.getElementById('tetrisLines').textContent = tetrisLines;
    document.getElementById('tetrisLevel').textContent = tetrisLevel;
    
    if (tetrisScore > state.games.tetris.highScore) {
        state.games.tetris.highScore = tetrisScore;
        localStorage.setItem('tetrisHighScore', tetrisScore);
    }
}

function tetrisMove(direction) {
    if (!tetrisActive) return;
    
    const oldX = tetrisPiece.x;
    if (direction === 'left') tetrisPiece.x--;
    if (direction === 'right') tetrisPiece.x++;
    
    if (checkTetrisCollision()) {
        tetrisPiece.x = oldX;
    }
    
    drawTetris();
}

function tetrisRotate() {
    if (!tetrisActive) return;
    
    const rotated = tetrisPiece.shape[0].map((_, i) =>
        tetrisPiece.shape.map(row => row[i]).reverse()
    );
    
    const oldShape = tetrisPiece.shape;
    tetrisPiece.shape = rotated;
    
    if (checkTetrisCollision()) {
        tetrisPiece.shape = oldShape;
    }
    
    drawTetris();
}

function tetrisDrop() {
    if (!tetrisActive) return;
    
    while (!checkTetrisCollision()) {
        tetrisPiece.y++;
    }
    tetrisPiece.y--;
    mergeTetrisPiece();
    drawTetris();
}

// Memory Game
let memoryCards = [];
let memoryFlipped = [];
let memoryMatched = [];
let memoryMoves = 0;
let memoryLocked = false;

function initMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return;
    
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
    memoryCards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    memoryFlipped = Array(16).fill(false);
    memoryMatched = Array(16).fill(false);
    memoryMoves = 0;
    
    updateMemoryDisplay();
}

function updateMemoryDisplay() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = memoryCards.map((card, i) => `
        <div class="memory-card ${memoryFlipped[i] || memoryMatched[i] ? 'flipped' : ''} ${memoryMatched[i] ? 'matched' : ''}" 
             onclick="flipMemoryCard(${i})">
            ${memoryFlipped[i] || memoryMatched[i] ? card : '?'}
        </div>
    `).join('');
    
    document.getElementById('memoryMoves').textContent = memoryMoves;
    document.getElementById('memoryMatches').textContent = 
        memoryMatched.filter(m => m).length / 2;
}

function flipMemoryCard(index) {
    if (memoryLocked || memoryMatched[index] || memoryFlipped[index]) return;
    
    memoryFlipped[index] = true;
    updateMemoryDisplay();
    
    const flippedIndices = memoryFlipped.reduce((acc, val, i) => 
        val && !memoryMatched[i] ? [...acc, i] : acc, []);
    
    if (flippedIndices.length === 2) {
        memoryMoves++;
        memoryLocked = true;
        
        if (memoryCards[flippedIndices[0]] === memoryCards[flippedIndices[1]]) {
            memoryMatched[flippedIndices[0]] = true;
            memoryMatched[flippedIndices[1]] = true;
            memoryFlipped[flippedIndices[0]] = false;
            memoryFlipped[flippedIndices[1]] = false;
            
            if (memoryMatched.every(m => m)) {
                setTimeout(() => {
                    showToast('Congratulations! You won!', 'success');
                    addActivity('game', `Won Memory in ${memoryMoves} moves`);
                    addPoints(50);
                }, 500);
            }
            
            memoryLocked = false;
        } else {
            setTimeout(() => {
                memoryFlipped[flippedIndices[0]] = false;
                memoryFlipped[flippedIndices[1]] = false;
                updateMemoryDisplay();
                memoryLocked = false;
            }, 1000);
        }
    }
    
    updateMemoryDisplay();
}

// 2048 Game
let game2048Board = [];
let game2048Score = 0;
let game2048Canvas, game2048Ctx;
let game2048Active = false;

function start2048() {
    game2048Canvas = document.getElementById('game2048Canvas');
    game2048Ctx = game2048Canvas.getContext('2d');
    
    document.getElementById('game2048Overlay').classList.add('hidden');
    
    reset2048();
    game2048Active = true;
}

function reset2048() {
    game2048Board = Array(4).fill().map(() => Array(4).fill(0));
    game2048Score = 0;
    addRandomTile();
    addRandomTile();
    draw2048();
}

function addRandomTile() {
    const empty = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (game2048Board[i][j] === 0) empty.push([i, j]);
        }
    }
    
    if (empty.length > 0) {
        const [i, j] = empty[Math.floor(Math.random() * empty.length)];
        game2048Board[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
}

function draw2048() {
    game2048Ctx.fillStyle = '#0f172a';
    game2048Ctx.fillRect(0, 0, 400, 400);
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const value = game2048Board[i][j];
            const x = j * 100;
            const y = i * 100;
            
            game2048Ctx.fillStyle = getTileColor(value);
            game2048Ctx.fillRect(x + 5, y + 5, 90, 90);
            
            if (value > 0) {
                game2048Ctx.fillStyle = value > 4 ? 'white' : '#0f172a';
                game2048Ctx.font = 'bold 24px Inter';
                game2048Ctx.textAlign = 'center';
                game2048Ctx.textBaseline = 'middle';
                game2048Ctx.fillText(value, x + 50, y + 50);
            }
        }
    }
}

function getTileColor(value) {
    const colors = {
        0: '#1e293b',
        2: '#f0e68c',
        4: '#ffd700',
        8: '#ffa500',
        16: '#ff8c00',
        32: '#ff7f50',
        64: '#ff6347',
        128: '#ff4500',
        256: '#ff1493',
        512: '#ff00ff',
        1024: '#9370db',
        2048: '#7b68ee'
    };
    return colors[value] || '#4b0082';
}

function move2048(direction) {
    if (!game2048Active) return;
    
    let moved = false;
    const oldBoard = JSON.parse(JSON.stringify(game2048Board));
    
    if (direction === 'left' || direction === 'right') {
        for (let i = 0; i < 4; i++) {
            let row = game2048Board[i].filter(v => v !== 0);
            if (direction === 'right') row.reverse();
            
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    game2048Score += row[j];
                    row.splice(j + 1, 1);
                }
            }
            
            while (row.length < 4) row.push(0);
            if (direction === 'right') row.reverse();
            game2048Board[i] = row;
        }
    } else {
        for (let j = 0; j < 4; j++) {
            let col = [];
            for (let i = 0; i < 4; i++) {
                if (game2048Board[i][j] !== 0) col.push(game2048Board[i][j]);
            }
            
            if (direction === 'up') {
                for (let i = 0; i < col.length - 1; i++) {
                    if (col[i] === col[i + 1]) {
                        col[i] *= 2;
                        game2048Score += col[i];
                        col.splice(i + 1, 1);
                    }
                }
                while (col.length < 4) col.push(0);
                for (let i = 0; i < 4; i++) game2048Board[i][j] = col[i];
            } else {
                col.reverse();
                for (let i = 0; i < col.length - 1; i++) {
                    if (col[i] === col[i + 1]) {
                        col[i] *= 2;
                        game2048Score += col[i];
                        col.splice(i + 1, 1);
                    }
                }
                while (col.length < 4) col.push(0);
                col.reverse();
                for (let i = 0; i < 4; i++) game2048Board[i][j] = col[i];
            }
        }
    }
    
    if (JSON.stringify(oldBoard) !== JSON.stringify(game2048Board)) {
        addRandomTile();
        moved = true;
    }
    
    document.getElementById('game2048Score').textContent = game2048Score;
    if (game2048Score > state.games.game2048.best) {
        state.games.game2048.best = game2048Score;
        document.getElementById('game2048Best').textContent = game2048Score;
        localStorage.setItem('2048Best', game2048Score);
    }
    
    draw2048();
    
    // Check win/lose
    if (game2048Board.some(row => row.includes(2048))) {
        showToast('You reached 2048!', 'success');
        game2048Active = false;
        document.getElementById('game2048Overlay').classList.remove('hidden');
        document.querySelector('#game2048Overlay h3').textContent = 'You Win!';
        addActivity('game', `Reached 2048 with score ${game2048Score}`);
        addPoints(100);
    }
    
    const empty = game2048Board.some(row => row.includes(0));
    if (!empty && !moved) {
        game2048Active = false;
        document.getElementById('game2048Overlay').classList.remove('hidden');
        document.querySelector('#game2048Overlay h3').textContent = `Game Over! Score: ${game2048Score}`;
        addActivity('game', `Scored ${game2048Score} in 2048`);
        addPoints(game2048Score);
    }
}

// Tic Tac Toe
let ticTacToeBoard = ['', '', '', '', '', '', '', '', ''];
let ticTacToeCurrentPlayer = 'X';
let ticTacToeGameActive = true;

function initTicTacToe() {
    const grid = document.getElementById('tictactoeGrid');
    if (!grid) return;
    
    ticTacToeBoard = ['', '', '', '', '', '', '', '', ''];
    ticTacToeCurrentPlayer = 'X';
    ticTacToeGameActive = true;
    
    updateTicTacToe();
}

function updateTicTacToe() {
    const grid = document.getElementById('tictactoeGrid');
    grid.innerHTML = ticTacToeBoard.map((cell, i) => `
        <div class="tictactoe-cell ${cell.toLowerCase()}" onclick="makeTicTacToeMove(${i})">
            ${cell}
        </div>
    `).join('');
    
    document.getElementById('tictactoeStatus').textContent = 
        ticTacToeGameActive ? `Player ${ticTacToeCurrentPlayer}'s turn` : 'Game Over';
}

function makeTicTacToeMove(index) {
    if (!ticTacToeGameActive || ticTacToeBoard[index] !== '') return;
    
    ticTacToeBoard[index] = ticTacToeCurrentPlayer;
    
    if (checkTicTacToeWin()) {
        document.getElementById('tictactoeStatus').textContent = `Player ${ticTacToeCurrentPlayer} wins!`;
        ticTacToeGameActive = false;
        addActivity('game', `Won Tic Tac Toe as ${ticTacToeCurrentPlayer}`);
        addPoints(25);
    } else if (ticTacToeBoard.every(cell => cell !== '')) {
        document.getElementById('tictactoeStatus').textContent = "It's a draw!";
        ticTacToeGameActive = false;
    } else {
        ticTacToeCurrentPlayer = ticTacToeCurrentPlayer === 'X' ? 'O' : 'X';
    }
    
    updateTicTacToe();
}

function checkTicTacToeWin() {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8], // Rows
        [0,3,6], [1,4,7], [2,5,8], // Columns
        [0,4,8], [2,4,6] // Diagonals
    ];
    
    return winPatterns.some(pattern => {
        const [a,b,c] = pattern;
        return ticTacToeBoard[a] && 
               ticTacToeBoard[a] === ticTacToeBoard[b] && 
               ticTacToeBoard[a] === ticTacToeBoard[c];
    });
}

// Rock Paper Scissors
let rpsPlayerScore = 0;
let rpsCpuScore = 0;

function playRPS(playerChoice) {
    const choices = ['rock', 'paper', 'scissors'];
    const cpuChoice = choices[Math.floor(Math.random() * 3)];
    
    const result = getRPSResult(playerChoice, cpuChoice);
    
    if (result === 'win') {
        rpsPlayerScore++;
        showToast(`You win! CPU chose ${cpuChoice}`, 'success');
    } else if (result === 'lose') {
        rpsCpuScore++;
        showToast(`You lose! CPU chose ${cpuChoice}`, 'error');
    } else {
        showToast(`It's a tie! Both chose ${playerChoice}`, 'info');
    }
    
    document.getElementById('rpsPlayerScore').textContent = rpsPlayerScore;
    document.getElementById('rpsCpuScore').textContent = rpsCpuScore;
    document.getElementById('rpsResult').textContent = 
        `You chose ${playerChoice}, CPU chose ${cpuChoice}`;
}

function getRPSResult(player, cpu) {
    if (player === cpu) return 'tie';
    
    if (
        (player === 'rock' && cpu === 'scissors') ||
        (player === 'paper' && cpu === 'rock') ||
        (player === 'scissors' && cpu === 'paper')
    ) {
        return 'win';
    }
    
    return 'lose';
}

// Hangman
let hangmanWord = '';
let hangmanGuessed = [];
let hangmanWrong = 0;
let hangmanCanvas, hangmanCtx;

function initHangman() {
    hangmanCanvas = document.getElementById('hangmanCanvas');
    if (!hangmanCanvas) return;
    
    hangmanCtx = hangmanCanvas.getContext('2d');
    resetHangman();
}

function resetHangman() {
    const words = ['PROGRAMMING', 'JAVASCRIPT', 'DEVELOPER', 'COMPUTER', 'GITHUB', 'TELEGRAM'];
    hangmanWord = words[Math.floor(Math.random() * words.length)];
    hangmanGuessed = [];
    hangmanWrong = 0;
    
    updateHangman();
    drawHangman();
}

function updateHangman() {
    const wordDisplay = hangmanWord.split('').map(letter => 
        hangmanGuessed.includes(letter) ? letter : '_'
    ).join(' ');
    
    document.getElementById('hangmanWord').textContent = wordDisplay;
    
    if (!wordDisplay.includes('_')) {
        showToast('You won!', 'success');
        addActivity('game', 'Won Hangman');
        addPoints(30);
        resetHangman();
    }
    
    if (hangmanWrong >= 6) {
        showToast(`Game Over! Word was ${hangmanWord}`, 'error');
        resetHangman();
    }
    
    // Generate letter buttons
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    document.getElementById('hangmanLetters').innerHTML = letters.map(letter => `
        <button class="hangman-letter ${hangmanGuessed.includes(letter) ? 'used' : ''}" 
                onclick="guessHangmanLetter('${letter}')"
                ${hangmanGuessed.includes(letter) ? 'disabled' : ''}>
            ${letter}
        </button>
    `).join('');
}

function guessHangmanLetter(letter) {
    if (hangmanGuessed.includes(letter)) return;
    
    hangmanGuessed.push(letter);
    
    if (!hangmanWord.includes(letter)) {
        hangmanWrong++;
        drawHangman();
    }
    
    updateHangman();
}

function drawHangman() {
    hangmanCtx.clearRect(0, 0, 200, 200);
    hangmanCtx.strokeStyle = 'white';
    hangmanCtx.lineWidth = 3;
    
    // Draw gallows
    hangmanCtx.beginPath();
    hangmanCtx.moveTo(20, 180);
    hangmanCtx.lineTo(180, 180);
    hangmanCtx.stroke();
    
    hangmanCtx.beginPath();
    hangmanCtx.moveTo(50, 180);
    hangmanCtx.lineTo(50, 30);
    hangmanCtx.stroke();
    
    hangmanCtx.beginPath();
    hangmanCtx.moveTo(50, 30);
    hangmanCtx.lineTo(120, 30);
    hangmanCtx.stroke();
    
    hangmanCtx.beginPath();
    hangmanCtx.moveTo(120, 30);
    hangmanCtx.lineTo(120, 50);
    hangmanCtx.stroke();
    
    // Draw man based on wrong guesses
    if (hangmanWrong >= 1) {
        // Head
        hangmanCtx.beginPath();
        hangmanCtx.arc(120, 65, 15, 0, Math.PI * 2);
        hangmanCtx.stroke();
    }
    
    if (hangmanWrong >= 2) {
        // Body
        hangmanCtx.beginPath();
        hangmanCtx.moveTo(120, 80);
        hangmanCtx.lineTo(120, 130);
        hangmanCtx.stroke();
    }
    
    if (hangmanWrong >= 3) {
        // Left arm
        hangmanCtx.beginPath();
        hangmanCtx.moveTo(120, 90);
        hangmanCtx.lineTo(100, 110);
        hangmanCtx.stroke();
    }
    
    if (hangmanWrong >= 4) {
        // Right arm
        hangmanCtx.beginPath();
        hangmanCtx.moveTo(120, 90);
        hangmanCtx.lineTo(140, 110);
        hangmanCtx.stroke();
    }
    
    if (hangmanWrong >= 5) {
        // Left leg
        hangmanCtx.beginPath();
        hangmanCtx.moveTo(120, 130);
        hangmanCtx.lineTo(100, 160);
        hangmanCtx.stroke();
    }
    
    if (hangmanWrong >= 6) {
        // Right leg
        hangmanCtx.beginPath();
        hangmanCtx.moveTo(120, 130);
        hangmanCtx.lineTo(140, 160);
        hangmanCtx.stroke();
    }
}

// ==================== UTILITY FUNCTIONS ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function clearCache() {
    localStorage.clear();
    showToast('Cache cleared! Reloading...', 'success');
    setTimeout(() => location.reload(), 1500);
}

function exportUserData() {
    const data = {
        user: state.user,
        games: state.games,
        activity: state.activity,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'talkmate-data.json';
    a.click();
    
    showToast('Data exported successfully!', 'success');
}

// Initialize games when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize games
    initMemoryGame();
    initTicTacToe();
    initHangman();
    
    // Update saved quotes
    updateSavedQuotes();
    updateFavoritesList();
});