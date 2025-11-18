import { useState, useEffect } from 'react';

const STORAGE_KEY = 'taskListApp_tasks';

export const useTasks = () => {
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const { active = [], completed = [] } = JSON.parse(savedTasks);
        // Add default type, priority, comments, subtasks, dueDate, effortLevel, and calendarEventId for backward compatibility
        // Comments: convert old string format to array format
        const convertCommentsToArray = (comments) => {
          if (Array.isArray(comments)) return comments;
          if (comments && typeof comments === 'string' && comments.trim()) {
            // Convert old string format to array
            return [{ id: Date.now().toString(), text: comments, createdAt: new Date().toISOString() }];
          }
          return [];
        };

        const activeWithDefaults = active.map(task => ({
          ...task,
          type: task.type || 'work',
          priority: task.priority || 'medium',
          dueDate: task.dueDate || null,
          effortLevel: task.effortLevel || 'medium',
          comments: convertCommentsToArray(task.comments),
          subtasks: task.subtasks || [],
          calendarEventId: task.calendarEventId || null
        }));
        const completedWithDefaults = completed.map(task => ({
          ...task,
          type: task.type || 'work',
          priority: task.priority || 'medium',
          dueDate: task.dueDate || null,
          effortLevel: task.effortLevel || 'medium',
          comments: convertCommentsToArray(task.comments),
          subtasks: task.subtasks || [],
          calendarEventId: task.calendarEventId || null
        }));
        setActiveTasks(activeWithDefaults);
        setCompletedTasks(completedWithDefaults);
      } catch (error) {
        console.error('Failed to parse saved tasks:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    const tasksToSave = {
      active: activeTasks,
      completed: completedTasks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
  }, [activeTasks, completedTasks]);

  const addTask = (task) => {
    const newTask = {
      id: Date.now().toString(),
      text: task.text,
      category: task.category,
      type: task.type || 'work', // work or personal
      priority: task.priority || 'medium', // low, medium, high
      dueDate: task.dueDate || null, // due date as ISO string or null
      effortLevel: task.effortLevel || 'medium', // low, medium, high
      comments: task.comments || [], // comments field (array)
      subtasks: task.subtasks || [], // array of subtasks
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setActiveTasks(prev => [...prev, newTask]);
  };

  const completeTask = (taskId) => {
    const taskToComplete = activeTasks.find(task => task.id === taskId);
    if (taskToComplete) {
      const completedTask = { ...taskToComplete, completed: true, completedAt: new Date().toISOString() };
      setActiveTasks(prev => prev.filter(task => task.id !== taskId));
      setCompletedTasks(prev => [completedTask, ...prev]);
    }
  };

  const uncompleteTask = (taskId) => {
    const taskToUncomplete = completedTasks.find(task => task.id === taskId);
    if (taskToUncomplete) {
      const activeTask = { ...taskToUncomplete, completed: false, completedAt: undefined };
      setCompletedTasks(prev => prev.filter(task => task.id !== taskId));
      setActiveTasks(prev => [activeTask, ...prev]);
    }
  };

  const updateTaskCategory = (taskId, newCategory, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, category: newCategory } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, category: newCategory } : task
      ));
    }
  };

  const updateTaskPriority = (taskId, newPriority, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, priority: newPriority } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, priority: newPriority } : task
      ));
    }
  };

  const updateTaskDueDate = (taskId, newDueDate, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, dueDate: newDueDate || null } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, dueDate: newDueDate || null } : task
      ));
    }
  };

  const deleteTask = (taskId, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.filter(task => task.id !== taskId));
    } else {
      setActiveTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const reorderTasks = (taskId, newIndex, priority, type, isCompleted = false) => {
    const tasks = isCompleted ? [...completedTasks] : [...activeTasks];
    const tasksInSection = tasks.filter(task => task.priority === priority && task.type === type && task.completed === isCompleted);

    const taskToMove = tasksInSection.find(task => task.id === taskId);
    if (!taskToMove) return;

    const otherTasks = tasks.filter(task => !(task.priority === priority && task.type === type && task.completed === isCompleted));
    const updatedTasksInSection = tasksInSection.filter(task => task.id !== taskId);

    updatedTasksInSection.splice(newIndex, 0, taskToMove);

    const reorderedTasks = [...otherTasks, ...updatedTasksInSection];

    if (isCompleted) {
      setCompletedTasks(reorderedTasks);
    } else {
      setActiveTasks(reorderedTasks);
    }
  };

  const updateTaskComments = (taskId, newComment, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, comments: [...task.comments, newComment] } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, comments: [...task.comments, newComment] } : task
      ));
    }
  };

  const updateTaskText = (taskId, newText, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, text: newText } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, text: newText } : task
      ));
    }
  };

  const addSubtask = (taskId, subtaskText, isCompleted = false) => {
    const newSubtask = {
      id: Date.now().toString(),
      text: subtaskText,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, subtasks: [...task.subtasks, newSubtask] } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, subtasks: [...task.subtasks, newSubtask] } : task
      ));
    }
  };

  const updateSubtask = (taskId, subtaskId, updates, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
          )
        } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
          )
        } : task
      ));
    }
  };

  const deleteSubtask = (taskId, subtaskId, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
        } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? {
          ...task,
          subtasks: task.subtasks.filter(subtask => subtask.id !== subtaskId)
        } : task
      ));
    }
  };

  const toggleCompletedVisibility = () => {
    setShowCompleted(prev => !prev);
  };

  const categorizeAllTasks = (categorizeFunction) => {
    setActiveTasks(prev => prev.map(task => ({
      ...task,
      category: categorizeFunction(task.text)
    })));
  };

  const updateTaskCalendarEventId = (taskId, calendarEventId, isCompleted = false) => {
    if (isCompleted) {
      setCompletedTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, calendarEventId } : task
      ));
    } else {
      setActiveTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, calendarEventId } : task
      ));
    }
  };

  return {
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
  };
};
