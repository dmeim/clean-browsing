# Weather Widget

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A comprehensive weather information widget using the National Weather Service API to display current conditions, forecasts, and weather alerts with location detection and customizable display options.

## Core Features

### Primary Functions
- Current weather conditions display (temperature, conditions, humidity, wind)
- Hourly forecast for next 12-24 hours with scrollable timeline
- Daily forecast for 3-7 days with high/low temperatures
- Automatic location detection via browser geolocation
- Custom location support with city/ZIP code search
- Weather alerts and warnings with severity indicators
- Temperature unit switching (Fahrenheit/Celsius)
- Weather icons and condition animations

### Configuration Options
- **Location**: Auto-detect, custom city/ZIP, or coordinates
- **Forecast Length**: 3-day, 5-day, or 7-day forecast options
- **Temperature Units**: Fahrenheit or Celsius display
- **Refresh Interval**: 15min, 30min, 1hr, 2hr update frequency
- **Show Alerts**: Enable/disable weather warning notifications
- **Compact Mode**: Show minimal info vs full details

### User Interface
- Current conditions prominently displayed with large temperature
- Weather icon/animation showing current conditions
- Horizontal scrollable hourly forecast timeline
- Daily forecast cards with high/low and condition icons
- Alert banner for active weather warnings
- Location name display with last updated timestamp
- Responsive layout adapting to widget size

## Technical Specifications

### Dependencies
- National Weather Service API (weather.gov) - free, no API key required
- Browser Geolocation API for location detection
- Additional permissions: "geolocation" and host permissions for weather.gov

### Implementation Details
- Location coordinates conversion to NWS grid points
- API rate limiting and caching to prevent excessive requests
- Graceful error handling for API unavailability
- Icon mapping from NWS conditions to local weather icons
- Local storage caching of weather data with expiration
- Background refresh system with configurable intervals

### File Structure
```
extension/widgets/weather-widget.js (implementation)
extension/styles.css (weather-widget styling)
extension/resources/weather-icons/ (weather condition icons)
docs/features/weather-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderWeatherWidget(widget, index)` - Creates DOM structure and initial display
- `setupWeatherLogic(container, widget, index)` - Handles API calls and updates
- `openWeatherConfig(existing, index)` - Configuration interface
- `addWeatherWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'weather',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 6)
  h: number,     // Height in grid units (default: 4)
  settings: {
    location: string,        // 'auto', city name, or ZIP code
    coordinates: object,     // {lat: number, lon: number}
    forecastDays: number,    // 3, 5, or 7 day forecast
    units: string,          // 'fahrenheit' or 'celsius'
    refreshInterval: number, // Refresh interval in minutes
    showAlerts: boolean,    // Display weather alerts
    compactMode: boolean,   // Compact vs detailed display
    lastUpdate: timestamp,  // Last successful data fetch
    cachedData: object     // Cached weather data
  }
}
```

### API Endpoints
```javascript
// NWS API endpoints
const endpoints = {
  points: 'https://api.weather.gov/points/{lat},{lon}',
  forecast: 'https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast',
  hourly: 'https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast/hourly',
  alerts: 'https://api.weather.gov/alerts/active?point={lat},{lon}'
};
```

## Future Enhancements

### Planned Improvements
- Multiple weather data source support (OpenWeatherMap, AccuWeather)
- Weather radar integration with animated maps
- Historical weather data and trends
- Weather-based background themes
- Severe weather notification system

### Advanced Features (Long-term)
- Air quality index display
- UV index and sun exposure warnings  
- Weather-based activity recommendations
- Integration with calendar for weather-aware scheduling
- Weather photography integration showing local conditions

## Testing Checklist

### Functionality Testing
- [ ] Widget appears in widget list
- [ ] Configuration panel opens and saves correctly
- [ ] Widget renders properly in different grid sizes
- [ ] All core features work as expected
- [ ] Settings persist across browser sessions

### Integration Testing
- [ ] Widget works in jiggle mode (drag, resize, edit)
- [ ] Global appearance settings apply correctly
- [ ] Widget doesn't interfere with other widgets
- [ ] Performance is acceptable with multiple instances
- [ ] No console errors or warnings

### Cross-browser Testing
- [ ] Chrome (primary target)
- [ ] Edge (Chromium-based)
- [ ] Other Chromium browsers (optional)

## Development Notes

### Implementation Challenges
- NWS API requires coordinate-to-grid conversion before forecast requests
- Location detection accuracy and privacy considerations
- API rate limiting and caching strategy for multiple widget instances
- Weather icon design and animation performance
- Responsive layout for different widget sizes and content amounts

### Design Decisions
- Chose NWS API over commercial APIs for free, reliable US weather data
- Implemented local caching to reduce API calls and improve performance
- Designed responsive layout to work from compact to detailed views
- Prioritized current conditions over extended forecasts for primary display

### Version History
- Future: Initial weather widget implementation with NWS API
- Future: Enhanced with alerts and extended forecast features

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Weather" from the widget list
3. Choose location option (auto-detect or custom location)
4. Configure forecast length and temperature units
5. Set refresh interval based on your needs
6. Enable weather alerts if desired
7. Click "Add" to create the widget
8. Grant location permission if using auto-detect

### Tips and Best Practices
- Use larger widget sizes (6×4 or 8×5) for full forecast display
- Auto-detect location requires browser location permission
- Lower refresh intervals provide more current data but use more bandwidth
- Enable alerts for severe weather notifications in your area
- Compact mode works better for smaller widget sizes

### Common Issues and Solutions
- **Location not found**: Try using ZIP code instead of city name, or check spelling
- **Weather data not loading**: Check internet connection and API availability
- **Location permission denied**: Manually enter city/ZIP code in settings
- **Outdated weather**: Check refresh interval setting and last update time
- **Widget too crowded**: Enable compact mode or increase widget size
- **Alerts not showing**: Verify alerts are enabled and check if any are active in your area

### Location Format Examples
```
Auto-detect: 'auto' (requires location permission)
City: 'Seattle, WA' or 'New York, NY'
ZIP Code: '10001' or '90210'
Coordinates: Will be detected automatically from other formats
```

---

*This widget will provide essential weather information and demonstrate external API integration patterns for other data-driven widgets.*