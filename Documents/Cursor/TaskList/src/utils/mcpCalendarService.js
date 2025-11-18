/**
 * MCP Calendar Service
 *
 * This service interacts with the Google Calendar MCP server to create calendar events.
 *
 * Note: MCP tools are typically called server-side. For browser-based React apps,
 * you may need a backend proxy API that calls the MCP server, or use the Google Calendar API directly.
 *
 * This implementation provides a structure that can work with:
 * 1. A backend API proxy (recommended for production)
 * 2. Direct Google Calendar API calls (requires OAuth setup)
 * 3. MCP server HTTP endpoint (if available)
 */

import { logInfo, logError, LOG_SOURCES } from './logger';

/**
 * Convert task data to Google Calendar event parameters
 */
const formatTaskForCalendar = (task) => {
  if (!task.dueDate) {
    throw new Error('Task must have a due date to create a calendar event');
  }

  // Build event description with task details
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

  // Format dates for Google Calendar
  // For all-day events, use date format (YYYY-MM-DD)
  // For timed events, use datetime format (YYYY-MM-DDTHH:mm:ss)
  const startDate = new Date(task.dueDate + 'T00:00:00');
  const endDate = new Date(task.dueDate + 'T00:00:00');
  endDate.setDate(endDate.getDate() + 1); // End date is next day for all-day events

  // Format as ISO date strings for all-day events
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  return {
    summary: task.text,
    description: description || undefined,
    start: startDateStr,
    end: endDateStr,
    // For all-day events, we use date format
    // The MCP tool will handle the conversion
  };
};

/**
 * Create a calendar event using MCP
 * 
 * This function calls a backend API proxy that interfaces with the Google Calendar MCP server.
 * 
 * Setup required:
 * 1. Create a backend API endpoint at /api/calendar/create-event
 * 2. The backend should call the MCP tool: mcp_google-calendar_create-event
 * 3. Or use Google Calendar API directly with OAuth credentials
 */
export const createCalendarEvent = async (task, options = {}) => {
  try {
    logInfo(LOG_SOURCES.CALENDAR, `Starting calendar event creation for task: ${task.text}`);

    // Check if task already has a calendar event ID (prevent duplicates)
    if (task.calendarEventId && !options.force) {
      const error = new Error('This task already has a calendar event. Event ID: ' + task.calendarEventId);
      logError(LOG_SOURCES.CALENDAR, `Duplicate event creation blocked for task ${task.id}`, { taskId: task.id, existingEventId: task.calendarEventId });
      throw error;
    }

    // Format task data for calendar
    const eventData = formatTaskForCalendar(task);
    logInfo(LOG_SOURCES.CALENDAR, `Formatted task data for calendar event`, {
      taskId: task.id,
      summary: eventData.summary,
      start: eventData.start,
      end: eventData.end
    });

    // Get user's timezone (default to browser timezone)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Prepare event data for MCP/API call
    const eventPayload = {
      calendarId: options.calendarId || 'primary',
      summary: eventData.summary,
      description: eventData.description,
      start: eventData.start,
      end: eventData.end,
      timeZone: timeZone,
      // For all-day events, we use date format (YYYY-MM-DD)
      // The API should handle this correctly
    };

    logInfo(LOG_SOURCES.CALENDAR, `Sending calendar event creation request`, {
      taskId: task.id,
      calendarId: eventPayload.calendarId,
      summary: eventPayload.summary
    });

    // Call backend API proxy
    // The backend should call the MCP tool or Google Calendar API
    const apiEndpoint = options.apiEndpoint || '/api/calendar/create-event';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const error = new Error(errorData.message || `Failed to create calendar event: ${response.statusText}`);
      logError(LOG_SOURCES.CALENDAR, `Calendar API request failed for task ${task.id}`, {
        status: response.status,
        statusText: response.statusText,
        errorMessage: error.message
      });
      throw error;
    }

    const result = await response.json();
    logInfo(LOG_SOURCES.CALENDAR, `Calendar event created successfully for task ${task.id}`, {
      eventId: result.id || result.eventId,
      htmlLink: result.htmlLink
    });

    // Return the event ID for tracking
    return {
      eventId: result.id || result.eventId,
      htmlLink: result.htmlLink,
      success: true,
    };

  } catch (error) {
    logError(LOG_SOURCES.CALENDAR, `Failed to create calendar event for task ${task.id}`, {
      error: error.message,
      taskId: task.id
    });
    throw error;
  }
};

/**
 * Check if a task has a calendar event
 */
export const hasCalendarEvent = (task) => {
  return !!task.calendarEventId;
};

/**
 * Format task for calendar display (helper for UI)
 */
export const getCalendarEventPreview = (task) => {
  try {
    return formatTaskForCalendar(task);
  } catch (error) {
    return null;
  }
};

