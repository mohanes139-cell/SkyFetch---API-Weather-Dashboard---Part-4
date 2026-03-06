// 1. Constructor Function
function WeatherApp(apiKey) {
    this.apiKey = apiKey;
    
    // DOM Elements
    this.form = document.getElementById('weather-form');
    this.input = document.getElementById('city-input');
    this.currentContainer = document.getElementById('current-weather');
    this.forecastSection = document.getElementById('forecast-section');
    this.forecastContainer = document.getElementById('forecast-container');
    this.recentContainer = document.getElementById('recent-searches');

    // Safely load recent searches from localStorage
    try {
        const stored = localStorage.getItem('recentSearches');
        this.recentSearches = stored ? JSON.parse(stored) : [];
    } catch (e) {
        this.recentSearches = []; // Fallback if data is corrupted
    }

    this.init();
}

// 2. Prototype Methods
WeatherApp.prototype.init = function() {
    // Bind 'this' so it refers to the WeatherApp instance
    this.form.addEventListener('submit', this.handleSearch.bind(this));
    
    this.renderRecentSearches();

    // Auto-load last searched city if it exists
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        this.fetchWeatherData(lastCity);
    }
};

WeatherApp.prototype.handleSearch = function(event) {
    event.preventDefault();
    const city = this.input.value.trim();
    
    if (city) {
        this.fetchWeatherData(city);
        this.input.value = ''; 
    }
};

WeatherApp.prototype.fetchWeatherData = async function(city) {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${this.apiKey}&units=metric`;

    try {
        // Fetch both APIs simultaneously
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('City not found. Please try again.');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        // Render Data
        this.renderCurrentWeather(currentData);
        this.renderForecast(forecastData);
        
        // Save the correct city name to local storage
        this.saveCity(currentData.name); 

    } catch (error) {
        console.error("Fetch Error:", error);
        alert(error.message);
    }
};

WeatherApp.prototype.saveCity = function(city) {
    // Remove duplicates (case-insensitive)
    this.recentSearches = this.recentSearches.filter(
        savedCity => savedCity.toLowerCase() !== city.toLowerCase()
    );
    
    // Add to the front of the array
    this.recentSearches.unshift(city);
    
    // Keep only top 5
    if (this.recentSearches.length > 5) {
        this.recentSearches.pop();
    }

    // Save back to storage
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    localStorage.setItem('lastCity', city);

    // Update UI
    this.renderRecentSearches();
};

WeatherApp.prototype.renderRecentSearches = function() {
    this.recentContainer.innerHTML = ''; 

    this.recentSearches.forEach(city => {
        const btn = document.createElement('button');
        btn.textContent = city;
        btn.className = 'recent-btn';
        
        // Fetch weather when button is clicked
        btn.addEventListener('click', () => {
            this.fetchWeatherData(city);
        });
        
        this.recentContainer.appendChild(btn);
    });
};

WeatherApp.prototype.renderCurrentWeather = function(data) {
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    
    this.currentContainer.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <div class="weather-info">
            <img src="${iconUrl}" alt="${data.weather[0].description}">
            <div class="details">
                <p class="temp">${Math.round(data.main.temp)}°C</p>
                <p class="desc" style="text-transform: capitalize;">${data.weather[0].description}</p>
                <p>Humidity: <strong>${data.main.humidity}%</strong></p>
                <p>Wind Speed: <strong>${data.wind.speed} m/s</strong></p>
            </div>
        </div>
    `;
    
    this.currentContainer.classList.remove('hidden');
};

WeatherApp.prototype.renderForecast = function(data) {
    // Filter out only the noon readings for the 5-day forecast
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    
    this.forecastContainer.innerHTML = ''; 

    dailyData.forEach(day => {
        const dateObj = new Date(day.dt * 1000);
        const dayString = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <h3>${dayString}</h3>
            <img src="${iconUrl}" alt="${day.weather[0].description}">
            <p class="temp">${Math.round(day.main.temp)}°C</p>
            <p class="desc">${day.weather[0].description}</p>
        `;
        this.forecastContainer.appendChild(card);
    });

    this.forecastSection.classList.remove('hidden');
};

// 3. Start the App
document.addEventListener('DOMContentLoaded', () => {
    const myApiKey = '8700b9af8a32a4b2b24d5969ebe5ae49';
    new WeatherApp(myApiKey);
});