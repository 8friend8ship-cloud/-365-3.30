import { GoogleGenAI } from '@google/genai';
import { AIHistoryItem } from '../types';

const APP_SALT = "BIBLE_ENGINE_2026_SECURE_SALT";
const STORAGE_KEY = "EXTERNAL_API_KEYS_ENCRYPTED";
const HISTORY_KEY = "AI_GENERATION_HISTORY";

const decrypt = (encoded: string, salt: string) => {
  try {
    const text = atob(encoded);
    const textChars = text.split('');
    const saltChars = salt.split('');
    return textChars.map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ saltChars[i % saltChars.length].charCodeAt(0))
    ).join('');
  } catch (e) {
    return '';
  }
};

export const getAI = () => {
  // 1. Check external (user-provided) key first
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const externalKey = decrypt(saved, APP_SALT);
    if (externalKey) {
      console.log("🚀 Using external API key provided by user");
      return new GoogleGenAI({ apiKey: externalKey });
    }
  }

  // 2. Fallback to internal environment key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
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
  // Limit to last 100 items to avoid localStorage bloat
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  return newItem;
};

export const getAIHistory = (): AIHistoryItem[] => {
  const saved = localStorage.getItem(HISTORY_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
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

export const translateEngineFields = async (situation: string, bibleRef: string, bibleText: string, targetLang: string) => {
  const ai = getAI();
  if (!ai) return null;

  const prompt = `Translate the following text into ${targetLang}. 
Return ONLY a valid JSON object with three keys: "situation", "bibleRef", and "bibleText".
Do not include any markdown formatting or extra text.

Text to translate:
Situation: ${situation}
Bible Reference: ${bibleRef}
Bible Text: ${bibleText}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as { situation: string, bibleRef: string, bibleText: string };
  } catch (e) {
    console.error("Translation failed:", e);
    return null;
  }
};
