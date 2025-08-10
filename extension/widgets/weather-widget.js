// Weather Widget Implementation
(function() {
  'use strict';

  // Weather state management
  const weatherStates = {};

  // NWS API endpoints
  const NWS_API = {
    points: (lat, lon) => `https://api.weather.gov/points/${lat},${lon}`,
    forecast: (office, gridX, gridY) => `https://api.weather.gov/gridpoints/${office}/${gridX},${gridY}/forecast`,
    hourly: (office, gridX, gridY) => `https://api.weather.gov/gridpoints/${office}/${gridX},${gridY}/forecast/hourly`,
    stations: (gridId, gridX, gridY) => `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/stations`,
    observations: (stationId) => `https://api.weather.gov/stations/${stationId}/observations/latest`,
    alerts: (lat, lon) => `https://api.weather.gov/alerts/active?point=${lat},${lon}`
  };

  // Weather icon mapping
  const weatherIcons = {
    'clear': '☀️',
    'sunny': '☀️',
    'mostly clear': '🌤️',
    'partly cloudy': '⛅',
    'mostly cloudy': '🌥️',
    'cloudy': '☁️',
    'overcast': '☁️',
    'fog': '🌫️',
    'rain': '🌧️',
    'showers': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '🌨️',
    'sleet': '🌨️',
    'freezing rain': '🌨️',
    'windy': '💨',
    'hot': '🌡️',
    'cold': '🥶',
    'default': '🌡️'
  };

  function getWeatherIcon(description) {
    if (!description) return weatherIcons.default;
    const lower = description.toLowerCase();
    for (const [key, icon] of Object.entries(weatherIcons)) {
      if (lower.includes(key)) return icon;
    }
    return weatherIcons.default;
  }

  function celsiusToFahrenheit(celsius) {
    return Math.round((celsius * 9/5) + 32);
  }

  function fahrenheitToCelsius(fahrenheit) {
    return Math.round((fahrenheit - 32) * 5/9);
  }

  function formatTemperature(temp, unit) {
    if (temp === null || temp === undefined) return '--';
    const value = unit === 'celsius' ? fahrenheitToCelsius(temp) : Math.round(temp);
    const symbol = unit === 'celsius' ? '°C' : '°F';
    return `${value}${symbol}`;
  }

  function formatWind(speed, direction) {
    if (!speed) return 'Calm';
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(direction / 22.5) % 16;
    return `${Math.round(speed)} mph ${dirs[index]}`;
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function formatDayName(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  async function fetchWithTimeout(url, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  async function getLocationFromBrowser() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude.toFixed(4),
            lon: position.coords.longitude.toFixed(4)
          });
        },
        error => {
          let errorMessage = 'Location access denied';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access for this site.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          timeout: 10000,
          maximumAge: 300000, // Cache position for 5 minutes
          enableHighAccuracy: false // Use low accuracy for faster response
        }
      );
    });
  }

  async function geocodeLocation(location) {
    // For ZIP codes
    if (/^\d{5}$/.test(location)) {
      // Use a simple ZIP to coordinates mapping or external service
      // For now, we'll return null and let the user know to use coordinates
      throw new Error('ZIP code lookup requires external API. Please use city, state format or enable location detection.');
    }
    
    // For city, state format - this would need a geocoding service
    // For MVP, we'll ask users to use auto-detect or provide coordinates
    throw new Error('City lookup requires external API. Please enable location detection or contact support.');
  }

  async function fetchWeatherData(widget) {
    const state = weatherStates[widget.id] || {};
    
    try {
      // Get coordinates
      let coords;
      if (widget.settings.location === 'auto') {
        console.log('Weather: Getting location from browser...');
        coords = await getLocationFromBrowser();
        console.log('Weather: Got coordinates:', coords);
      } else if (widget.settings.location === 'test') {
        // Use Washington DC as test location
        coords = { lat: '38.8951', lon: '-77.0364' };
        console.log('Weather: Using test location (Washington, DC):', coords);
      } else if (widget.settings.location === 'manual' && widget.settings.coordinates) {
        coords = widget.settings.coordinates;
        console.log('Weather: Using manual coordinates:', coords);
      } else if (widget.settings.coordinates) {
        coords = widget.settings.coordinates;
        console.log('Weather: Using saved coordinates:', coords);
      } else {
        throw new Error('No location configured');
      }
      
      // Store coordinates for future use
      if (!widget.settings.coordinates || 
          widget.settings.coordinates.lat !== coords.lat || 
          widget.settings.coordinates.lon !== coords.lon) {
        widget.settings.coordinates = coords;
        saveSettings();
      }
      
      // Get grid point data
      if (!state.gridData || Date.now() - state.gridDataTime > 86400000) { // Cache for 24 hours
        const pointsUrl = NWS_API.points(coords.lat, coords.lon);
        console.log('Weather: Fetching grid data from:', pointsUrl);
        const pointsResponse = await fetchWithTimeout(pointsUrl);
        if (!pointsResponse.ok) {
          const errorText = await pointsResponse.text();
          console.error('Weather: Grid data fetch failed:', pointsResponse.status, errorText);
          throw new Error(`Failed to fetch grid data: ${pointsResponse.status}`);
        }
        const pointsData = await pointsResponse.json();
        
        state.gridData = {
          office: pointsData.properties.gridId,
          gridX: pointsData.properties.gridX,
          gridY: pointsData.properties.gridY,
          city: pointsData.properties.relativeLocation.properties.city,
          state: pointsData.properties.relativeLocation.properties.state,
          stationUrl: pointsData.properties.observationStations
        };
        state.gridDataTime = Date.now();
      }
      
      // Fetch current observations
      console.log('Weather: Fetching observation stations...');
      const stationsResponse = await fetchWithTimeout(state.gridData.stationUrl);
      if (stationsResponse.ok) {
        const stationsData = await stationsResponse.json();
        if (stationsData.features && stationsData.features.length > 0) {
          const stationId = stationsData.features[0].properties.stationIdentifier;
          console.log('Weather: Fetching observations from station:', stationId);
          const obsResponse = await fetchWithTimeout(NWS_API.observations(stationId));
          if (obsResponse.ok) {
            const obsData = await obsResponse.json();
            state.currentObservations = obsData.properties;
          } else {
            console.warn('Weather: Could not fetch current observations');
          }
        }
      } else {
        console.warn('Weather: Could not fetch station data');
      }
      
      // Fetch forecast data
      const forecastUrl = NWS_API.forecast(state.gridData.office, state.gridData.gridX, state.gridData.gridY);
      console.log('Weather: Fetching forecast from:', forecastUrl);
      const forecastResponse = await fetchWithTimeout(forecastUrl);
      if (!forecastResponse.ok) {
        console.error('Weather: Forecast fetch failed:', forecastResponse.status);
        throw new Error(`Failed to fetch forecast: ${forecastResponse.status}`);
      }
      const forecastData = await forecastResponse.json();
      state.forecast = forecastData.properties.periods;
      console.log('Weather: Got forecast for', state.forecast.length, 'periods');
      
      // Fetch hourly forecast if not in compact mode
      if (!widget.settings.compactMode) {
        const hourlyResponse = await fetchWithTimeout(
          NWS_API.hourly(state.gridData.office, state.gridData.gridX, state.gridData.gridY)
        );
        if (hourlyResponse.ok) {
          const hourlyData = await hourlyResponse.json();
          state.hourlyForecast = hourlyData.properties.periods.slice(0, 12);
        }
      }
      
      // Fetch alerts
      if (widget.settings.showAlerts) {
        const alertsResponse = await fetchWithTimeout(NWS_API.alerts(coords.lat, coords.lon));
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          state.alerts = alertsData.features;
        }
      }
      
      // Update last fetch time
      state.lastUpdate = Date.now();
      widget.settings.lastUpdate = state.lastUpdate;
      widget.settings.cachedData = {
        gridData: state.gridData,
        currentObservations: state.currentObservations,
        forecast: state.forecast,
        hourlyForecast: state.hourlyForecast,
        alerts: state.alerts
      };
      
      weatherStates[widget.id] = state;
      saveSettings();
      
      return state;
    } catch (error) {
      console.error('Weather fetch error:', error);
      
      // Try to use cached data if available
      if (widget.settings.cachedData) {
        weatherStates[widget.id] = {
          ...widget.settings.cachedData,
          lastUpdate: widget.settings.lastUpdate,
          error: error.message
        };
        return weatherStates[widget.id];
      }
      
      throw error;
    }
  }

  function renderWeatherContent(container, widget, state) {
    const units = widget.settings.units || 'fahrenheit';
    const compact = widget.settings.compactMode;
    
    // Clear container
    const content = container.querySelector('.weather-content') || container;
    
    if (!state || (!state.forecast && !state.currentObservations)) {
      content.innerHTML = `
        <div class="weather-error">
          <div class="error-icon">🌡️</div>
          <div class="error-message">Unable to load weather data</div>
          ${state?.error ? `<div class="error-details">${state.error}</div>` : ''}
          <div class="error-details" style="margin-top: 1rem;">
            <small>Tips:<br>
            • Make sure location permissions are enabled<br>
            • Check your internet connection<br>
            • Try switching to auto-detect location<br>
            • The NWS API only works for US locations</small>
          </div>
        </div>
      `;
      return;
    }
    
    // Get current conditions
    const current = state.currentObservations || {};
    const currentForecast = state.forecast?.[0] || {};
    
    // Temperature from observations or forecast
    const temp = current.temperature?.value !== undefined 
      ? celsiusToFahrenheit(current.temperature.value)
      : currentForecast.temperature;
    
    const feelsLike = current.heatIndex?.value !== undefined
      ? celsiusToFahrenheit(current.heatIndex.value)
      : current.windChill?.value !== undefined
        ? celsiusToFahrenheit(current.windChill.value)
        : null;
    
    const conditions = current.textDescription || currentForecast.shortForecast || 'Unknown';
    const humidity = current.relativeHumidity?.value;
    const windSpeed = current.windSpeed?.value ? Math.round(current.windSpeed.value * 0.621371) : null; // Convert m/s to mph
    const windDirection = current.windDirection?.value;
    const visibility = current.visibility?.value ? Math.round(current.visibility.value * 0.000621371) : null; // Convert m to miles
    
    // Build HTML based on compact mode
    let html = '';
    
    if (compact) {
      // Compact mode - minimal display
      html = `
        <div class="weather-compact">
          <div class="compact-main">
            <div class="compact-temp">${formatTemperature(temp, units)}</div>
            <div class="compact-icon">${getWeatherIcon(conditions)}</div>
          </div>
          <div class="compact-details">
            <div class="compact-condition">${conditions}</div>
            ${state.gridData ? `<div class="compact-location">${state.gridData.city}, ${state.gridData.state}</div>` : ''}
          </div>
        </div>
      `;
    } else {
      // Full mode - detailed display
      html = `
        <div class="weather-full">
          <div class="weather-header">
            ${state.gridData ? `<div class="weather-location">${state.gridData.city}, ${state.gridData.state}</div>` : ''}
            <div class="weather-updated">Updated ${new Date(state.lastUpdate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
          </div>
          
          <div class="weather-current">
            <div class="current-main">
              <div class="current-temp">
                <span class="temp-value">${formatTemperature(temp, units)}</span>
                <span class="weather-icon">${getWeatherIcon(conditions)}</span>
              </div>
              ${feelsLike !== null && Math.abs(feelsLike - temp) > 3 ? 
                `<div class="feels-like">Feels like ${formatTemperature(feelsLike, units)}</div>` : ''}
              <div class="current-condition">${conditions}</div>
            </div>
            
            <div class="current-details">
              ${humidity !== undefined ? `<div class="detail-item">
                <span class="detail-label">Humidity</span>
                <span class="detail-value">${Math.round(humidity)}%</span>
              </div>` : ''}
              ${windSpeed !== null ? `<div class="detail-item">
                <span class="detail-label">Wind</span>
                <span class="detail-value">${formatWind(windSpeed, windDirection)}</span>
              </div>` : ''}
              ${visibility !== null ? `<div class="detail-item">
                <span class="detail-label">Visibility</span>
                <span class="detail-value">${visibility} mi</span>
              </div>` : ''}
              ${currentForecast.probabilityOfPrecipitation?.value ? `<div class="detail-item">
                <span class="detail-label">Precip</span>
                <span class="detail-value">${currentForecast.probabilityOfPrecipitation.value}%</span>
              </div>` : ''}
            </div>
          </div>
          
          ${state.alerts && state.alerts.length > 0 ? `
            <div class="weather-alerts">
              ${state.alerts.map(alert => `
                <div class="weather-alert ${alert.properties.severity?.toLowerCase()}">
                  <span class="alert-icon">⚠️</span>
                  <span class="alert-text">${alert.properties.headline}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${state.hourlyForecast && state.hourlyForecast.length > 0 ? `
            <div class="weather-hourly">
              <div class="hourly-scroll">
                ${state.hourlyForecast.map(hour => `
                  <div class="hourly-item">
                    <div class="hourly-time">${formatTime(hour.startTime)}</div>
                    <div class="hourly-icon">${getWeatherIcon(hour.shortForecast)}</div>
                    <div class="hourly-temp">${formatTemperature(hour.temperature, units)}</div>
                    ${hour.probabilityOfPrecipitation?.value ? 
                      `<div class="hourly-precip">${hour.probabilityOfPrecipitation.value}%</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${state.forecast && state.forecast.length > 1 ? `
            <div class="weather-forecast">
              ${state.forecast.slice(1, widget.settings.forecastDays * 2 || 7).filter((_, i) => i % 2 === 0).map(day => `
                <div class="forecast-day">
                  <div class="forecast-name">${formatDayName(day.startTime)}</div>
                  <div class="forecast-icon">${getWeatherIcon(day.shortForecast)}</div>
                  <div class="forecast-temps">
                    <span class="forecast-high">${formatTemperature(day.temperature, units)}</span>
                    ${state.forecast.find(p => p.name.includes('Night') && p.startTime.includes(day.startTime.split('T')[0])) ?
                      `<span class="forecast-low">${formatTemperature(
                        state.forecast.find(p => p.name.includes('Night') && p.startTime.includes(day.startTime.split('T')[0])).temperature,
                        units
                      )}</span>` : ''}
                  </div>
                  ${day.probabilityOfPrecipitation?.value ? 
                    `<div class="forecast-precip">${day.probabilityOfPrecipitation.value}%</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    content.innerHTML = html;
  }

  function renderWeatherWidget(widget, index) {
    // Generate unique ID for this widget instance
    widget.id = widget.id || `weather-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const container = createWidgetContainer(widget, index, 'weather-widget');
    
    // Create content wrapper
    container.innerHTML = `
      <div class="weather-content">
        <div class="weather-loading">
          <div class="loading-icon">🌡️</div>
          <div class="loading-text">Loading weather...</div>
        </div>
      </div>
    `;
    
    // Apply appearance styling
    applyWidgetAppearance(container, widget);
    
    // Set up jiggle mode controls
    setupJiggleModeControls(container, widget, index);
    
    // Add to grid
    widgetGrid.appendChild(container);
    
    // Set up weather logic
    setupWeatherLogic(container, widget, index);
  }

  function setupWeatherLogic(container, widget, index) {
    // Initialize state
    if (!weatherStates[widget.id]) {
      weatherStates[widget.id] = widget.settings.cachedData || {};
    }
    
    // Function to update weather display
    async function updateWeather() {
      try {
        console.log('Weather: Starting update for widget', widget.id);
        const state = await fetchWeatherData(widget);
        renderWeatherContent(container, widget, state);
      } catch (error) {
        console.error('Weather update error:', error);
        // If auto-location fails, provide helpful message
        let errorMessage = error.message;
        if (error.message.includes('permission denied')) {
          errorMessage = 'Location access denied. Please enable location permissions or use manual location.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        }
        renderWeatherContent(container, widget, {
          error: errorMessage
        });
      }
    }
    
    // Initial render with cached data if available
    if (widget.settings.cachedData) {
      renderWeatherContent(container, widget, widget.settings.cachedData);
    }
    
    // Fetch fresh data
    updateWeather();
    
    // Set up refresh interval
    const refreshInterval = (widget.settings.refreshInterval || 30) * 60 * 1000; // Convert minutes to ms
    const intervalId = setInterval(updateWeather, refreshInterval);
    activeIntervals.push(intervalId);
    
    // Clean up state when widget is removed
    container.addEventListener('widgetRemoved', () => {
      delete weatherStates[widget.id];
    });
  }

  function addWeatherWidget(options) {
    const widget = {
      type: 'weather',
      x: 0,
      y: 0,
      w: options.compactMode ? 4 : 6,
      h: options.compactMode ? 3 : 5,
      settings: {
        location: options.location || 'auto',
        coordinates: options.coordinates || null,
        forecastDays: parseInt(options.forecastDays) || 3,
        units: options.units || 'fahrenheit',
        refreshInterval: parseInt(options.refreshInterval) || 30,
        showAlerts: options.showAlerts !== false,
        compactMode: options.compactMode || false,
        lastUpdate: null,
        cachedData: null
      },
      id: `weather-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    settings.widgets.push(widget);
    saveAndRender();
  }

  function openWeatherConfig(existing, index) {
    const isEdit = !!existing;
    const targetContainer = isEdit ? document.getElementById('widget-settings-tab') : widgetList;
    
    targetContainer.innerHTML = `
      <h3>${isEdit ? 'Edit Weather Widget' : 'Weather Widget'}</h3>
      
      <div class="input-group">
        <label for="weather-location">Location</label>
        <select id="weather-location">
          <option value="auto" ${!existing || existing.settings.location === 'auto' ? 'selected' : ''}>Auto-detect</option>
          <option value="test" ${existing && existing.settings.location === 'test' ? 'selected' : ''}>Test (Washington, DC)</option>
          <option value="manual" ${existing && existing.settings.location === 'manual' ? 'selected' : ''}>Manual coordinates</option>
        </select>
      </div>
      
      <div class="input-group" id="weather-manual-location" style="${existing && existing.settings.location === 'manual' ? '' : 'display:none'}">
        <label for="weather-location-input">Coordinates (lat,lon)</label>
        <input type="text" id="weather-location-input" placeholder="e.g., 38.8951,-77.0364" 
               value="${existing && existing.settings.coordinates ? `${existing.settings.coordinates.lat},${existing.settings.coordinates.lon}` : ''}">
        <small>Enter latitude and longitude separated by comma</small>
      </div>
      
      <div class="input-group">
        <label for="weather-forecast-days">Forecast Days</label>
        <select id="weather-forecast-days">
          <option value="3" ${!existing || existing.settings.forecastDays === 3 ? 'selected' : ''}>3 days</option>
          <option value="5" ${existing && existing.settings.forecastDays === 5 ? 'selected' : ''}>5 days</option>
          <option value="7" ${existing && existing.settings.forecastDays === 7 ? 'selected' : ''}>7 days</option>
        </select>
      </div>
      
      <div class="input-group">
        <label for="weather-units">Temperature Units</label>
        <select id="weather-units">
          <option value="fahrenheit" ${!existing || existing.settings.units === 'fahrenheit' ? 'selected' : ''}>Fahrenheit</option>
          <option value="celsius" ${existing && existing.settings.units === 'celsius' ? 'selected' : ''}>Celsius</option>
        </select>
      </div>
      
      <div class="input-group">
        <label for="weather-refresh">Refresh Interval</label>
        <select id="weather-refresh">
          <option value="15" ${existing && existing.settings.refreshInterval === 15 ? 'selected' : ''}>15 minutes</option>
          <option value="30" ${!existing || existing.settings.refreshInterval === 30 ? 'selected' : ''}>30 minutes</option>
          <option value="60" ${existing && existing.settings.refreshInterval === 60 ? 'selected' : ''}>1 hour</option>
          <option value="120" ${existing && existing.settings.refreshInterval === 120 ? 'selected' : ''}>2 hours</option>
        </select>
      </div>
      
      <div class="input-group checkbox-group">
        <label><input type="checkbox" id="weather-alerts" ${!existing || existing.settings.showAlerts ? 'checked' : ''}> Show weather alerts</label>
      </div>
      
      <div class="input-group checkbox-group">
        <label><input type="checkbox" id="weather-compact" ${existing && existing.settings.compactMode ? 'checked' : ''}> Compact mode</label>
      </div>
      
      <div class="widget-config-buttons">
        <button id="weather-save">${isEdit ? 'Save' : 'Add'}</button>
        <button id="weather-cancel">${isEdit ? 'Exit' : 'Cancel'}</button>
      </div>
    `;
    
    // Set up location type toggle
    const locationSelect = document.getElementById('weather-location');
    const manualGroup = document.getElementById('weather-manual-location');
    locationSelect.addEventListener('change', () => {
      manualGroup.style.display = locationSelect.value === 'manual' ? 'block' : 'none';
    });
    
    // Use helper function for save/cancel logic
    setupWidgetConfigButtons(isEdit, 'weather', index, addWeatherWidget, () => {
      const locationType = document.getElementById('weather-location').value;
      const locationInput = document.getElementById('weather-location-input').value.trim();
      
      let coordinates = null;
      if (locationType === 'manual' && locationInput) {
        const parts = locationInput.split(',').map(s => s.trim());
        if (parts.length === 2) {
          coordinates = {
            lat: parseFloat(parts[0]).toFixed(4),
            lon: parseFloat(parts[1]).toFixed(4)
          };
        }
      }
      
      return {
        location: locationType,
        coordinates: coordinates,
        forecastDays: parseInt(document.getElementById('weather-forecast-days').value),
        units: document.getElementById('weather-units').value,
        refreshInterval: parseInt(document.getElementById('weather-refresh').value),
        showAlerts: document.getElementById('weather-alerts').checked,
        compactMode: document.getElementById('weather-compact').checked
      };
    });
  }

  // Register the weather widget
  registerWidget('weather', {
    name: 'Weather',
    render: renderWeatherWidget,
    openConfig: openWeatherConfig
  });

})();