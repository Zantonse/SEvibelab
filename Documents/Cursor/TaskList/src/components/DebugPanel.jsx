import { useState, useEffect } from 'react';
import { addLogListener, removeLogListener, getLogEntries, clearLogs, LOG_LEVELS, LOG_SOURCES } from '../utils/logger';

/**
 * DebugPanel component for viewing application logs
 *
 * Shows a scrollable list of recent log entries with filtering and clearing capabilities.
 */
const DebugPanel = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterSource, setFilterSource] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');

  // Subscribe to log updates
  useEffect(() => {
    const handleLogUpdate = (newLog) => {
      setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]); // Keep only last 100
    };

    addLogListener(handleLogUpdate);

    // Initialize with current logs
    setLogs(getLogEntries());

    return () => {
      removeLogListener(handleLogUpdate);
    };
  }, []);

  const handleClearLogs = () => {
    clearLogs();
    setLogs([]);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLevelColor = (level) => {
    switch (level) {
      case LOG_LEVELS.ERROR:
        return 'text-red-400';
      case LOG_LEVELS.DEBUG:
        return 'text-gray-400';
      default:
        return 'text-blue-400';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case LOG_SOURCES.LLM:
        return 'text-purple-400';
      case LOG_SOURCES.CALENDAR:
        return 'text-green-400';
      case LOG_SOURCES.SYSTEM:
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  // Filter logs based on current filters
  const filteredLogs = logs.filter(log => {
    if (filterSource !== 'all' && log.source !== filterSource) return false;
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    return true;
  });

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 w-96 h-96 bg-gray-900 border border-gray-700 rounded-tl-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-tl-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">Debug Panel</span>
          <span className="text-xs text-gray-400">({filteredLogs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-200 text-sm px-2 py-1 rounded"
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            onClick={handleClearLogs}
            className="text-gray-400 hover:text-gray-200 text-sm px-2 py-1 rounded"
            title="Clear logs"
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-sm px-2 py-1 rounded"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-2 bg-gray-850 border-b border-gray-700">
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="text-xs bg-gray-700 text-gray-200 rounded px-2 py-1 border border-gray-600"
        >
          <option value="all">All Sources</option>
          <option value={LOG_SOURCES.LLM}>LLM</option>
          <option value={LOG_SOURCES.CALENDAR}>Calendar</option>
          <option value={LOG_SOURCES.APP}>App</option>
          <option value={LOG_SOURCES.SYSTEM}>System</option>
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="text-xs bg-gray-700 text-gray-200 rounded px-2 py-1 border border-gray-600"
        >
          <option value="all">All Levels</option>
          <option value={LOG_LEVELS.INFO}>Info</option>
          <option value={LOG_LEVELS.ERROR}>Error</option>
          <option value={LOG_LEVELS.DEBUG}>Debug</option>
        </select>
      </div>

      {/* Log Content */}
      <div className={`overflow-y-auto p-2 space-y-1 ${isExpanded ? 'h-64' : 'h-0'}`}>
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No logs to display
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="text-xs bg-gray-800 rounded p-2 border border-gray-700 hover:border-gray-600"
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="text-gray-500 font-mono">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className={`font-medium ${getSourceColor(log.source)}`}>
                  [{log.source}]
                </span>
                <span className={`font-medium ${getLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </span>
              </div>
              <div className="text-gray-300 break-words">
                {log.message}
              </div>
              {log.data && Object.keys(log.data).length > 0 && (
                <details className="mt-1">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-400 text-xs">
                    Details
                  </summary>
                  <pre className="text-xs text-gray-400 mt-1 bg-gray-900 p-1 rounded overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;


