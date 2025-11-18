/**
 * Logger utility for structured logging across the application
 *
 * Provides both console logging and in-memory log storage for UI display.
 * Logs are tagged with source (e.g., 'LLM', 'Calendar') and level (info, error, debug).
 */

// In-memory log storage (keeps last 100 entries)
const logEntries = [];
const MAX_LOG_ENTRIES = 100;

// Log levels
export const LOG_LEVELS = {
  INFO: 'info',
  ERROR: 'error',
  DEBUG: 'debug'
};

// Source tags
export const LOG_SOURCES = {
  LLM: 'LLM',
  CALENDAR: 'Calendar',
  SYSTEM: 'System',
  APP: 'App'
};

/**
 * Internal logging function
 */
function log(level, source, message, data = null) {
  const timestamp = new Date().toISOString();
  const entry = {
    id: Date.now() + Math.random(), // unique ID
    timestamp,
    level,
    source,
    message,
    data: data ? sanitizeData(data) : null
  };

  // Add to in-memory store
  logEntries.unshift(entry); // Add to beginning
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.splice(MAX_LOG_ENTRIES); // Remove oldest entries
  }

  // Console logging with structured format
  const consoleMessage = `[${source}] ${message}`;
  const consoleData = data ? sanitizeData(data) : undefined;

  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(consoleMessage, consoleData);
      break;
    case LOG_LEVELS.DEBUG:
      console.debug(consoleMessage, consoleData);
      break;
    default:
      console.log(consoleMessage, consoleData);
  }

  // Notify listeners (for UI updates)
  notifyLogListeners(entry);
}

// Listeners for UI updates
const logListeners = new Set();

/**
 * Subscribe to log updates
 */
export function addLogListener(callback) {
  logListeners.add(callback);
  return () => logListeners.delete(callback); // Return unsubscribe function
}

/**
 * Unsubscribe from log updates
 */
export function removeLogListener(callback) {
  logListeners.delete(callback);
}

/**
 * Notify all listeners of new log entry
 */
function notifyLogListeners(entry) {
  logListeners.forEach(callback => {
    try {
      callback(entry);
    } catch (error) {
      console.error('Error in log listener:', error);
    }
  });
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data) {
  if (typeof data === 'string' && data.includes('api') && data.includes('key')) {
    return '[REDACTED - API KEY]';
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    // Redact any potential API keys or sensitive fields
    const sensitiveFields = ['apiKey', 'key', 'token', 'password', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }
  return data;
}

/**
 * Log info level message
 */
export function logInfo(source, message, data = null) {
  log(LOG_LEVELS.INFO, source, message, data);
}

/**
 * Log error level message
 */
export function logError(source, message, data = null) {
  log(LOG_LEVELS.ERROR, source, message, data);
}

/**
 * Log debug level message
 */
export function logDebug(source, message, data = null) {
  log(LOG_LEVELS.DEBUG, source, message, data);
}

/**
 * Get all current log entries (for UI)
 */
export function getLogEntries() {
  return [...logEntries];
}

/**
 * Clear all log entries
 */
export function clearLogs() {
  logEntries.length = 0;
  logInfo(LOG_SOURCES.SYSTEM, 'Logs cleared by user');
}

/**
 * Get log entries filtered by source
 */
export function getLogEntriesBySource(source) {
  return logEntries.filter(entry => entry.source === source);
}

/**
 * Get log entries filtered by level
 */
export function getLogEntriesByLevel(level) {
  return logEntries.filter(entry => entry.level === level);
}
