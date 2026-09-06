import { ProverbData } from '../data/proverbs';

export type FetchType = 'today' | 'latest' | 'day';

type TranslationBlock = {
  title?: string;
  body?: string;
  dry?: { title?: string; body?: string };
  devotion?: { title?: string; body?: string };
};

interface SheetItem {
  slot: number;
  id: string;
  situation: string;
  dry?: { title?: string; body?: string };
  devotion?: { title?: string; body?: string };
  merged?: string;
  audio?: Record<string, string>;
  audio_direct?: Record<string, string>;
  audioFileIds?: Record<string, string>;
  tags?: string[];
  status?: string;
  bible: { ref: string; text: string };
  youtube?: string;
  createdAt?: string;
  translations?: Record<string, TranslationBlock>;
  situation_i18n?: Record<string, string>;
  bible_i18n?: Record<string, { ref: string; text: string }>;
}
interface SheetResponse {
  success: boolean;
  contract?: string;
  appId?: string;
  dayKey?: string;
  items: SheetItem[];
  updatedAt?: string;
  meta?: unknown;
  fallbackFrom?: string;
  error?: string;
}

function buildGatewayUrl(type: string, dayKey?: string): string {
  const url = new URL('/api/bible365/engine', window.location.origin);
  url.searchParams.set('type', type);
  if (dayKey) url.searchParams.set('dayKey', dayKey);
  return url.toString();
}

async function fetchGateway(type: string, dayKey?: string): Promise<SheetResponse> {
  const response = await fetch(buildGatewayUrl(type, dayKey), {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Bible365 gateway HTTP ${response.status}`);
  const data = (await response.json()) as SheetResponse;
  if (!data?.success || !Array.isArray(data.items)) throw new Error(data?.error || 'Invalid Bible365 response');
  return data;
}
function toProverbs(data: SheetResponse): Record<string, ProverbData> {
  const proverbs: Record<string, ProverbData> = {};

  data.items.forEach(item => {
    if (!item?.bible?.ref) return;
    let key = item.bible.ref.includes(' ') ? item.bible.ref.split(' ').pop() || item.bible.ref : item.bible.ref;
    if (proverbs[key]) key = `${key}#${item.slot || item.id}`;

    const translations: Record<string, any> = {};
    Object.entries(item.translations || {}).forEach(([lang, content]) => {
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
      if (url) fixedAudio[lang] = url;
    });
    const fixedAudioDirect: Record<string, string> = {};
    Object.entries(item.audio_direct || {}).forEach(([lang, url]) => {
      if (url) fixedAudioDirect[lang] = url;
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
}
export async function fetchProverbsFromSheet(
  type: FetchType = 'latest',
  dayKey?: string,
): Promise<Record<string, ProverbData>> {
  const dailyType = type === 'day' ? 'daily5_day' : `daily5_${type}`;
  try {
    // Canonical Daily5 read: Front -> same-origin gateway -> bound Apps Script -> Front_Bridge.
    return toProverbs(await fetchGateway(dailyType, dayKey));
  } catch (daily5Error) {
    console.warn('Bible365 Daily5 read unavailable; trying canonical legacy stored read.', daily5Error);
    try {
      // Compatibility read stays same-origin; no browser credential or direct WebApp URL.
      return toProverbs(await fetchGateway(type, dayKey));
    } catch (legacyError) {
      console.error('Failed to fetch Bible365 stored data through canonical gateway:', legacyError);
      throw legacyError;
    }
  }
}
