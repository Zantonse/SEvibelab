import { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { categorizeTask } from './utils/categorizeTask';
import { rephraseTaskWithLLM, summarizeTasksWithLLM } from './utils/openai';
import { logInfo, logError, LOG_SOURCES } from './utils/logger';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import CompletedTasks from './components/CompletedTasks';
import ExportButton from './components/ExportButton';
import ThemeToggle from './components/ThemeToggle';
import SettingsModal from './components/SettingsModal';
import SummaryModal from './components/SummaryModal';
import DebugPanel from './components/DebugPanel';

function App() {
  const {
    activeTasks,
    completedTasks,
    showCompleted,
    addTask,
    completeTask,
    uncompleteTask,
    updateTaskCategory,
    updateTaskPriority,
    updateTaskDueDate,
    deleteTask,
    reorderTasks,
    updateTaskComments,
    updateTaskText,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    toggleCompletedVisibility,
    categorizeAllTasks,
    updateTaskCalendarEventId,
  } = useTasks();

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleRephrase = async (taskText) => {
    // This now just calls the LLM and returns the result
    // The TaskItem component will handle the UI for accept/reject
    return await rephraseTaskWithLLM(taskText);
  };

  const handleSummarizeToday = async () => {
    logInfo(LOG_SOURCES.APP, 'Starting summarize today operation');
    setIsGeneratingSummary(true);
    setShowSummary(true);

    try {
      // Get today's date in Pacific time (America/Los_Angeles)
      const now = new Date();
      const pacificToday = new Date(now.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles'
      }));

      // Set to start of day in Pacific time
      const todayPacific = new Date(pacificToday);
      todayPacific.setHours(0, 0, 0, 0);

      // Format as YYYY-MM-DD for comparison
      const todayString = todayPacific.toISOString().split('T')[0];

      logInfo(LOG_SOURCES.APP, `Filtering tasks for Pacific time date: ${todayString}`, {
        totalActiveTasks: activeTasks.length,
        totalCompletedTasks: completedTasks.length,
        todayDate: todayString
      });

      // Combine active and completed tasks
      const allTasks = [...activeTasks, ...completedTasks];

      // Filter tasks due today (Pacific time)
      const tasksDueToday = allTasks.filter(task => {
        if (!task.dueDate) return false;

        // Parse task due date and convert to Pacific time for comparison
        const taskDueDate = new Date(task.dueDate + 'T00:00:00'); // Ensure we're working with date only
        const taskDueString = taskDueDate.toISOString().split('T')[0];

        return taskDueString === todayString;
      });

      logInfo(LOG_SOURCES.APP, `Found ${tasksDueToday.length} tasks due today`, {
        activeTasksDue: tasksDueToday.filter(t => !t.completed).length,
        completedTasksDue: tasksDueToday.filter(t => t.completed).length
      });

      const summary = await summarizeTasksWithLLM(tasksDueToday);
      setSummaryText(summary);

      logInfo(LOG_SOURCES.APP, 'Summarize today operation completed successfully', {
        summaryLength: summary.length,
        tasksCount: tasksDueToday.length
      });

    } catch (error) {
      logError(LOG_SOURCES.APP, 'Summarize today operation failed', {
        error: error.message,
        errorStack: error.stack
      });
      setSummaryText('Failed to generate summary. Please check your API key and try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy summary:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Task List App
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleSummarizeToday}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              title="Summarize today's tasks"
            >
              📅 Summarize Today
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              title="Settings"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                showDebugPanel
                  ? 'bg-blue-600 text-white focus:ring-blue-500'
                  : 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500'
              }`}
              title={showDebugPanel ? 'Hide debug panel' : 'Show debug panel'}
            >
              🐛 Debug
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Task Input */}
        <TaskInput onAddTask={addTask} />

        {/* Export Button */}
        <ExportButton activeTasks={activeTasks} completedTasks={completedTasks} />

        {/* Active Tasks */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Active Tasks ({activeTasks.length})
          </h2>
          <TaskList
            tasks={activeTasks}
            onCompleteTask={completeTask}
            onCategoryChange={updateTaskCategory}
            onPriorityChange={updateTaskPriority}
            onUpdateDueDate={updateTaskDueDate}
            onDelete={deleteTask}
            onReorderTasks={reorderTasks}
            onUpdateComments={updateTaskComments}
            onUpdateTaskText={updateTaskText}
            onAddSubtask={addSubtask}
            onUpdateSubtask={updateSubtask}
            onDeleteSubtask={deleteSubtask}
            onRephrase={handleRephrase}
            onUpdateCalendarEventId={updateTaskCalendarEventId}
          />
        </div>

        {/* Completed Tasks */}
        <CompletedTasks
          tasks={completedTasks}
          isVisible={showCompleted}
          onToggleVisibility={toggleCompletedVisibility}
          onUncomplete={uncompleteTask}
          onCategoryChange={updateTaskCategory}
          onPriorityChange={updateTaskPriority}
          onUpdateDueDate={updateTaskDueDate}
          onDelete={deleteTask}
          onUpdateComments={updateTaskComments}
          onUpdateTaskText={updateTaskText}
          onAddSubtask={addSubtask}
          onUpdateSubtask={updateSubtask}
          onDeleteSubtask={deleteSubtask}
          onRephrase={handleRephrase}
          onUpdateCalendarEventId={updateTaskCalendarEventId}
        />

        {/* Modals */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <SummaryModal
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          summary={summaryText}
          isLoading={isGeneratingSummary}
          onCopy={handleCopySummary}
        />

        {/* Debug Panel */}
        <DebugPanel
          isVisible={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />
      </div>
    </div>
  );
}

export default App;
