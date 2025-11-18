import { categorizeTaskWithLLM } from './openai.js';

// Fallback keyword-based categorization
const CATEGORY_KEYWORDS = {
  Output: [
    'write', 'create', 'generate', 'produce', 'build', 'make', 'design', 'develop',
    'code', 'program', 'implement', 'craft', 'compose', 'author', 'publish'
  ],
  Input: [
    'read', 'review', 'study', 'learn', 'watch', 'listen', 'research', 'analyze',
    'examine', 'explore', 'investigate', 'check', 'view', 'observe'
  ],
  Maintenance: [
    'update', 'fix', 'clean', 'organize', 'maintain', 'repair', 'improve', 'refactor',
    'optimize', 'debug', 'test', 'validate', 'clean up', 'tidy', 'sort'
  ],
  Connection: [
    'meet', 'call', 'email', 'contact', 'network', 'connect', 'communicate', 'discuss',
    'collaborate', 'coordinate', 'schedule', 'reach out', 'follow up', 'respond'
  ],
  Recovery: [
    'rest', 'relax', 'recover', 'break', 'pause', 'refresh', 'recharge', 'sleep',
    'meditate', 'exercise', 'walk', 'stretch', 'breathe', 'unwind'
  ]
};

const categorizeTaskWithKeywords = (taskText) => {
  const lowerText = taskText.toLowerCase();

  // Check each category for matching keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  // Default to Output if no keywords match
  return 'Output';
};

export const categorizeTask = async (taskText) => {
  try {
    // Try LLM categorization first
    const llmCategory = await categorizeTaskWithLLM(taskText);
    return llmCategory;
  } catch (error) {
    console.warn('LLM categorization failed, using keyword fallback:', error);
    // Fallback to keyword-based categorization
    return categorizeTaskWithKeywords(taskText);
  }
};

// Synchronous version for when async is not needed
export const categorizeTaskSync = (taskText) => {
  return categorizeTaskWithKeywords(taskText);
};
