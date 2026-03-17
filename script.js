// ==================== CONFIGURATION ====================
const CONFIG = {
    WEATHER_API_KEY: 'bd5e378503939ddaee76f12ad7a97608',
    GNEWS_API_KEY: '8212b5b99e7bd08e8f570e27891b8bcb',
    CURRENTS_API_KEY: '7L8yNTVdO2Kd6pNIkmA0R2yIHKlOECR4YyXWnYkIP4cLZwYi',
    NEWS_API_KEY: 'pub_45510b243dd7ce29fdf845a2e7940cec57568',
    CACHE_DURATION: 0,
    USE_REAL_DATA: true,
    MAX_RETRIES: 3,
    TIMEOUT: 10000
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
        tg.setHeaderColor?.(tg.themeParams.bg_color || '#6366f1');
        tg.setBackgroundColor?.(tg.themeParams.bg_color || '#ffffff');
        
        telegramUser = tg.initDataUnsafe?.user;
        
        const themeParams = tg.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#40a7e3');
            document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
        }
        
        document.getElementById('closeWebApp').style.display = 'inline-block';
        document.getElementById('closeWebApp').addEventListener('click', () => {
            tg.close();
        });
        
        document.getElementById('telegramBadge').classList.add('show');
        document.getElementById('telegramBadge').innerHTML = '<i class="fab fa-telegram"></i> Live Mode • Connected to Telegram';
    }
} catch (e) {
    console.log('Not running in Telegram');
}

// ==================== APP STATE ====================
let state = {
    currentCity: 'London',
    savedCities: ['London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Dubai', 'Singapore', 'Moscow'],
    currentUnit: 'celsius',
    darkMode: false,
    notifications: false,
    currentNewsCategory: 'general',
    locationEnabled: false,
    manualLocation: true, // Default to manual mode
    useGPS: false,
    apiStatus: {
        weather: true,
        gnews: true,
        currents: true,
        hackernews: true
    },
    retryCount: 0
};

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

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        splashScreen.style.display = 'none';
        mainApp.style.display = 'block';
    }, 2000);

    loadPreferences();
    
    // Load saved cities from localStorage
    loadSavedCities();
    
    fetchRealTimeData();
    
    setupEventListeners();
    
    if (telegramUser) {
        displayTelegramUser();
    }
    
    updateTimestamps();
    setInterval(updateTimestamps, 60000);
    
    // Populate saved cities dropdown
    updateCitiesDropdown();
});

// ==================== LOCATION MANAGEMENT ====================

// Load saved cities from localStorage
function loadSavedCities() {
    const saved = localStorage.getItem('savedCities');
    if (saved) {
        try {
            state.savedCities = JSON.parse(saved);
        } catch (e) {
            console.log('Error loading saved cities');
        }
    }
}

// Save cities to localStorage
function saveCities() {
    localStorage.setItem('savedCities', JSON.stringify(state.savedCities));
}

// Update cities dropdown in settings
function updateCitiesDropdown() {
    const container = document.getElementById('savedCitiesContainer');
    if (!container) return;
    
    let html = '<div class="cities-grid">';
    state.savedCities.forEach(city => {
        html += `
            <div class="city-chip" onclick="setCity('${city}')">
                <span>${city}</span>
                <button class="remove-city" onclick="removeCity('${city}'); event.stopPropagation();">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    html += '</div>';
    
    // Also update weather search placeholder with saved cities
    const weatherSearch = document.getElementById('weatherSearch');
    if (weatherSearch) {
        weatherSearch.placeholder = `Search city (e.g., ${state.savedCities[0]})`;
    }
    
    // Add saved cities section to settings if not exists
    const settingsSection = document.querySelector('.settings-section');
    if (settingsSection && !document.getElementById('savedCitiesSection')) {
        const citySection = document.createElement('div');
        citySection.id = 'savedCitiesSection';
        citySection.className = 'settings-section';
        citySection.innerHTML = `
            <h3>📍 Saved Cities</h3>
            <div class="saved-cities-info">
                <p>Click on any city to quickly switch</p>
                <div class="add-city-form">
                    <input type="text" id="newCityInput" placeholder="Enter city name">
                    <button id="addCityBtn" class="add-city-btn">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <div id="savedCitiesContainer" class="saved-cities-container"></div>
            </div>
        `;
        settingsSection.parentNode.insertBefore(citySection, settingsSection.nextSibling);
        
        document.getElementById('addCityBtn')?.addEventListener('click', addNewCity);
        document.getElementById('newCityInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNewCity();
        });
    }
    
    const citiesContainer = document.getElementById('savedCitiesContainer');
    if (citiesContainer) {
        citiesContainer.innerHTML = html;
    }
}

// Add new city to saved list
function addNewCity() {
    const input = document.getElementById('newCityInput');
    const city = input.value.trim();
    
    if (!city) {
        showToast('Please enter a city name');
        return;
    }
    
    if (city.length < 2) {
        showToast('City name too short');
        return;
    }
    
    if (state.savedCities.includes(city)) {
        showToast('City already in your list');
        input.value = '';
        return;
    }
    
    state.savedCities.unshift(city);
    if (state.savedCities.length > 12) {
        state.savedCities = state.savedCities.slice(0, 12);
    }
    
    saveCities();
    updateCitiesDropdown();
    input.value = '';
    showToast(`✅ ${city} added to saved cities`);
}

// Remove city from saved list
function removeCity(city) {
    state.savedCities = state.savedCities.filter(c => c !== city);
    saveCities();
    updateCitiesDropdown();
    showToast(`❌ ${city} removed from saved cities`);
}

// Set current city from saved list
function setCity(city) {
    state.currentCity = city;
    document.getElementById('weatherSearch').value = city;
    getCurrentWeather(true);
    showToast(`📍 Showing weather for ${city}`);
    closeMenuFunc();
    navigateToPage('weather');
}

// Manual city search
function searchCityManually() {
    const input = document.getElementById('weatherSearch');
    const city = input.value.trim();
    
    if (!city) {
        showToast('Please enter a city name');
        return;
    }
    
    if (city.length < 2) {
        showToast('City name too short');
        return;
    }
    
    state.currentCity = city;
    
    // Auto-save to saved cities if not exists
    if (!state.savedCities.includes(city)) {
        state.savedCities.unshift(city);
        if (state.savedCities.length > 12) {
            state.savedCities = state.savedCities.slice(0, 12);
        }
        saveCities();
        updateCitiesDropdown();
    }
    
    getCurrentWeather(true);
    showToast(`🔍 Searching weather for ${city}`);
}

// Toggle between manual and GPS location
function toggleLocationMode(mode) {
    state.manualLocation = mode === 'manual';
    state.useGPS = mode === 'gps';
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${mode}ModeBtn`).classList.add('active');
    
    if (mode === 'gps') {
        getUserLocation();
    }
    
    showToast(`${mode === 'manual' ? '📍 Manual' : '🛰️ GPS'} location mode activated`);
    savePreferences();
}

// ==================== REAL DATA FETCHING ====================
async function fetchRealTimeData() {
    try {
        await Promise.all([
            getCurrentWeather(true),
            getNews(state.currentNewsCategory, true)
        ]);
        
        updateAPICounts();
        showToast('Live data loaded successfully');
    } catch (error) {
        console.error('Error fetching initial data:', error);
        showToast('Connecting to live data sources...');
    }
}

// ==================== WEATHER FUNCTIONS ====================
async function getCurrentWeather(forceFresh = false) {
    const weatherElement = document.getElementById('currentWeather');
    const featuredElement = document.getElementById('featuredWeather');
    
    try {
        showLoading('currentWeather');
        showLoading('featuredWeather');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                q: state.currentCity,
                appid: CONFIG.WEATHER_API_KEY,
                units: 'metric'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.data) {
            const data = response.data;
            state.apiStatus.weather = true;
            
            displayCurrentWeather(data);
            displayWeatherDetails(data);
            
            getForecast(data.coord.lat, data.coord.lon);
            getUVIndex(data.coord.lat, data.coord.lon);
            getAirQuality(data.coord.lat, data.coord.lon);
            
            updateFeatured(data);
            updateWeatherTimestamp();
            
            return data;
        }
    } catch (error) {
        console.error('Weather API Error:', error);
        state.apiStatus.weather = false;
        
        if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
            showToast('Weather request timeout - retrying...');
            if (state.retryCount < CONFIG.MAX_RETRIES) {
                state.retryCount++;
                setTimeout(() => getCurrentWeather(true), 2000);
            }
        } else {
            // Try with a different city from saved list
            const currentIndex = state.savedCities.indexOf(state.currentCity);
            const nextCity = state.savedCities[(currentIndex + 1) % state.savedCities.length];
            
            if (state.currentCity !== nextCity) {
                state.currentCity = nextCity;
                getCurrentWeather(true);
                showToast(`Trying weather for ${nextCity}...`);
            }
        }
    }
}

function displayCurrentWeather(data) {
    const temp = state.currentUnit === 'celsius' ? data.main.temp : (data.main.temp * 9/5) + 32;
    const tempUnit = state.currentUnit === 'celsius' ? '°C' : '°F';
    
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const html = `
        <div class="weather-main">
            <div>
                <div class="weather-temp">${Math.round(temp)}${tempUnit}</div>
                <div class="weather-city">${data.name}, ${data.sys.country}</div>
                <div class="weather-desc">${data.weather[0].description}</div>
            </div>
            <div class="weather-icon-large">
                <i class="fas fa-${getWeatherIcon(data.weather[0].icon)}"></i>
            </div>
        </div>
        <div class="weather-stats">
            <div class="weather-stat">
                <i class="fas fa-temperature-high"></i>
                <div>
                    <span class="stat-label">High/Low</span>
                    <span class="stat-value">${Math.round(data.main.temp_max)}°/${Math.round(data.main.temp_min)}°</span>
                </div>
            </div>
            <div class="weather-stat">
                <i class="fas fa-wind"></i>
                <div>
                    <span class="stat-label">Wind</span>
                    <span class="stat-value">${data.wind.speed} m/s</span>
                </div>
            </div>
            <div class="weather-stat">
                <i class="fas fa-tint"></i>
                <div>
                    <span class="stat-label">Humidity</span>
                    <span class="stat-value">${data.main.humidity}%</span>
                </div>
            </div>
            <div class="weather-stat">
                <i class="fas fa-compress-alt"></i>
                <div>
                    <span class="stat-label">Pressure</span>
                    <span class="stat-value">${data.main.pressure} hPa</span>
                </div>
            </div>
        </div>
        <div class="weather-sun">
            <div><i class="fas fa-sun"></i> Sunrise: ${sunrise}</div>
            <div><i class="fas fa-moon"></i> Sunset: ${sunset}</div>
        </div>
    `;
    
    document.getElementById('currentWeather').innerHTML = html;
}

function displayWeatherDetails(data) {
    const feelsLike = state.currentUnit === 'celsius' ? data.main.feels_like : (data.main.feels_like * 9/5) + 32;
    const tempUnit = state.currentUnit === 'celsius' ? '°C' : '°F';
    
    const html = `
        <div class="detail-card">
            <i class="fas fa-thermometer-half"></i>
            <span class="detail-label">Feels Like</span>
            <span class="detail-value">${Math.round(feelsLike)}${tempUnit}</span>
        </div>
        <div class="detail-card">
            <i class="fas fa-eye"></i>
            <span class="detail-label">Visibility</span>
            <span class="detail-value">${(data.visibility / 1000).toFixed(1)} km</span>
        </div>
        <div class="detail-card">
            <i class="fas fa-cloud"></i>
            <span class="detail-label">Clouds</span>
            <span class="detail-value">${data.clouds.all}%</span>
        </div>
        <div class="detail-card" id="uvCard">
            <i class="fas fa-sun"></i>
            <span class="detail-label">UV Index</span>
            <span class="detail-value" id="uvValue">Loading...</span>
        </div>
    `;

    document.getElementById('weatherDetails').innerHTML = html;
}

async function getForecast(lat, lon) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
            params: {
                lat: lat,
                lon: lon,
                appid: CONFIG.WEATHER_API_KEY,
                units: 'metric',
                cnt: 5
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.list) {
            displayForecast(response.data.list);
        }
    } catch (error) {
        console.error('Forecast error:', error);
        document.getElementById('forecastGrid').innerHTML = '<p class="error-message">Forecast temporarily unavailable</p>';
    }
}

function displayForecast(forecastData) {
    let html = '';
    const dailyForecasts = forecastData.filter((item, index) => index % 8 === 0);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = state.currentUnit === 'celsius' ? day.main.temp : (day.main.temp * 9/5) + 32;
        const tempUnit = state.currentUnit === 'celsius' ? '°C' : '°F';
        
        html += `
            <div class="forecast-card">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-icon">
                    <i class="fas fa-${getWeatherIcon(day.weather[0].icon)}"></i>
                </div>
                <div class="forecast-temp">${Math.round(temp)}${tempUnit}</div>
                <div class="forecast-desc">${day.weather[0].description}</div>
                <div class="forecast-details">
                    <span><i class="fas fa-tint"></i> ${day.main.humidity}%</span>
                    <span><i class="fas fa-wind"></i> ${day.wind.speed}</span>
                </div>
            </div>
        `;
    });

    document.getElementById('forecastGrid').innerHTML = html;
}

async function getUVIndex(lat, lon) {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/uvi`, {
            params: {
                lat: lat,
                lon: lon,
                appid: CONFIG.WEATHER_API_KEY
            }
        });
        
        const uvValue = response.data.value;
        const uvElement = document.getElementById('uvValue');
        if (uvElement) {
            uvElement.textContent = uvValue.toFixed(1);
        }
    } catch (error) {
        console.error('UV Index error:', error);
    }
}

async function getAirQuality(lat, lon) {
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/air_pollution`, {
            params: {
                lat: lat,
                lon: lon,
                appid: CONFIG.WEATHER_API_KEY
            }
        });
        
        const aqi = response.data.list[0].main.aqi;
        const components = response.data.list[0].components;
        const aqiText = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi - 1];
        
        // Add air quality to weather details if not already there
        if (!document.getElementById('airQualityCard')) {
            const airQualityHtml = `
                <div class="detail-card" id="airQualityCard">
                    <i class="fas fa-leaf"></i>
                    <span class="detail-label">Air Quality</span>
                    <span class="detail-value">${aqiText}</span>
                    <small>PM2.5: ${components.pm2_5.toFixed(1)}</small>
                </div>
            `;
            document.getElementById('weatherDetails').innerHTML += airQualityHtml;
        }
    } catch (error) {
        console.error('Air quality error:', error);
    }
}

// ==================== NEWS FUNCTIONS ====================
async function getNews(category = 'general', forceFresh = false) {
    try {
        showLoading('newsGrid');
        state.currentNewsCategory = category;
        
        let articles = [];
        let sources = [];
        
        const [gnewsResult, currentsResult, hackernewsResult] = await Promise.allSettled([
            fetchGNews(category),
            fetchCurrentsAPI(category),
            fetchHackerNews()
        ]);
        
        if (gnewsResult.status === 'fulfilled' && gnewsResult.value) {
            articles = articles.concat(gnewsResult.value);
            sources.push('GNews');
            state.apiStatus.gnews = true;
        }
        
        if (currentsResult.status === 'fulfilled' && currentsResult.value) {
            articles = articles.concat(currentsResult.value);
            sources.push('CurrentsAPI');
            state.apiStatus.currents = true;
        }
        
        if (hackernewsResult.status === 'fulfilled' && hackernewsResult.value) {
            articles = articles.concat(hackernewsResult.value);
            sources.push('HackerNews');
            state.apiStatus.hackernews = true;
        }
        
        const uniqueArticles = removeDuplicateNews(articles);
        
        if (uniqueArticles.length > 0) {
            displayNews(uniqueArticles, sources);
            updateNewsTimestamp();
            document.getElementById('globalNewsCount').querySelector('.stat-value').textContent = sources.length;
        } else {
            getFallbackNews(category);
        }
        
    } catch (error) {
        console.error('News fetch error:', error);
        getFallbackNews(category);
    }
}

async function fetchGNews(category) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        const response = await axios.get(`https://gnews.io/api/v4/top-headlines`, {
            params: {
                token: CONFIG.GNEWS_API_KEY,
                category: category === 'general' ? 'general' : category,
                lang: 'en',
                max: 6,
                country: 'us'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.articles) {
            return response.data.articles.map(article => ({
                ...article,
                source: 'GNews',
                sourceName: article.source?.name || 'GNews'
            }));
        }
        return [];
    } catch (error) {
        console.log('GNews failed:', error);
        return [];
    }
}

async function fetchCurrentsAPI(category) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        const response = await axios.get(`https://api.currentsapi.services/v1/latest-news`, {
            params: {
                apiKey: CONFIG.CURRENTS_API_KEY,
                category: category,
                language: 'en',
                page_size: 6
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.news) {
            return response.data.news.map(news => ({
                title: news.title,
                description: news.description,
                url: news.url,
                image: news.image,
                source: 'CurrentsAPI',
                sourceName: news.source || 'CurrentsAPI',
                publishedAt: news.published
            }));
        }
        return [];
    } catch (error) {
        console.log('CurrentsAPI failed:', error);
        return [];
    }
}

async function fetchHackerNews() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        const topStories = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', {
            signal: controller.signal
        });
        
        const storyPromises = topStories.data.slice(0, 3).map(id => 
            axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        );
        
        const stories = await Promise.all(storyPromises);
        clearTimeout(timeoutId);
        
        return stories.map(story => ({
            title: story.data.title,
            description: story.data.text || `Score: ${story.data.score} points • ${story.data.descendants || 0} comments`,
            url: story.data.url || `https://news.ycombinator.com/item?id=${story.data.id}`,
            image: 'https://news.ycombinator.com/y18.svg',
            source: 'HackerNews',
            sourceName: 'Hacker News',
            publishedAt: new Date(story.data.time * 1000).toISOString()
        }));
    } catch (error) {
        console.log('HackerNews failed:', error);
        return [];
    }
}

function removeDuplicateNews(articles) {
    const seen = new Set();
    return articles.filter(article => {
        const title = article.title?.toLowerCase().substring(0, 50);
        if (seen.has(title) || !article.title) return false;
        seen.add(title);
        return true;
    }).slice(0, 12);
}

function displayNews(articles, sources) {
    let html = '';
    
    articles.forEach((article, index) => {
        const imageUrl = article.image || article.urlToImage || `https://picsum.photos/300/200?random=${index}`;
        const title = article.title || 'News Article';
        const description = article.description || article.content || 'Click to read full article';
        const source = article.sourceName || article.source || 'News Source';
        const url = article.url;
        const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : new Date().toLocaleDateString();

        html += `
            <div class="news-card" onclick="window.open('${url}', '_blank')" style="animation-delay: ${index * 0.05}s">
                <div class="news-image-wrapper">
                    <img src="${imageUrl}" alt="${title}" class="news-image" loading="lazy" onerror="this.src='https://picsum.photos/300/200?random=${index}'">
                    <span class="news-source-badge">${source}</span>
                </div>
                <div class="news-content">
                    <h3 class="news-title">${title.substring(0, 80)}${title.length > 80 ? '...' : ''}</h3>
                    <p class="news-description">${description.substring(0, 100)}...</p>
                    <div class="news-meta">
                        <span class="news-date"><i class="far fa-calendar"></i> ${date}</span>
                        <span class="news-read-more">Read More <i class="fas fa-arrow-right"></i></span>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('newsGrid').innerHTML = html;
    document.getElementById('newsFooter').querySelector('.news-source-info').textContent = 
        `Sources: ${sources.join(' • ')}`;
}

async function searchNews(query) {
    if (!query || query.trim().length < 2) {
        showToast('Please enter at least 2 characters');
        return;
    }
    
    try {
        showLoading('newsGrid');
        showToast(`Searching for "${query}"...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        const response = await axios.get(`https://gnews.io/api/v4/search`, {
            params: {
                token: CONFIG.GNEWS_API_KEY,
                q: query,
                lang: 'en',
                max: 12
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.data && response.data.articles && response.data.articles.length > 0) {
            displayNews(response.data.articles.map(a => ({...a, sourceName: 'GNews'})), ['GNews']);
            showToast(`Found ${response.data.articles.length} results`);
        } else {
            showToast('No results found. Try a different search term.');
            getNews(state.currentNewsCategory);
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Using latest news instead.');
        getNews(state.currentNewsCategory);
    }
}

function getFallbackNews(category) {
    const fallbackFeeds = {
        general: [
            { title: 'BBC News - World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
            { title: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/edition.rss' }
        ],
        technology: [
            { title: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
            { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' }
        ]
    };
    
    showToast('Connecting to RSS feeds...');
    document.getElementById('newsGrid').innerHTML = `
        <div class="news-card fallback">
            <div class="news-content">
                <h3>Connecting to alternative news sources...</h3>
                <p>Please wait while we fetch the latest headlines.</p>
                <button onclick="getNews('${category}')" class="retry-btn">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        </div>
    `;
}

// ==================== LOCATION FUNCTIONS ====================
function getUserLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation not supported');
        return;
    }
    
    showToast('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                
                const response = await axios.get(`https://api.openweathermap.org/geo/1.0/reverse`, {
                    params: {
                        lat: latitude,
                        lon: longitude,
                        limit: 1,
                        appid: CONFIG.WEATHER_API_KEY
                    }
                });
                
                if (response.data && response.data[0]) {
                    const detectedCity = response.data[0].name;
                    state.currentCity = detectedCity;
                    document.getElementById('weatherSearch').value = detectedCity;
                    
                    // Auto-save to saved cities
                    if (!state.savedCities.includes(detectedCity)) {
                        state.savedCities.unshift(detectedCity);
                        if (state.savedCities.length > 12) {
                            state.savedCities = state.savedCities.slice(0, 12);
                        }
                        saveCities();
                        updateCitiesDropdown();
                    }
                    
                    getCurrentWeather(true);
                    showToast(`📍 GPS detected: ${detectedCity}`);
                    state.locationEnabled = true;
                }
            } catch (error) {
                showToast('Could not get city name from GPS');
            }
        },
        (error) => {
            showToast('Location access denied. Using manual mode.');
            toggleLocationMode('manual');
        }
    );
}

// ==================== HELPER FUNCTIONS ====================
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

function getUVLevel(uv) {
    if (uv < 3) return 'Low';
    if (uv < 6) return 'Moderate';
    if (uv < 8) return 'High';
    if (uv < 11) return 'Very High';
    return 'Extreme';
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element && !element.querySelector('.weather-loader')) {
        element.innerHTML = `
            <div class="weather-loader">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Fetching live data...</p>
            </div>
        `;
    }
}

function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function updateTimestamps() {
    const now = new Date().toLocaleTimeString();
    document.getElementById('weatherUpdateTime').textContent = `Updated: ${now}`;
    document.getElementById('forecastUpdateTime').textContent = `Updated: ${now}`;
    document.getElementById('newsUpdateTime').textContent = `Updated: ${now}`;
}

function updateAPICounts() {
    const activeAPIs = Object.values(state.apiStatus).filter(Boolean).length;
    document.getElementById('globalNewsCount').querySelector('.stat-value').textContent = activeAPIs;
}

function displayTelegramUser() {
    const userInfo = document.getElementById('telegramUserInfo');
    if (userInfo && telegramUser) {
        userInfo.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
                <p class="user-name">${telegramUser.first_name} ${telegramUser.last_name || ''}</p>
                <p class="user-id">@${telegramUser.username || 'No username'}</p>
            </div>
        `;
    }
    
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg && telegramUser) {
        welcomeMsg.textContent = `Welcome back, ${telegramUser.first_name}!`;
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleTheme);

    menuToggle.addEventListener('click', openMenu);
    closeMenu.addEventListener('click', closeMenuFunc);
    overlay.addEventListener('click', closeMenuFunc);

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

    // Weather search with manual control
    const weatherSearch = document.getElementById('weatherSearch');
    const weatherSearchClear = document.getElementById('weatherSearchClear');
    const searchBtn = document.getElementById('weatherSearchBtn');
    
    weatherSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchCityManually();
        }
    });
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchCityManually);
    }
    
    weatherSearchClear.addEventListener('click', () => {
        weatherSearch.value = '';
        weatherSearch.focus();
    });

    // Location mode buttons
    document.getElementById('manualModeBtn')?.addEventListener('click', () => toggleLocationMode('manual'));
    document.getElementById('gpsModeBtn')?.addEventListener('click', () => toggleLocationMode('gps'));

    // Location button (GPS)
    document.getElementById('getLocationBtn').addEventListener('click', () => {
        toggleLocationMode('gps');
        getUserLocation();
    });

    // News search
    const newsSearch = document.getElementById('newsSearch');
    const newsSearchClear = document.getElementById('newsSearchClear');
    const newsSearchBtn = document.getElementById('newsSearchBtn');
    
    newsSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && newsSearch.value.trim()) {
            searchNews(newsSearch.value.trim());
        }
    });
    
    if (newsSearchBtn) {
        newsSearchBtn.addEventListener('click', () => {
            if (newsSearch.value.trim()) {
                searchNews(newsSearch.value.trim());
            }
        });
    }
    
    newsSearchClear.addEventListener('click', () => {
        newsSearch.value = '';
        newsSearch.focus();
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            getNews(btn.dataset.category, true);
        });
    });

    document.getElementById('refreshNewsBtn').addEventListener('click', () => {
        getNews(state.currentNewsCategory, true);
    });

    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentUnit = btn.dataset.unit;
            getCurrentWeather(true);
            savePreferences();
        });
    });
}

// ==================== NAVIGATION ====================
function navigateToPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    closeMenuFunc();
    
    if (page === 'weather') {
        getCurrentWeather(true);
    } else if (page === 'news') {
        getNews(state.currentNewsCategory, true);
    } else if (page === 'settings') {
        updateCitiesDropdown();
    }
}

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

function toggleTheme() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode', state.darkMode);
    themeToggle.innerHTML = state.darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if (darkModeToggle) darkModeToggle.checked = state.darkMode;
    savePreferences();
}

// ==================== PREFERENCES ====================
function loadPreferences() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedUnit = localStorage.getItem('tempUnit') || 'celsius';
    const savedNotifications = localStorage.getItem('notifications') === 'true';
    const savedLocationMode = localStorage.getItem('locationMode') || 'manual';

    state.darkMode = savedDarkMode;
    state.currentUnit = savedUnit;
    state.notifications = savedNotifications;
    state.manualLocation = savedLocationMode === 'manual';
    state.useGPS = savedLocationMode === 'gps';

    if (state.darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    if (darkModeToggle) darkModeToggle.checked = state.darkMode;
    if (notificationsToggle) notificationsToggle.checked = state.notifications;
    
    document.querySelectorAll('.unit-btn').forEach(btn => {
        if (btn.dataset.unit === state.currentUnit) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Set location mode buttons
    document.getElementById('manualModeBtn')?.classList.toggle('active', state.manualLocation);
    document.getElementById('gpsModeBtn')?.classList.toggle('active', state.useGPS);
}

function savePreferences() {
    localStorage.setItem('darkMode', state.darkMode);
    localStorage.setItem('tempUnit', state.currentUnit);
    localStorage.setItem('notifications', state.notifications);
    localStorage.setItem('locationMode', state.manualLocation ? 'manual' : 'gps');
}

// ==================== GLOBAL FUNCTIONS ====================
window.navigateToPage = navigateToPage;
window.getWeatherDetail = (type) => showToast(`Weather detail: ${type}`);
window.setCity = setCity;
window.removeCity = removeCity;
window.addNewCity = addNewCity;
window.searchCityManually = searchCityManually;
window.toggleLocationMode = toggleLocationMode;