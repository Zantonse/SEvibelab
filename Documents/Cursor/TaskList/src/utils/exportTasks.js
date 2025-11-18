// Export tasks in different formats
export const exportAsText = (tasks) => {
  return tasks.map(task => {
    const status = task.completed ? '[✓]' : '[ ]';
    const category = task.category ? `[${task.category}]` : '';
    return `${status} ${category} ${task.text}`;
  }).join('\n');
};

export const exportAsJSON = (tasks) => {
  return JSON.stringify(tasks, null, 2);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const exportTasks = async (activeTasks, completedTasks, format = 'text') => {
  const allTasks = [...activeTasks, ...completedTasks];

  let exportText;
  if (format === 'json') {
    exportText = exportAsJSON(allTasks);
  } else {
    exportText = exportAsText(allTasks);
  }

  const success = await copyToClipboard(exportText);
  return { success, text: exportText, format };
};


