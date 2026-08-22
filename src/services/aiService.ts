import { AIHistoryItem } from '../types';

const HISTORY_KEY = 'AI_GENERATION_HISTORY';
const LEGACY_KEY_STORAGE = 'EXTERNAL_API_KEYS_ENCRYPTED';

/**
 * Canonical Bible365 runtime is API-free in the browser.
 * This compatibility function intentionally returns null so legacy callers
 * cannot create a direct Gemini client.
 */
export const getAI = () => null;

export const purgeLegacyBrowserApiKeys = () => {
  try {
    localStorage.removeItem(LEGACY_KEY_STORAGE);
  } catch (_) {
    // localStorage can be unavailable in SSR/tests; no action required.
  }
};

export const saveAIHistory = (item: Omit<AIHistoryItem, 'id' | 'timestamp' | 'date'>) => {
  const history = getAIHistory();
  const now = new Date();
  const newItem: AIHistoryItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 11),
    timestamp: now.getTime(),
    date: now.toISOString().split('T')[0]
  };

  history.unshift(newItem);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  return newItem;
};

export const getAIHistory = (): AIHistoryItem[] => {
  const saved = localStorage.getItem(HISTORY_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

export const clearAIHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const deleteAIHistoryItem = (id: string) => {
  const history = getAIHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.filter(item => item.id !== id)));
};

/**
 * Translation is supplied by the prepared multilingual T2 pack. If a language
 * is missing, return null instead of calling a browser API.
 */
export const translateEngineFields = async (
  _situation: string,
  _bibleRef: string,
  _bibleText: string,
  _targetLang: string
) => null;
