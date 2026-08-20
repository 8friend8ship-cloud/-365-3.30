import { ProverbData } from '../data/proverbs';
import { BIBLE1_BACKEND, requireBible1BackendUrl } from '../config/bible1Backend';

export type FetchType = 'today' | 'latest' | 'day';

interface SheetItem {
  slot: number;
  id: string;
  situation: string;
  dry: { title: string; body: string };
  devotion: { title: string; body: string };
  merged: string;
  langs?: Record<string, any>;
  title_en?: string; body_en?: string;
  title_jp?: string; body_jp?: string;
  title_cn?: string; body_cn?: string;
  title_es?: string; body_es?: string;
  title_de?: string; body_de?: string;
  title_hi?: string; body_hi?: string;
  audio: Record<string, string>;
  audio_direct?: Record<string, string>;
  audioFileIds?: Record<string, string>;
  tags: string[];
  status: string;
  bible: { ref: string; text: string };
  youtube?: string;
  createdAt: string;
  translations?: Record<string, { title: string; body: string; dry?: { title: string; body: string }; devotion?: { title: string; body: string } }>;
  situation_i18n?: Record<string, string>;
  bible_i18n?: Record<string, { ref: string; text: string }>;
}

interface Bible1UnifiedResponse {
  success: boolean;
  contract?: string;
  appId?: string;
  dayKey?: string;
  items: SheetItem[];
  updatedAt?: string;
  meta?: any;
  fallbackFrom?: string;
}

function buildBible1Url(type: FetchType, dayKey?: string): string {
  const url = new URL(requireBible1BackendUrl());
  url.searchParams.set('action', 'GET_CONTENT');
  url.searchParams.set('appId', BIBLE1_BACKEND.appId);
  url.searchParams.set('contract', BIBLE1_BACKEND.contract);
  url.searchParams.set('type', type);
  if (type === 'day' && dayKey) url.searchParams.set('dayKey', dayKey);
  return url.toString();
}

export async function fetchProverbsFromSheet(type: FetchType = 'latest', dayKey?: string): Promise<Record<string, ProverbData>> {
  try {
    const response = await fetch(buildBible1Url(type, dayKey), {
      method: 'GET',
      credentials: 'omit',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error(`Bible1 backend HTTP ${response.status}`);

    const data: Bible1UnifiedResponse = await response.json();
    if (!data.success || !Array.isArray(data.items)) {
      throw new Error(data.success === false ? `Bible1 API Error: ${data.dayKey || 'Unknown error'}` : 'Invalid Bible1 response format');
    }

    const proverbs: Record<string, ProverbData> = {};

    data.items.forEach(item => {
      let key = item.bible.ref;
      if (key.includes(' ')) {
        const parts = key.split(' ');
        key = parts[parts.length - 1];
      }

      const translations: Record<string, any> = {};
      if (item.translations) {
        Object.entries(item.translations).forEach(([lang, content]: [string, any]) => {
          translations[lang] = {
            merged: {
              title: content.dry?.title || content.title || '',
              body: content.dry?.body || content.body || '',
            },
            devotion: {
              title: content.devotion?.title || '',
              body: content.devotion?.body || '',
            },
          };
        });
      }

      if (!translations.KO) {
        translations.KO = {
          merged: { title: item.dry.title, body: item.dry.body },
          devotion: { title: item.devotion.title, body: item.devotion.body },
        };
      }

      const fixedAudio: Record<string, string> = {};
      Object.entries(item.audio || {}).forEach(([lang, url]) => {
        if (url) fixedAudio[lang] = url;
      });

      const fixedAudioDirect: Record<string, string> = {};
      Object.entries(item.audio_direct || {}).forEach(([lang, url]) => {
        if (url) fixedAudioDirect[lang] = url;
      });

      proverbs[key] = {
        id: item.id,
        reference: item.bible.ref,
        title: item.dry.title,
        verse: item.bible.text,
        source: item.bible.ref,
        theme: item.situation,
        commentary: item.devotion.body,
        application: '',
        chartType: 'radar',
        accentColor: '#5D6D5F',
        tag: (item.tags || []).join(', '),
        merged: item.merged,
        audio: fixedAudio,
        audio_direct: fixedAudioDirect,
        audioFileIds: item.audioFileIds,
        translations,
        situation_i18n: item.situation_i18n,
        bible_i18n: item.bible_i18n,
      };
    });

    return proverbs;
  } catch (error) {
    console.error('Failed to fetch Bible1 unified delivery package:', error);
    throw error;
  }
}
