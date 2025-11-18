import { useState } from 'react';
import { exportTasks } from '../utils/exportTasks';

const ExportButton = ({ activeTasks, completedTasks }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const result = await exportTasks(activeTasks, completedTasks, format);
      if (result.success) {
        setLastExport({ format, timestamp: new Date() });
        // Show success message (you could add a toast notification here)
        alert(`Tasks exported to clipboard as ${format.toUpperCase()}!`);
      } else {
        alert('Failed to copy to clipboard. Please check your browser permissions.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => handleExport('text')}
        disabled={isExporting || (activeTasks.length === 0 && completedTasks.length === 0)}
        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? 'Exporting...' : 'Export as Text'}
      </button>
      <button
        onClick={() => handleExport('json')}
        disabled={isExporting || (activeTasks.length === 0 && completedTasks.length === 0)}
        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? 'Exporting...' : 'Export as JSON'}
      </button>
    </div>
  );
};

export default ExportButton;


