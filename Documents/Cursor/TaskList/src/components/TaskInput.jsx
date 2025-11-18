import { useState } from 'react';
import { categorizeTaskSync } from '../utils/categorizeTask';

const TaskInput = ({ onAddTask }) => {
  const [inputValue, setInputValue] = useState('');
  const [taskType, setTaskType] = useState('work'); // work or personal
  const [priority, setPriority] = useState('medium'); // low, medium, high
  const [dueDate, setDueDate] = useState(''); // ISO date string or empty
  const [effortLevel, setEffortLevel] = useState('medium'); // low, medium, high
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      setIsCategorizing(true);
      try {
        const { categorizeTask } = await import('../utils/categorizeTask');
        const category = await categorizeTask(trimmedValue);
        onAddTask({
          text: trimmedValue,
          category,
          type: taskType,
          priority,
          dueDate: dueDate || null,
          effortLevel
        });
        setInputValue('');
        setDueDate('');
      } catch (error) {
        console.error('Failed to categorize task:', error);
        // Fallback to sync categorization
        const category = categorizeTaskSync(trimmedValue);
        onAddTask({
          text: trimmedValue,
          category,
          type: taskType,
          priority,
          dueDate: dueDate || null,
          effortLevel
        });
        setInputValue('');
        setDueDate('');
      } finally {
        setIsCategorizing(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isCategorizing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCategorizing ? 'Categorizing...' : 'Add Task'}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </select>

          <select
            value={effortLevel}
            onChange={(e) => setEffortLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="low">Low Effort</option>
            <option value="medium">Medium Effort</option>
            <option value="high">High Effort</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="Due date"
          />
        </div>
      </div>
    </form>
  );
};

export default TaskInput;
