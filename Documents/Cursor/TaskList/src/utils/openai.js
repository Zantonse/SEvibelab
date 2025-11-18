import OpenAI from 'openai';
import { logInfo, logError, LOG_SOURCES } from './logger';

// Get API key from environment or localStorage
const getApiKey = () => {
  // First try environment variable
  const envKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (envKey) return envKey;

  // Then try localStorage (user-set key)
  const storedKey = localStorage.getItem('taskListApp_openaiKey');
  return storedKey;
};

// Initialize OpenAI client
const createClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No OpenAI API key found. Please set VITE_OPENAI_API_KEY or configure it in settings.');
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Note: This is for demo purposes only
  });
};

// Categorize a task using LLM
export const categorizeTaskWithLLM = async (taskText) => {
    logInfo(LOG_SOURCES.LLM, 'Starting task categorization', { taskText: taskText.substring(0, 50) + '...' });
  try {
    const openai = createClient();

    const prompt = `
You are a task categorization assistant. Given a task description, categorize it into exactly ONE of these categories:
- Output: Tasks that create, produce, write, or generate something
- Input: Tasks that involve reading, learning, researching, or consuming information
- Maintenance: Tasks that involve fixing, updating, cleaning, organizing, or maintaining
- Connection: Tasks that involve communication, meetings, calls, emails, or networking
- Recovery: Tasks that involve rest, relaxation, breaks, or personal care

Task: "${taskText}"

Respond with only the category name, nothing else.`;

    logInfo(LOG_SOURCES.LLM, 'Sending categorization request to OpenAI', { model: 'gpt-4o-mini' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.1,
    });

    const category = response.choices[0]?.message?.content?.trim();
    const validCategories = ['Output', 'Input', 'Maintenance', 'Connection', 'Recovery'];

    const finalCategory = validCategories.includes(category) ? category : 'Output'; // fallback

    logInfo(LOG_SOURCES.LLM, 'Task categorization completed', {
      inputLength: taskText.length,
      category: finalCategory,
      fallback: !validCategories.includes(category)
    });

    return finalCategory;
  } catch (error) {
    logError(LOG_SOURCES.LLM, 'Task categorization failed', { error: error.message });
    // Return fallback category
    return 'Output';
  }
};

// Rephrase a task using LLM
export const rephraseTaskWithLLM = async (taskText) => {
  logInfo(LOG_SOURCES.LLM, 'Starting task rephrasing', { taskText: taskText.substring(0, 50) + '...' });
  try {
    const openai = createClient();

    const prompt = `
Rephrase this task to be clearer, more actionable, and more specific. Make it concise but comprehensive.

Original task: "${taskText}"

Provide only the rephrased version, nothing else.`;

    logInfo(LOG_SOURCES.LLM, 'Sending rephrasing request to OpenAI', { model: 'gpt-4o-mini' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.3,
    });

    const result = response.choices[0]?.message?.content?.trim() || taskText;

    logInfo(LOG_SOURCES.LLM, 'Task rephrasing completed', {
      inputLength: taskText.length,
      outputLength: result.length,
      changed: result !== taskText
    });

    return result;
  } catch (error) {
    logError(LOG_SOURCES.LLM, 'Task rephrasing failed', { error: error.message });
    return taskText; // Return original if failed
  }
};

// Summarize tasks due today
export const summarizeTasksWithLLM = async (tasksDueToday) => {
  logInfo(LOG_SOURCES.LLM, 'Starting task summary generation', { taskCount: tasksDueToday.length });

  try {
    const openai = createClient();

    if (tasksDueToday.length === 0) {
      logInfo(LOG_SOURCES.LLM, 'No tasks to summarize - returning default message');
      return "No tasks are due today. Great job staying on top of things!";
    }

    const taskList = tasksDueToday.map(task =>
      `- ${task.text} (${task.category}, ${task.priority} priority, ${task.effortLevel} effort)`
    ).join('\n');

    logInfo(LOG_SOURCES.LLM, 'Generated task list for summary', {
      taskCount: tasksDueToday.length,
      priorities: [...new Set(tasksDueToday.map(t => t.priority))],
      categories: [...new Set(tasksDueToday.map(t => t.category))]
    });

    const prompt = `
Summarize these tasks that are due today in a helpful, organized way. Group by priority (high, medium, low) and highlight any high-priority items.

Tasks due today:
${taskList}

Provide a concise summary that helps the user understand their day's priorities.`;

    logInfo(LOG_SOURCES.LLM, 'Sending summary request to OpenAI', { model: 'gpt-4o-mini' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.2,
    });

    const result = response.choices[0]?.message?.content?.trim() || 'Unable to generate summary.';

    logInfo(LOG_SOURCES.LLM, 'Task summary generation completed', {
      taskCount: tasksDueToday.length,
      summaryLength: result.length
    });

    return result;
  } catch (error) {
    logError(LOG_SOURCES.LLM, 'Task summary generation failed', { error: error.message });
    return 'Unable to generate summary due to API error.';
  }
};

