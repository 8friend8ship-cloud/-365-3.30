import { ProverbData } from '../data/proverbs';

const BASE_URL = "https://script.google.com/macros/s/AKfycbzMNeTPcLIktMPqzkJnVH4tJG_fZNt6821LQDwJtaBAkr5sYCjpFX_LFS_bBsDJwHne/exec";
const TOKEN = "bible2026secret";
const SPREADSHEET_ID = "1qHteZrNUa3ln2lix3p1Bufsh1o6WN98Ogoy9acuTlBg";
const EDITOR_ID = "109430604282542310163";

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
  translations?: Record<string, { title: string; body: string }>;
}

interface SheetResponse {
  success: boolean;
  dayKey?: string;
  items: SheetItem[];
  updatedAt?: string;
  meta?: any;
  fallbackFrom?: string;
}

export async function fetchProverbsFromSheet(type: FetchType = 'latest', dayKey?: string): Promise<Record<string, ProverbData>> {
  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("type", type);
    url.searchParams.set("token", TOKEN);
    url.searchParams.set("spreadsheetId", SPREADSHEET_ID);
    url.searchParams.set("editorId", EDITOR_ID);
    if (type === 'day' && dayKey) {
      url.searchParams.set("dayKey", dayKey);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: SheetResponse = await response.json();
    
    if (!data.success || !Array.isArray(data.items)) {
      throw new Error(data.success === false ? `API Error: ${data.dayKey || 'Unknown error'}` : "Invalid response format from sheet");
    }

    const proverbs: Record<string, ProverbData> = {};
    
    data.items.forEach(item => {
      // Key generation: remove book name, keep chapter:verse (e.g., "Proverbs 1:1" -> "1:1")
      let key = item.bible.ref;
      if (key.includes(' ')) {
          const parts = key.split(' ');
          key = parts[parts.length - 1];
      }

      // 다국어 데이터 매핑
      const translations: Record<string, any> = item.translations || {};
      
      // langs 필드가 있으면 우선 사용
      if (item.langs) {
        Object.entries(item.langs).forEach(([lang, content]) => {
          translations[lang] = {
            ...translations[lang],
            ...content,
            merged: content.merged || { title: content.title || '', body: content.body || '' }
          };
        });
      }

      // 개별 필드로 들어올 경우를 대비한 매핑 (title_en, en_title, dry_en 등 다양한 패턴 대응)
      const langs = ['EN', 'JP', 'CN', 'ES', 'DE', 'HI'];
      langs.forEach(lang => {
        const lowerLang = lang.toLowerCase();
        // @ts-ignore
        const title = item[`title_${lowerLang}`] || item[`${lowerLang}_title`] || item[`dry_${lowerLang}`]?.title;
        // @ts-ignore
        const body = item[`body_${lowerLang}`] || item[`${lowerLang}_body`] || item[`devotion_${lowerLang}`]?.body;
        
        if (title || body) {
          translations[lang] = {
            ...translations[lang],
            title: title || translations[lang]?.title || '',
            body: body || translations[lang]?.body || '',
            merged: { 
              title: title || translations[lang]?.title || '', 
              body: body || translations[lang]?.body || '' 
            }
          };
        }
      });

      // KO는 기본 dry/devotion 사용
      translations['KO'] = {
        dry: item.dry,
        devotion: item.devotion,
        merged: item.merged
      };

      // 오디오 URL 보정
      const fixedAudio: Record<string, string> = {};
      if (item.audio) {
        Object.entries(item.audio).forEach(([lang, url]) => {
          fixedAudio[lang] = url;
        });
      }

      const fixedAudioDirect: Record<string, string> = {};
      if (item.audio_direct) {
        Object.entries(item.audio_direct).forEach(([lang, url]) => {
          fixedAudioDirect[lang] = url;
        });
      }

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
        tag: item.tags.join(', '),
        merged: item.merged,
        audio: fixedAudio,
        audio_direct: fixedAudioDirect,
        audioFileIds: item.audioFileIds,
        translations: translations,
      };
    });

    return proverbs;
  } catch (error) {
    console.error("Failed to fetch proverbs from sheet:", error);
    throw error;
  }
}
