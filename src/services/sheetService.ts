import { ProverbData } from '../data/proverbs';

// Public endpoint pointer only. Credentials are never stored in the browser.
const DEFAULT_PUBLIC_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbwHt92CCmk_9Gu6kPYLwrAith_3SrYUnJE7A8_47RoJxUQlbwGgY-Me2E8rCBdY7WBeNQ/exec';
const BASE_URL =
  (import.meta.env.VITE_BIBLE_WEBAPP_URL as string | undefined) || DEFAULT_PUBLIC_WEBAPP_URL;

export type FetchType = 'today' | 'latest' | 'day';

interface SheetItem {
  slot: number;
  id: string;
  situation: string;
  dry: { title: string; body: string };
  devotion: { title: string; body: string };
  merged: string;
  langs?: Record<string, any>;
  title_en?: string;
  body_en?: string;
  title_jp?: string;
  body_jp?: string;
  title_cn?: string;
  body_cn?: string;
  title_es?: string;
  body_es?: string;
  title_de?: string;
  body_de?: string;
  title_hi?: string;
  body_hi?: string;
  audio: Record<string, string>;
  audio_direct?: Record<string, string>;
  audioFileIds?: Record<string, string>;
  tags: string[];
  status: string;
  bible: { ref: string; text: string };
  youtube?: string;
  createdAt: string;
  translations?: Record<string, any>;
  situation_i18n?: Record<string, string>;
  bible_i18n?: Record<string, { ref: string; text: string }>;
}

interface SheetResponse {
  success: boolean;
  dayKey?: string;
  items: SheetItem[];
  updatedAt?: string;
  meta?: any;
  fallbackFrom?: string;
  error?: string;
}

const parseResponse = async (response: Response): Promise<SheetResponse> => {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = (await response.json()) as SheetResponse;
  if (!data?.success || !Array.isArray(data.items)) {
    throw new Error(data?.error || 'Invalid response format from Bible365 backend');
  }
  return data;
};

const fetchDaily5 = async (type: FetchType, dayKey?: string): Promise<SheetResponse> => {
  const url = new URL(BASE_URL);
  url.searchParams.set('action', type === 'day' ? 'daily5_day' : `daily5_${type}`);
  if (type === 'day' && dayKey) url.searchParams.set('dayKey', dayKey);
  return parseResponse(await fetch(url.toString()));
};

const fetchLegacyPublicRead = async (type: FetchType, dayKey?: string): Promise<SheetResponse> => {
  const url = new URL(BASE_URL);
  url.searchParams.set('type', type);
  if (type === 'day' && dayKey) url.searchParams.set('dayKey', dayKey);
  return parseResponse(await fetch(url.toString()));
};

const toProverbs = (data: SheetResponse): Record<string, ProverbData> => {
  const proverbs: Record<string, ProverbData> = {};

  data.items.forEach(item => {
    if (!item?.bible?.ref) return;

    // Keep the familiar chapter:verse key when possible, but avoid overwriting
    // another Daily5 slot that shares the same passage.
    let key = item.bible.ref;
    if (key.includes(' ')) {
      const parts = key.split(' ');
      key = parts[parts.length - 1];
    }
    if (proverbs[key]) key = `${key}#${item.slot || item.id}`;

    const translations: Record<string, any> = {};
    if (item.translations) {
      Object.entries(item.translations).forEach(([lang, content]: [string, any]) => {
        translations[lang] = {
          merged: {
            title: content?.dry?.title || content?.title || '',
            body: content?.dry?.body || content?.body || '',
          },
          devotion: {
            title: content?.devotion?.title || content?.title || '',
            body: content?.devotion?.body || content?.body || '',
          },
        };
      });
    }

    if (!translations.KO) {
      translations.KO = {
        merged: { title: item.dry?.title || '', body: item.dry?.body || '' },
        devotion: {
          title: item.devotion?.title || item.dry?.title || '',
          body: item.devotion?.body || item.dry?.body || '',
        },
      };
    }

    const fixedAudio: Record<string, string> = {};
    Object.entries(item.audio || {}).forEach(([lang, url]) => {
      fixedAudio[lang] = url;
    });

    const fixedAudioDirect: Record<string, string> = {};
    Object.entries(item.audio_direct || {}).forEach(([lang, url]) => {
      fixedAudioDirect[lang] = url;
    });

    proverbs[key] = {
      id: item.id,
      reference: item.bible.ref,
      title: item.dry?.title || '',
      verse: item.bible.text || '',
      source: item.bible.ref,
      theme: item.situation || '',
      commentary: item.devotion?.body || item.dry?.body || '',
      application: item.youtube || '',
      chartType: 'radar',
      accentColor: '#5D6D5F',
      tag: (item.tags || []).join(', '),
      merged: item.merged || item.dry?.body || '',
      audio: fixedAudio,
      audio_direct: fixedAudioDirect,
      audioFileIds: item.audioFileIds,
      translations,
      situation_i18n: item.situation_i18n,
      bible_i18n: item.bible_i18n,
    };
  });

  return proverbs;
};

export async function fetchProverbsFromSheet(
  type: FetchType = 'latest',
  dayKey?: string
): Promise<Record<string, ProverbData>> {
  try {
    // New canonical path: Queens -> Seed -> T1 -> T2 -> Front Bridge.
    return toProverbs(await fetchDaily5(type, dayKey));
  } catch (daily5Error) {
    console.warn('Bible365 Daily5 backend is not active yet; trying legacy public read.', daily5Error);
    try {
      // Compatibility read only. No browser token is ever appended.
      return toProverbs(await fetchLegacyPublicRead(type, dayKey));
    } catch (legacyError) {
      console.error('Failed to fetch Bible365 stored data:', legacyError);
      throw legacyError;
    }
  }
}
