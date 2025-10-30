const apiKey = '56a64c2fcdf37862abfcb5c755eeb701';
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const currentLocationElement = document.getElementById('current-location');
const currentIconElement = document.getElementById('current-icon');
const currentTempElement = document.getElementById('current-temp');
const currentConditionElement = document.getElementById('current-condition');
const currentHumidityElement = document.getElementById('current-humidity');
const currentWindElement = document.getElementById('current-wind');
const currentPressureElement = document.getElementById('current-pressure');
const forecastCardsContainer = document.querySelector('.forecast-cards');
const notificationContainer = document.createElement('div'); // Create a container for notifications
notificationContainer.classList.add('notification-container');
document.querySelector('.container').appendChild(notificationContainer);

let previousWeatherData = null;
const updateInterval = 600000; // Check for updates every 10 minutes (600000 milliseconds)
let currentCity = 'Sagana'; 

searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        currentCity = city;
        fetchWeatherData(city);
    }
});

function fetchWeatherData(city) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    Promise.all([fetch(currentWeatherUrl), fetch(forecastUrl)])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(data => {
            const currentWeatherData = data[0];
            const forecastData = data[1].list;
            displayCurrentWeather(currentWeatherData);
            displayForecast(forecastData);
            checkForWeatherChanges(currentWeatherData); 
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            alert('Could not fetch weather data. Please try again.');
        });
}

function displayCurrentWeather(data) {
    currentLocationElement.textContent = `Location: ${data.name}, ${data.sys.country}`;
    currentTempElement.textContent = Math.round(data.main.temp);
    currentConditionElement.textContent = data.weather[0].description;
    currentHumidityElement.textContent = data.main.humidity;
    currentWindElement.textContent = data.wind.speed;
    currentPressureElement.textContent = data.main.pressure;

    const iconCode = data.weather[0].icon;
    currentIconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    currentIconElement.alt = data.weather[0].description;
}

function displayForecast(forecastList) {
    forecastCardsContainer.innerHTML = ''; 
    const dailyForecast = {};

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000); 
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hours = date.getHours();

        if (hours >= 11 && hours <= 13) {
            if (!dailyForecast[day]) {
                dailyForecast[day] = {
                    date: date.toLocaleDateString('en-US'),
                    icon: item.weather[0].icon,
                    temp_min: item.main.temp_min,
                    temp_max: item.main.temp_max,
                    condition: item.weather[0].description,
                };
            } else {
                dailyForecast[day].temp_min = Math.min(dailyForecast[day].temp_min, item.main.temp_min);
                dailyForecast[day].temp_max = Math.max(dailyForecast[day].temp_max, item.main.temp_max);
            }
        }
    });

    Object.values(dailyForecast).slice(0, 5).forEach(dayData => {
        const forecastCard = document.createElement('div');
        forecastCard.classList.add('forecast-card');

        const dateElement = document.createElement('p');
        dateElement.classList.add('forecast-date');
        dateElement.textContent = dayData.date;

        const iconElement = document.createElement('img');
        iconElement.classList.add('forecast-icon');
        iconElement.src = `https://openweathermap.org/img/wn/${dayData.icon}@2x.png`;
        iconElement.alt = dayData.condition;

        const tempElement = document.createElement('p');
        tempElement.innerHTML = `Temp: ${Math.round(dayData.temp_min)}/ ${Math.round(dayData.temp_max)} &#8451;`;

        const conditionElement = document.createElement('p');
        conditionElement.classList.add('forecast-condition');
        conditionElement.textContent = dayData.condition;

        forecastCard.appendChild(dateElement);
        forecastCard.appendChild(iconElement);
        forecastCard.appendChild(tempElement);
        forecastCard.appendChild(conditionElement);
        forecastCardsContainer.appendChild(forecastCard);
    });
}

function checkForWeatherChanges(currentData) {
    if (previousWeatherData) {
        const tempChangeThreshold = 2; 
        const conditionChanged = previousWeatherData.weather[0].main !== currentData.weather[0].main;
        const significantTempChange = Math.abs(previousWeatherData.main.temp - currentData.main.temp) > tempChangeThreshold;

        if (conditionChanged && significantTempChange) {
            displayNotification(`Weather changed to ${currentData.weather[0].description} with a temperature change of ${Math.round(currentData.main.temp - previousWeatherData.main.temp)} &#8451;.`);
        } else if (conditionChanged) {
            displayNotification(`Weather changed to ${currentData.weather[0].description}.`);
        } else if (significantTempChange) {
            displayNotification(`Temperature changed by ${Math.round(currentData.main.temp - previousWeatherData.main.temp)} &#8451;.`);
        }
    }
    previousWeatherData = currentData; 
}

function displayNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    notificationContainer.appendChild(notification);


    setTimeout(() => {
        notification.remove();
    }, 5000); 
}


fetchWeatherData(currentCity);
setInterval(() => {
    fetchWeatherData(currentCity);
}, updateInterval);