import { useState, useEffect } from 'react';
import { createCalendarEvent, hasCalendarEvent } from '../utils/mcpCalendarService';
import { logInfo, logError, LOG_SOURCES } from '../utils/logger';

const CATEGORY_COLORS = {
  Output: 'bg-blue-100 text-blue-800',
  Input: 'bg-green-100 text-green-800',
  Maintenance: 'bg-cyan-100 text-cyan-800',
  Connection: 'bg-purple-100 text-purple-800',
  Recovery: 'bg-pink-100 text-pink-800',
};

const TYPE_COLORS = {
  work: 'bg-indigo-100 text-indigo-800',
  personal: 'bg-orange-100 text-orange-800',
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const EFFORT_COLORS = {
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const CATEGORIES = ['Output', 'Input', 'Maintenance', 'Connection', 'Recovery'];

const TaskItem = ({
  task,
  onComplete,
  onCategoryChange,
  onPriorityChange,
  onUpdateDueDate,
  onDelete,
  onUpdateComments,
  onUpdateTaskText,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onRephrase,
  onDragStart,
  onDragOver,
  onDrop,
  onUpdateCalendarEventId,
  isCompleted = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [isCreatingCalendarEvent, setIsCreatingCalendarEvent] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [calendarSuccess, setCalendarSuccess] = useState(false);
  const [dueDateInput, setDueDateInput] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [editedText, setEditedText] = useState(task.text);
  const [isEditingText, setIsEditingText] = useState(false);
  const [pendingRephrase, setPendingRephrase] = useState(null);
  const [showRephraseControls, setShowRephraseControls] = useState(false);

  // Sync due date input when task.dueDate changes externally
  useEffect(() => {
    setDueDateInput(task.dueDate ? task.dueDate.split('T')[0] : '');
  }, [task.dueDate]);

  // Sync edited text when task.text changes externally
  useEffect(() => {
    setEditedText(task.text);
  }, [task.text]);

  const handleCheckboxChange = () => {
    onComplete(task.id);
  };

  const handleCategoryChange = (e) => {
    if (onCategoryChange) {
      onCategoryChange(task.id, e.target.value, isCompleted);
    }
  };

  const handlePriorityChange = (e) => {
    if (onPriorityChange) {
      onPriorityChange(task.id, e.target.value, isCompleted);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id, isCompleted);
    }
  };

  const handleCommentsChange = (e) => {
    setCommentText(e.target.value);
  };

  const handleCommentsSave = () => {
    if (commentText.trim() && onUpdateComments) {
      const newComment = {
        id: Date.now().toString(),
        text: commentText.trim(),
        createdAt: new Date().toISOString()
      };
      onUpdateComments(task.id, newComment, isCompleted);
      setCommentText(''); // Clear the input after saving
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (newSubtaskText.trim() && onAddSubtask) {
      onAddSubtask(task.id, newSubtaskText.trim(), isCompleted);
      setNewSubtaskText('');
    }
  };

  const handleSubtaskToggle = (subtaskId) => {
    if (onUpdateSubtask) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      onUpdateSubtask(task.id, subtaskId, { completed: !subtask.completed }, isCompleted);
    }
  };

  const handleDeleteSubtask = (subtaskId) => {
    if (onDeleteSubtask) {
      onDeleteSubtask(task.id, subtaskId, isCompleted);
    }
  };

  const handleDueDateChange = (e) => {
    const newDate = e.target.value;
    setDueDateInput(newDate);
    if (onUpdateDueDate) {
      onUpdateDueDate(task.id, newDate || null, isCompleted);
    }
  };

  const handleRephrase = async () => {
    if (onRephrase && !isRephrasing && !showRephraseControls) {
      setIsRephrasing(true);
      try {
        const rephrasedText = await onRephrase(task.text);
        setPendingRephrase(rephrasedText);
        setShowRephraseControls(true);
      } catch (error) {
        console.error('Rephrase failed:', error);
      } finally {
        setIsRephrasing(false);
      }
    }
  };

  const handleAcceptRephrase = () => {
    if (pendingRephrase && onUpdateTaskText) {
      onUpdateTaskText(task.id, pendingRephrase, isCompleted);
      setPendingRephrase(null);
      setShowRephraseControls(false);
    }
  };

  const handleRejectRephrase = () => {
    setPendingRephrase(null);
    setShowRephraseControls(false);
  };

  const handleTextEditStart = () => {
    setIsEditingText(true);
  };

  const handleTextEditSave = () => {
    if (editedText.trim() && editedText !== task.text && onUpdateTaskText) {
      onUpdateTaskText(task.id, editedText.trim(), isCompleted);
    }
    setIsEditingText(false);
  };

  const handleTextEditCancel = () => {
    setEditedText(task.text);
    setIsEditingText(false);
  };

  const handleTextEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextEditSave();
    } else if (e.key === 'Escape') {
      handleTextEditCancel();
    }
  };

  const handleCreateCalendarEvent = async () => {
    logInfo(LOG_SOURCES.APP, `Calendar button clicked for task ${task.id}`, { taskText: task.text });

    if (!task.dueDate) {
      const errorMsg = 'Task must have a due date to create a calendar event';
      logError(LOG_SOURCES.APP, errorMsg, { taskId: task.id });
      setCalendarError(errorMsg);
      setTimeout(() => setCalendarError(null), 3000);
      return;
    }

    if (hasCalendarEvent(task)) {
      const errorMsg = 'This task already has a calendar event';
      logError(LOG_SOURCES.APP, errorMsg, { taskId: task.id, existingEventId: task.calendarEventId });
      setCalendarError(errorMsg);
      setTimeout(() => setCalendarError(null), 3000);
      return;
    }

    setIsCreatingCalendarEvent(true);
    setCalendarError(null);
    setCalendarSuccess(false);

    logInfo(LOG_SOURCES.APP, `Starting calendar event creation for task ${task.id}`, {
      taskId: task.id,
      taskText: task.text,
      dueDate: task.dueDate
    });

    try {
      const result = await createCalendarEvent(task);

      logInfo(LOG_SOURCES.APP, `Calendar event creation successful for task ${task.id}`, {
        taskId: task.id,
        eventId: result.eventId,
        hasHtmlLink: !!result.htmlLink
      });

      // Update task with calendar event ID
      if (onUpdateCalendarEventId && result.eventId) {
        onUpdateCalendarEventId(task.id, result.eventId, isCompleted);
        logInfo(LOG_SOURCES.APP, `Updated task ${task.id} with calendar event ID`, {
          taskId: task.id,
          eventId: result.eventId
        });
      }

      setCalendarSuccess(true);
      setTimeout(() => setCalendarSuccess(false), 3000);

      // Optionally open the calendar event in a new tab
      if (result.htmlLink) {
        logInfo(LOG_SOURCES.APP, `Opening calendar event in new tab`, { htmlLink: result.htmlLink });
        window.open(result.htmlLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      logError(LOG_SOURCES.APP, `Calendar event creation failed for task ${task.id}`, {
        taskId: task.id,
        error: error.message
      });
      setCalendarError(error.message || 'Failed to create calendar event');
      setTimeout(() => setCalendarError(null), 5000);
    } finally {
      setIsCreatingCalendarEvent(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Format due date for display
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate + 'T00:00:00'); // Ensure we're working with date only, no time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0);
    today.setSeconds(0, 0);
    today.setMilliseconds(0);

    const dueDateOnly = new Date(date);
    dueDateOnly.setHours(0, 0, 0, 0);
    dueDateOnly.setMinutes(0, 0);
    dueDateOnly.setSeconds(0, 0);
    dueDateOnly.setMilliseconds(0);

    const todayTime = today.getTime();
    const dueTime = dueDateOnly.getTime();

    if (dueTime === todayTime) {
      return 'Due today';
    } else if (dueTime < todayTime) {
      return `Overdue (${date.toLocaleDateString()})`;
    } else {
      return `Due ${date.toLocaleDateString()}`;
    }
  };

  // Check if task is overdue (only if due date is before today, not today itself)
  const isOverdue = (() => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0);
    today.setSeconds(0, 0);
    today.setMilliseconds(0);
    
    dueDate.setHours(0, 0, 0, 0);
    dueDate.setMinutes(0, 0);
    dueDate.setSeconds(0, 0);
    dueDate.setMilliseconds(0);
    
    return dueDate.getTime() < today.getTime();
  })();

  // Check if task is stale (30+ days old and not completed)
  const isStale = (() => {
    if (task.completed) return false;
    const createdAt = new Date(task.createdAt);
    const today = new Date();
    const daysOld = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
    return daysOld >= 30; // Consider stale after 30 days
  })();

  const [showStalePrompt, setShowStalePrompt] = useState(false);

  const handleStaleAction = (action) => {
    if (action === 'keep') {
      setShowStalePrompt(false);
      // Update createdAt to reset the stale timer
      if (onUpdateComments) {
        const newComment = task.comments 
          ? `${task.comments}\n[Kept on ${new Date().toLocaleDateString()}]`
          : `[Kept on ${new Date().toLocaleDateString()}]`;
        onUpdateComments(task.id, newComment, isCompleted);
      }
    } else if (action === 'rewrite') {
      setShowStalePrompt(false);
      if (onRephrase) {
        handleRephrase();
      }
    } else if (action === 'archive') {
      setShowStalePrompt(false);
      if (onComplete) {
        onComplete(task.id);
      }
    }
  };

  return (
    <div className="mb-2">
      {isStale && !showStalePrompt && (
        <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            ⚠️ Looks stale. Keep? Rewrite? Archive?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStaleAction('keep')}
              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              Keep
            </button>
            <button
              onClick={() => handleStaleAction('rewrite')}
              className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Rewrite
            </button>
            <button
              onClick={() => handleStaleAction('archive')}
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Archive
            </button>
            <button
              onClick={() => setShowStalePrompt(true)}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div
        className={`task-item flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-move ${
          isOverdue ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
        } ${isStale && !showStalePrompt ? 'border-amber-300 dark:border-amber-700' : ''}`}
        data-task-id={task.id}
        draggable={!isCompleted}
        onDragStart={(e) => onDragStart && onDragStart(e, task)}
        onDragOver={(e) => onDragOver && onDragOver(e)}
        onDrop={(e) => onDrop && onDrop(e, task.priority, task.type, isCompleted)}
      >
        {!isCompleted && (
          <span className="text-gray-400 cursor-move select-none">☰</span>
        )}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleCheckboxChange}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
        />
        <div className="flex-1">
          {isEditingText ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                onKeyDown={handleTextEditKeyDown}
                className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
                } bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600`}
                autoFocus
              />
              <button
                onClick={handleTextEditSave}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 px-2 py-1 text-sm"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={handleTextEditCancel}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 text-sm"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded ${
                task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
              }`}
              onClick={handleTextEditStart}
              title="Click to edit task text"
            >
              {task.text}
            </div>
          )}

          {/* AI Rephrase Accept/Reject UI */}
          {showRephraseControls && pendingRephrase && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>Original:</strong> {task.text}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                <strong>Suggested:</strong> {pendingRephrase}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptRephrase}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  ✅ Accept
                </button>
                <button
                  onClick={handleRejectRephrase}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          )}

          {formatDueDate(task.dueDate) && (
            <p className={`text-sm mt-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
              {formatDueDate(task.dueDate)}
            </p>
          )}
        </div>
        <button
          onClick={toggleExpanded}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1"
          title={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        <select
          value={task.priority}
          onChange={handlePriorityChange}
          className={`px-2 py-1 text-xs font-medium rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 dark:bg-gray-600'}`}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={task.category}
          onChange={handleCategoryChange}
          className={`px-2 py-1 text-xs font-medium rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 ${CATEGORY_COLORS[task.category] || 'bg-gray-100 dark:bg-gray-600'}`}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${EFFORT_COLORS[task.effortLevel] || 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
          {task.effortLevel || 'medium'}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[task.type] || 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
          {task.type || 'work'}
        </span>
        {task.dueDate && (
          <button
            onClick={handleCreateCalendarEvent}
            disabled={isCreatingCalendarEvent || hasCalendarEvent(task)}
            className={`${
              hasCalendarEvent(task)
                ? 'text-green-600 dark:text-green-400'
                : 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed relative group`}
            title={
              hasCalendarEvent(task)
                ? 'Calendar event already created'
                : isCreatingCalendarEvent
                ? 'Creating calendar event...'
                : 'Create Google Calendar event'
            }
          >
            {isCreatingCalendarEvent ? '⏳' : hasCalendarEvent(task) ? '✓' : '📅'}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {hasCalendarEvent(task)
                ? 'Calendar event created'
                : 'Create Google Calendar event'}
            </span>
          </button>
        )}
        {calendarError && (
          <span className="text-xs text-red-600 dark:text-red-400" title={calendarError}>
            ⚠️
          </span>
        )}
        {calendarSuccess && (
          <span className="text-xs text-green-600 dark:text-green-400" title="Calendar event created successfully">
            ✓
          </span>
        )}
        <button
          onClick={handleRephrase}
          disabled={isRephrasing}
          className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed relative group"
          title={isRephrasing ? "Rephrasing..." : "Rephrase task with AI - generates a clearer, more actionable version and adds it as a comment"}
        >
          {isRephrasing ? '⏳' : '✏️'}
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Rephrase with AI - generates clearer version as comment
          </span>
        </button>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
          title="Delete task"
        >
          ✕
        </button>
      </div>

      {isExpanded && (
        <div className="ml-8 mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          {/* Due Date Section */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Due Date</h4>
            <input
              type="date"
              value={dueDateInput}
              onChange={handleDueDateChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={() => {
                setDueDateInput('');
                if (onUpdateDueDate) {
                  onUpdateDueDate(task.id, null, isCompleted);
                }
              }}
              className="ml-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              Clear
            </button>
          </div>

          {/* Comments Section */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Comments</h4>

            {/* Existing Comments List */}
            {task.comments && task.comments.length > 0 && (
              <div className="space-y-2 mb-3">
                {task.comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{comment.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Comment */}
            <div className="space-y-2">
              <textarea
                value={commentText}
                onChange={handleCommentsChange}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={2}
              />
              <button
                onClick={handleCommentsSave}
                disabled={!commentText.trim()}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </div>
          </div>

          {/* Subtasks Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subtasks</h4>
            <form onSubmit={handleAddSubtask} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button
                type="submit"
                disabled={!newSubtaskText.trim()}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </form>

            <div className="space-y-1">
              {task.subtasks && task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleSubtaskToggle(subtask.id)}
                    className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                  />
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {subtask.text}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-0.5"
                    title="Delete subtask"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
