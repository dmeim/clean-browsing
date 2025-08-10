# Ping Monitor Widget

> **Status**: ⭕ Planned
> 
> **Development Stage**: Planning
> 
> **Note**: This is a planning document for a feature that is not yet implemented. It may change significantly or not be implemented at all. This document is used for brainstorming and planning purposes only.

## Overview

A website and service availability monitoring widget that provides real-time status indicators, response time tracking, and uptime statistics with visual alerts and notifications.

## Core Features

### Primary Functions
- Configurable ping intervals (30s, 1min, 5min, 15min, 30min, 1hr)
- Support for URLs, IP addresses, and custom ports
- HTTP response code interpretation with customizable status definitions
- Dynamic appearance changes based on current status
- Response time tracking with historical data and averages
- Uptime percentage calculation over configurable time periods
- Status change notifications with sound and visual alerts
- Multiple targets per widget with individual status tracking
- Downtime duration tracking and reporting

### Configuration Options
- **Target URL/IP**: Primary monitoring endpoint with optional custom port
- **Ping Interval**: Frequency of availability checks
- **Response Code Rules**: Define what HTTP codes mean UP/DOWN/WARNING
- **Appearance Changes**: Colors, opacity, borders for different statuses
- **Notification Preferences**: Enable/disable alerts for status changes
- **History Retention**: How long to keep response time and status data
- **Timeout Settings**: Request timeout values for different scenarios
- **Custom Headers**: Additional HTTP headers for authenticated endpoints

### User Interface
- Large, prominent status indicator with color coding
- Current response time display with units (ms)
- Uptime percentage with time period indicator
- Status history timeline showing recent status changes
- Response time graph (simple line chart)
- Last check timestamp and next check countdown
- Quick action buttons for manual ping and configuration
- Status change alerts with dismissible notifications

## Technical Specifications

### Dependencies
- Fetch API for HTTP requests and response handling
- Web Notifications API for status change alerts
- Local storage for historical data and configuration persistence
- Additional permissions: "notifications", host permissions for monitored sites

### Implementation Details
- Efficient HTTP request handling with timeout and error management
- Status determination logic based on response codes and timing
- Historical data storage with circular buffer for memory efficiency
- Background monitoring system with interval management
- Cross-origin request handling and CORS considerations
- Performance optimization for multiple simultaneous monitors

### File Structure
```
extension/widgets/ping-monitor-widget.js (implementation)
extension/styles.css (ping-monitor-widget styling)
docs/features/ping-monitor-widget.md (this file)
```

## Development Workflow

### Required Functions
- `renderPingMonitorWidget(widget, index)` - Creates DOM structure and status display
- `setupPingMonitorLogic(container, widget, index)` - Handles monitoring and status updates
- `openPingMonitorConfig(existing, index)` - Configuration interface
- `addPingMonitorWidget(options)` - Creates new widget instance
- `registerWidget()` call - Registers with widget system

### Settings Schema
```javascript
{
  type: 'ping-monitor',
  x: number,     // Grid X position (0-39)
  y: number,     // Grid Y position (0-23)
  w: number,     // Width in grid units (default: 4)
  h: number,     // Height in grid units (default: 3)
  settings: {
    targetUrl: string,           // URL or IP to monitor
    port: number,               // Optional custom port
    pingInterval: number,       // Check interval in minutes
    timeoutMs: number,         // Request timeout in milliseconds
    responseRules: object,     // HTTP code to status mapping
    notifications: boolean,    // Enable status change notifications
    historyRetention: number,  // Days to retain history data
    customHeaders: object,     // Additional HTTP headers
    appearanceRules: object,   // Status-based styling rules
    currentStatus: string,     // Current status (up/down/warning/unknown)
    lastCheck: timestamp,      // Last ping attempt timestamp
    responseHistory: array,    // Historical response data
    uptimeStats: object       // Uptime calculations
  }
}
```

### Status Indicators and Rules
```javascript
const statusTypes = {
  UP: 'up',           // 200-299 responses, response time < 500ms
  WARNING: 'warning', // 300-399 responses, or response time 500-2000ms
  DOWN: 'down',       // 400+ responses, timeouts, network errors
  UNKNOWN: 'unknown'  // No data available, initializing, or configuration error
};

const defaultResponseRules = {
  up: [200, 201, 202, 204, 206], // Success codes
  warning: [300, 301, 302, 304], // Redirect codes
  down: [400, 401, 403, 404, 500, 502, 503, 504], // Error codes
  timeout: 5000,      // Maximum response time for UP status
  warningTime: 2000   // Response time threshold for WARNING
};
```

### Appearance Configuration
```javascript
const appearanceOptions = {
  up: {
    backgroundColor: '#28a745',
    opacity: 1.0,
    borderColor: '#1e7e34',
    textColor: '#ffffff'
  },
  warning: {
    backgroundColor: '#ffc107',
    opacity: 0.9,
    borderColor: '#d39e00',
    textColor: '#212529'
  },
  down: {
    backgroundColor: '#dc3545',
    opacity: 1.0,
    borderColor: '#c82333',
    textColor: '#ffffff'
  },
  unknown: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
    borderColor: '#545b62',
    textColor: '#ffffff'
  }
};
```

## Future Enhancements

### Planned Improvements
- SSL certificate expiration monitoring and alerts
- Advanced response time analytics with percentiles
- Status dashboard for multiple monitors in single widget
- Integration with popular monitoring services (Pingdom, Datadog)
- Custom status page generation and sharing

### Advanced Features (Long-term)
- Network path tracing and diagnostic tools
- API endpoint monitoring with custom validation rules
- Performance regression detection and alerting
- Integration with incident management systems
- Mobile app notifications for critical status changes
- Advanced graphing with zoom and time range selection

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
- Cross-origin request limitations for many websites
- Handling different authentication methods and custom headers
- Accurate response time measurement accounting for network variations
- Efficient storage of historical data without excessive memory usage
- Battery and performance optimization for frequent monitoring intervals

### Design Decisions
- Fetch API vs WebSocket for different monitoring scenarios
- Single target per widget vs multi-target dashboard approach
- Real-time vs batch notification delivery for status changes
- Local storage vs external service for historical data retention
- Visual indicator prominence vs widget space efficiency

### Version History
- Future: Initial ping monitor implementation with basic URL monitoring
- Future: Enhanced with custom response rules and appearance options
- Future: Advanced analytics and multi-target monitoring features

---

## Usage Guidelines

### Configuration Instructions
1. Click the widgets button (plus icon)
2. Select "Ping Monitor" from the widget list
3. Enter the URL or IP address to monitor
4. Configure ping interval and timeout settings
5. Set up response code rules and appearance preferences
6. Enable notifications if desired
7. Click "Add" to create the widget
8. Grant notification permission when prompted

### Tips and Best Practices
- Use reasonable ping intervals (5min+) to avoid overwhelming target servers
- Configure appropriate timeout values based on expected response times
- Enable notifications for critical services but avoid alert fatigue
- Monitor both primary services and their dependencies
- Use custom headers for authenticated endpoints when necessary
- Regularly review and clean up historical data to maintain performance

### Common Issues and Solutions
- **CORS errors preventing monitoring**: Many sites block cross-origin requests; this is expected behavior
- **False positives for DOWN status**: Adjust timeout settings and response code rules for the target
- **Notifications not working**: Check browser notification permissions and widget settings
- **High battery/CPU usage**: Increase ping interval or reduce number of monitoring widgets
- **Inconsistent response times**: Network variations are normal; look at trends rather than individual measurements
- **Authentication failures**: Verify custom headers and credentials for protected endpoints

### Target URL Examples
```
Websites:
https://example.com
https://api.service.com/health
http://internal-server.local:8080

IP Addresses:
192.168.1.1
8.8.8.8:53
10.0.0.1:80

Services:
https://status.github.com
https://www.cloudflare.com
https://downdetector.com
```

### Response Rules Configuration
```javascript
// Example custom response rules
customRules: {
  up: [200, 202], // Only these codes are considered UP
  warning: [201, 301, 302], // These trigger WARNING status
  down: [400, 404, 500, 503], // These trigger DOWN status
  timeout: 3000, // 3 second timeout for UP status
  warningTime: 1500 // 1.5 second threshold for WARNING
}
```

---

*This widget will provide essential service monitoring functionality and demonstrate network request handling patterns for other API-dependent widgets.*