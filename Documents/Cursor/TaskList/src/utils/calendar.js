/**
 * Generate a Google Calendar link for a task
 * Opens Google Calendar in a new tab with pre-filled event details
 */
export const generateCalendarLink = (task) => {
  if (!task.dueDate) {
    return null;
  }

  // Format date for Google Calendar (YYYYMMDD format)
  const formatDateForCalendar = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const startDate = formatDateForCalendar(task.dueDate);
  const endDate = formatDateForCalendar(task.dueDate);
  
  // For all-day events, end date should be next day
  const endDateObj = new Date(task.dueDate + 'T00:00:00');
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDateNext = `${endDateObj.getFullYear()}${String(endDateObj.getMonth() + 1).padStart(2, '0')}${String(endDateObj.getDate()).padStart(2, '0')}`;

  // Build description with task details
  const descriptionParts = [];
  if (task.category) descriptionParts.push(`Category: ${task.category}`);
  if (task.priority) descriptionParts.push(`Priority: ${task.priority}`);
  if (task.effortLevel) descriptionParts.push(`Effort: ${task.effortLevel}`);
  if (task.type) descriptionParts.push(`Type: ${task.type}`);
  if (task.comments) descriptionParts.push(`\nNotes: ${task.comments}`);
  if (task.subtasks && task.subtasks.length > 0) {
    const subtaskList = task.subtasks.map(st => `- ${st.text}${st.completed ? ' ✓' : ''}`).join('\n');
    descriptionParts.push(`\nSubtasks:\n${subtaskList}`);
  }

  const description = descriptionParts.join('\n');

  // Build Google Calendar URL
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.text,
    dates: `${startDate}/${endDateNext}`,
    details: description,
    sf: 'true',
    output: 'xml'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Open task in Google Calendar
 */
export const addTaskToCalendar = (task) => {
  const calendarLink = generateCalendarLink(task);
  if (calendarLink) {
    window.open(calendarLink, '_blank', 'noopener,noreferrer');
  }
};

