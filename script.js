// ==================== CONFIGURATION ====================
const CONFIG = {
    WEATHER_API_KEY: 'bd5e378503939ddaee76f12ad7a97608',
    NEWS_API_KEY: 'pub_45510b243dd7ce29fdf845a2e7940cec57568',
    GNEWS_API_KEY: '8212b5b99e7bd08e8f570e27891b8bcb'
};

// ==================== TELEGRAM INTEGRATION ====================
let tg = null;
let telegramUser = null;

try {
    tg = window.Telegram?.WebApp;
    if (tg) {
        console.log('Telegram Web App initialized');
        tg.ready();
        tg.expand();
        
        // Get user info
        telegramUser = tg.initDataUnsafe?.user;
        
        // Set theme colors
        const themeParams = tg.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#40a7e3');
            document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
        }
        
        // Show close button
        document.getElementById('closeWebApp').style.display = 'inline-block';
        document.getElementById('closeWebApp').addEventListener('click', () => {
            tg.close();
        });
        
        // Show Telegram badge
        document.getElementById('telegramBadge').classList.add('show');
        document.getElementById('telegramBadge').innerHTML = '<i class="fab fa-telegram"></i> Opened from Telegram';
    }
} catch (e) {
    console.log('Not running in Telegram');
}

// ==================== APP STATE ====================
let currentCity = 'London';
let currentUnit = 'celsius';
let darkMode = false;
let notifications = false;

// ==================== DOM ELEMENTS ====================
const splashScreen = document.getElementById('splashScreen');
const mainApp = document.getElementById('mainApp');
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const closeMenu = document.getElementById('closeMenu');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');
const darkModeToggle = document.getElementById('darkModeToggle');
const notificationsToggle = document.getElementById('notificationsToggle');
const tempUnit = document.getElementById('tempUnit');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Hide splash screen after 2.5 seconds
    setTimeout(() => {
        splashScreen.style.display = 'none';
        mainApp.style.display = 'block';
    }, 2500);

    // Load saved preferences
    loadPreferences();

    // Initialize data
    getCurrentWeather();
    getNews('general');

    // Display Telegram user info if available
    if (telegramUser) {
        displayTelegramUser();
    }

    // Set up event listeners
    setupEventListeners();
});

// ==================== TELEGRAM FUNCTIONS ====================
function displayTelegramUser() {
    const userInfo = document.getElementById('telegramUserInfo');
    if (userInfo && telegramUser) {
        userInfo.innerHTML = `
            <p class="user-name">👤 ${telegramUser.first_name} ${telegramUser.last_name || ''}</p>
            <p>@${telegramUser.username || 'No username'}</p>
            <p>ID: ${telegramUser.id}</p>
        `;
    }
    
    // Update welcome message
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome ${telegramUser.first_name}!`;
    }
}

function sendToBot(data) {
    if (tg) {
        tg.sendData(JSON.stringify(data));
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleTheme);

    // Menu toggles
    menuToggle.addEventListener('click', openMenu);
    closeMenu.addEventListener('click', closeMenuFunc);
    overlay.addEventListener('click', closeMenuFunc);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
            closeMenuFunc();
        });
    });

    // Weather search
    const weatherSearch = document.getElementById('weatherSearch');
    if (weatherSearch) {
        weatherSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentCity = e.target.value;
                getCurrentWeather();
                showToast(`Searching weather for ${currentCity}...`);
                
                // Send to Telegram if in bot
                sendToBot({ action: 'weather_search', city: currentCity });
            }
        });
    }

    // News search
    const newsSearch = document.getElementById('newsSearch');
    if (newsSearch) {
        newsSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchNews(e.target.value);
            }
        });
    }

    // News categories
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            getNews(btn.dataset.category);
        });
    });

    // Temperature unit
    if (tempUnit) {
        tempUnit.addEventListener('change', (e) => {
            currentUnit = e.target.value;
            getCurrentWeather();
            savePreferences();
            showToast(`Temperature unit changed to ${currentUnit}`);
        });
    }

    // Notifications toggle
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', (e) => {
            notifications = e.target.checked;
            savePreferences();
            if (notifications) {
                showToast('Notifications enabled');
                // Request notification permission
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            }
        });
    }
}

// ==================== NAVIGATION ====================
function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show selected page
    const targetPage = document.getElementById(page + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Load page-specific data
    if (page === 'weather') {
        getCurrentWeather();
    } else if (page === 'news') {
        getNews('general');
    }
    
    // Send to Telegram
    sendToBot({ action: 'page_view', page: page });
}

// ==================== MENU FUNCTIONS ====================
function openMenu() {
    sideMenu.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenuFunc() {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== THEME FUNCTIONS ====================
function toggleTheme() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    themeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if (darkModeToggle) darkModeToggle.checked = darkMode;
    savePreferences();
}

// ==================== WEATHER FUNCTIONS ====================
async function getCurrentWeather() {
    try {
        showLoading('currentWeather');
        showLoading('featuredWeather');
        
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${currentCity}&appid=${CONFIG.WEATHER_API_KEY}&units=metric`);
        const data = response.data;

        displayCurrentWeather(data);
        displayWeatherDetails(data);
        getForecast();
        updateFeatured(data);

        // Get additional data
        getUVIndex(data.coord.lat, data.coord.lon);
        getAirQuality(data.coord.lat, data.coord.lon);

    } catch (error) {
        console.error('Weather error:', error);
        showToast('City not found. Showing default city.');
        currentCity = 'London';
        getCurrentWeather();
    }
}

function displayCurrentWeather(data) {
    const temp = currentUnit === 'celsius' ? data.main.temp : (data.main.temp * 9/5) + 32;
    const tempUnit = currentUnit === 'celsius' ? '°C' : '°F';

    const html = `
        <div class="weather-main">
            <div>
                <div class="weather-temp">${Math.round(temp)}${tempUnit}</div>
                <div class="weather-city">${data.name}, ${data.sys.country}</div>
            </div>
            <div class="weather-icon">
                <i class="fas fa-${getWeatherIcon(data.weather[0].icon)}"></i>
            </div>
        </div>
        <div class="weather-details">
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <span class="detail-value">${data.wind.speed} m/s</span>
                <span class="detail-label">Wind</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <span class="detail-value">${data.main.humidity}%</span>
                <span class="detail-label">Humidity</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-compress-alt"></i>
                <span class="detail-value">${data.main.pressure} hPa</span>
                <span class="detail-label">Pressure</span>
            </div>
        </div>
    `;

    document.getElementById('currentWeather').innerHTML = html;
}

function displayWeatherDetails(data) {
    const html = `
        <div class="detail-card">
            <i class="fas fa-thermometer-half"></i>
            <div>Feels Like</div>
            <div class="detail-value">${Math.round(data.main.feels_like)}°C</div>
        </div>
        <div class="detail-card">
            <i class="fas fa-eye"></i>
            <div>Visibility</div>
            <div class="detail-value">${(data.visibility / 1000).toFixed(1)} km</div>
        </div>
        <div class="detail-card">
            <i class="fas fa-cloud"></i>
            <div>Clouds</div>
            <div class="detail-value">${data.clouds.all}%</div>
        </div>
        <div class="detail-card">
            <i class="fas fa-sun"></i>
            <div>UV Index</div>
            <div class="detail-value" id="uvValue">Loading...</div>
        </div>
    `;

    document.getElementById('weatherDetails').innerHTML = html;
}

async function getForecast() {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${currentCity}&appid=${CONFIG.WEATHER_API_KEY}&units=metric&cnt=5`);
        const data = response.data;

        let html = '';
        data.list.forEach(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
            html += `
                <div class="forecast-card">
                    <div class="forecast-day">${date}</div>
                    <div class="forecast-icon">
                        <i class="fas fa-${getWeatherIcon(day.weather[0].icon)}"></i>
                    </div>
                    <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
                    <div class="forecast-desc">${day.weather[0].description}</div>
                </div>
            `;
        });

        document.getElementById('forecastGrid').innerHTML = html;
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

async function getUVIndex(lat, lon) {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}`);
        document.getElementById('uvValue').textContent = response.data.value;
    } catch (error) {
        document.getElementById('uvValue').textContent = 'N/A';
    }
}

async function getAirQuality(lat, lon) {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}`);
        const aqi = response.data.list[0].main.aqi;
        const aqiText = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi - 1];
        
        // Add air quality to weather details
        const airQualityHtml = `
            <div class="detail-card">
                <i class="fas fa-leaf"></i>
                <div>Air Quality</div>
                <div class="detail-value">${aqiText}</div>
            </div>
        `;
        document.getElementById('weatherDetails').innerHTML += airQualityHtml;
    } catch (error) {
        console.error('Air quality error:', error);
    }
}

function updateFeatured(data) {
    const temp = currentUnit === 'celsius' ? data.main.temp : (data.main.temp * 9/5) + 32;
    const tempUnit = currentUnit === 'celsius' ? '°C' : '°F';
    
    const html = `
        <h3>${data.name}, ${data.sys.country}</h3>
        <div class="featured-temp">${Math.round(temp)}${tempUnit}</div>
        <div class="featured-desc">${data.weather[0].description}</div>
        <div><i class="fas fa-wind"></i> ${data.wind.speed} m/s</div>
    `;
    document.getElementById('featuredWeather').innerHTML = html;
}

function getWeatherDetail(type) {
    let message = '';
    switch(type) {
        case 'temperature':
            message = '🌡️ Check the main weather card for temperature details';
            break;
        case 'humidity':
            message = '💧 Humidity data is shown in the weather card';
            break;
        case 'wind':
            message = '💨 Wind speed is displayed in the weather details';
            break;
        case 'pressure':
            message = '📊 Pressure reading is in the weather card';
            break;
        case 'uv':
            message = '☀️ UV index is shown in the weather details grid';
            break;
        case 'air':
            message = '🌍 Air quality data is in the weather details';
            break;
    }
    showToast(message);
}

function getWeatherIcon(iconCode) {
    const icons = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'cloud',
        '04n': 'cloud',
        '09d': 'cloud-rain',
        '09n': 'cloud-rain',
        '10d': 'cloud-sun-rain',
        '10n': 'cloud-moon-rain',
        '11d': 'bolt',
        '11n': 'bolt',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'smog',
        '50n': 'smog'
    };
    return icons[iconCode] || 'cloud';
}

// ==================== NEWS FUNCTIONS ====================
async function getNews(category) {
    try {
        showLoading('newsGrid');

        // Try GNews API first
        try {
            const response = await axios.get(`https://gnews.io/api/v4/top-headlines`, {
                params: {
                    token: CONFIG.GNEWS_API_KEY,
                    category: category === 'general' ? 'general' : category,
                    lang: 'en',
                    max: 12
                }
            });

            if (response.data.articles && response.data.articles.length > 0) {
                displayNews(response.data.articles);
                return;
            }
        } catch (e) {
            console.log('GNews failed, trying Currents API');
        }

        // Fallback to Currents API
        const response = await axios.get(`https://api.currentsapi.services/v1/latest-news`, {
            params: {
                apiKey: CONFIG.NEWS_API_KEY,
                category: category,
                language: 'en',
                page_size: 12
            }
        });

        if (response.data.news && response.data.news.length > 0) {
            displayNews(response.data.news);
        } else {
            displayFallbackNews();
        }

    } catch (error) {
        console.error('News error:', error);
        displayFallbackNews();
    }
}

async function searchNews(query) {
    try {
        showLoading('newsGrid');

        const response = await axios.get(`https://gnews.io/api/v4/search`, {
            params: {
                token: CONFIG.GNEWS_API_KEY,
                q: query,
                lang: 'en',
                max: 12
            }
        });

        if (response.data.articles && response.data.articles.length > 0) {
            displayNews(response.data.articles);
            showToast(`Found ${response.data.articles.length} results for "${query}"`);
        } else {
            showToast('No news found for your search');
            getNews('general');
        }

    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Please try again.');
    }
}

function displayNews(articles) {
    let html = '';
    
    articles.forEach(article => {
        const imageUrl = article.image || article.urlToImage || 'https://via.placeholder.com/300x180?text=News';
        const title = article.title || article.title;
        const description = article.description || article.description || 'Click to read full article';
        const source = article.source?.name || article.source || 'News Source';
        const url = article.url || article.url;
        const date = article.publishedAt || article.published;

        html += `
            <div class="news-card" onclick="window.open('${url}', '_blank')">
                <img src="${imageUrl}" alt="${title}" class="news-image" onerror="this.src='https://via.placeholder.com/300x180?text=News'">
                <div class="news-content">
                    <h3 class="news-title">${title}</h3>
                    <p class="news-description">${description.substring(0, 100)}...</p>
                    <div class="news-meta">
                        <span class="news-source">${source}</span>
                        <span>${new Date(date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('newsGrid').innerHTML = html;
}

function displayFallbackNews() {
    const fallbackNews = [
        {
            title: 'Global Technology Summit Highlights AI Advancements',
            source: 'Tech News',
            description: 'World leaders discuss future of artificial intelligence and its impact on society.',
            url: '#'
        },
        {
            title: 'Markets Reach New Heights Amid Economic Recovery',
            source: 'Business Daily',
            description: 'Global markets show strong performance as economies continue to recover.',
            url: '#'
        },
        {
            title: 'Breakthrough in Renewable Energy Research',
            source: 'Science Today',
            description: 'Scientists announce major breakthrough in solar energy efficiency.',
            url: '#'
        }
    ];

    let html = '';
    fallbackNews.forEach(article => {
        html += `
            <div class="news-card">
                <img src="https://via.placeholder.com/300x180?text=News" alt="News" class="news-image">
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description}</p>
                    <div class="news-meta">
                        <span class="news-source">${article.source}</span>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('newsGrid').innerHTML = html;
    showToast('Using cached news. Live updates will resume shortly.');
}

// ==================== HELPER FUNCTIONS ====================
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="weather-loader">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== PREFERENCES ====================
function loadPreferences() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedUnit = localStorage.getItem('tempUnit') || 'celsius';
    const savedNotifications = localStorage.getItem('notifications') === 'true';

    darkMode = savedDarkMode;
    currentUnit = savedUnit;
    notifications = savedNotifications;

    // Apply preferences
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    if (darkModeToggle) darkModeToggle.checked = darkMode;
    if (tempUnit) tempUnit.value = currentUnit;
    if (notificationsToggle) notificationsToggle.checked = notifications;
}

function savePreferences() {
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('tempUnit', currentUnit);
    localStorage.setItem('notifications', notifications);
}

// ==================== MAKE FUNCTIONS GLOBAL ====================
window.navigateToPage = navigateToPage;
window.getWeatherDetail = getWeatherDetail;