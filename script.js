// ==================== CONFIGURATION ====================
const CONFIG = {
    WEATHER_API_KEY: 'bd5e378503939ddaee76f12ad7a97608',
    NEWS_API_KEY: 'pub_45510b243dd7ce29fdf845a2e7940cec57568'
};

// ==================== TELEGRAM INTEGRATION ====================
let tg = null;
try {
    tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }
} catch (e) {
    console.log('Not in Telegram');
}

// ==================== DOM ELEMENTS ====================
const splashScreen = document.getElementById('splashScreen');
const mainApp = document.getElementById('mainApp');
const themeToggle = document.getElementById('themeToggle');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherCard = document.getElementById('weatherCard');
const newsGrid = document.getElementById('newsGrid');
const categoryBtns = document.querySelectorAll('.category-btn');

// ==================== STATE ====================
let currentCity = 'London';
let currentCategory = 'general';
let darkMode = false;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Hide splash screen after 1.5 seconds
    setTimeout(() => {
        splashScreen.style.display = 'none';
        mainApp.style.display = 'block';
    }, 1500);

    // Load saved theme
    loadTheme();
    
    // Load initial data
    getWeather(currentCity);
    getNews(currentCategory);
    
    // Setup event listeners
    setupEventListeners();
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Weather search
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            currentCity = city;
            getWeather(city);
        }
    });
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                currentCity = city;
                getWeather(city);
            }
        }
    });
    
    // News category buttons
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            getNews(currentCategory);
        });
    });
}

// ==================== THEME FUNCTIONS ====================
function toggleTheme() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    themeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', darkMode);
}

function loadTheme() {
    const saved = localStorage.getItem('darkMode') === 'true';
    if (saved) {
        darkMode = true;
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// ==================== WEATHER FUNCTIONS ====================
async function getWeather(city) {
    try {
        weatherCard.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading weather...</div>';
        
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                q: city,
                appid: CONFIG.WEATHER_API_KEY,
                units: 'metric'
            }
        });
        
        const data = response.data;
        displayWeather(data);
    } catch (error) {
        console.error('Weather error:', error);
        weatherCard.innerHTML = '<div class="error">❌ City not found. Please try again.</div>';
    }
}

function displayWeather(data) {
    const icon = getWeatherIcon(data.weather[0].icon);
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();
    
    const html = `
        <div class="weather-main">
            <div>
                <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
                <div class="weather-city">${data.name}, ${data.sys.country}</div>
            </div>
            <div class="weather-icon">
                <i class="fas fa-${icon}"></i>
            </div>
        </div>
        <div class="weather-desc">${data.weather[0].description}</div>
        <div class="weather-details">
            <div class="detail-item">
                <i class="fas fa-temperature-high"></i>
                <span class="label">Feels Like</span>
                <span class="value">${Math.round(data.main.feels_like)}°C</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <span class="label">Humidity</span>
                <span class="value">${data.main.humidity}%</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <span class="label">Wind</span>
                <span class="value">${data.wind.speed} m/s</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-compress-alt"></i>
                <span class="label">Pressure</span>
                <span class="value">${data.main.pressure} hPa</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <span class="label">Sunrise</span>
                <span class="value">${sunrise}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-moon"></i>
                <span class="label">Sunset</span>
                <span class="value">${sunset}</span>
            </div>
        </div>
    `;
    
    weatherCard.innerHTML = html;
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
        newsGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading news...</div>';
        
        const response = await axios.get(`https://api.currentsapi.services/v1/latest-news`, {
            params: {
                apiKey: '7L8yNTVdO2Kd6pNIkmA0R2yIHKlOECR4YyXWnYkIP4cLZwYi',
                category: category,
                language: 'en',
                page_size: 12
            }
        });
        
        if (response.data.news && response.data.news.length > 0) {
            displayNews(response.data.news);
        } else {
            getFallbackNews();
        }
    } catch (error) {
        console.error('News error:', error);
        getFallbackNews();
    }
}

function displayNews(articles) {
    let html = '';
    
    articles.forEach(article => {
        const imageUrl = article.image || 'https://via.placeholder.com/300x200?text=News';
        const title = article.title || 'News Article';
        const description = article.description || 'Click to read full article';
        const source = article.source || 'News Source';
        const url = article.url;
        const date = article.published ? new Date(article.published).toLocaleDateString() : new Date().toLocaleDateString();

        html += `
            <div class="news-card" onclick="window.open('${url}', '_blank')">
                <img src="${imageUrl}" alt="${title}" class="news-image" onerror="this.src='https://via.placeholder.com/300x200?text=News'">
                <div class="news-content">
                    <h3 class="news-title">${title.substring(0, 80)}${title.length > 80 ? '...' : ''}</h3>
                    <p class="news-description">${description.substring(0, 100)}...</p>
                    <div class="news-meta">
                        <span class="news-source">${source}</span>
                        <span class="news-date">${date}</span>
                    </div>
                </div>
            </div>
        `;
    });

    newsGrid.innerHTML = html;
}

function getFallbackNews() {
    const fallbackNews = [
        {
            title: 'Global Technology Summit Highlights AI Advancements',
            source: 'Tech News',
            description: 'World leaders discuss future of artificial intelligence.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Tech+News'
        },
        {
            title: 'Markets Reach New Heights Amid Economic Recovery',
            source: 'Business Daily',
            description: 'Global markets show strong performance.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Business'
        },
        {
            title: 'Breakthrough in Renewable Energy Research',
            source: 'Science Today',
            description: 'Scientists announce major breakthrough.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Science'
        },
        {
            title: 'Championship Finals Set to Begin',
            source: 'Sports Network',
            description: 'Exciting matches ahead in the championship.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Sports'
        },
        {
            title: 'New Movie Releases This Weekend',
            source: 'Entertainment Weekly',
            description: 'Highly anticipated films hitting theaters.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Entertainment'
        },
        {
            title: 'Health Tips for Better Living',
            source: 'Health News',
            description: 'Experts share advice for healthy lifestyle.',
            url: '#',
            image: 'https://via.placeholder.com/300x200?text=Health'
        }
    ];
    
    displayNews(fallbackNews);
}