import { AIHistoryItem } from '../types';

const HISTORY_KEY = "AI_GENERATION_HISTORY";

// Browser-side model clients and API keys are intentionally disabled.
// AI generation must go through the audited central Writer/Media backend.
export const getAI = () => {
  console.warn("DIRECT_BROWSER_AI_DISABLED");
  return null;
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
  } catch {
    return [];
  }
};

export const clearAIHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const deleteAIHistoryItem = (id: string) => {
  const history = getAIHistory();
  const newHistory = history.filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

export const translateEngineFields = async (
  situation: string,
  bibleRef: string,
  bibleText: string,
  targetLang: string
) => {
  void situation;
  void bibleRef;
  void bibleText;
  void targetLang;
  console.warn("DIRECT_BROWSER_AI_DISABLED: use the central Writer translation route");
  return null;
};
