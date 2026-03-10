export type AIHistoryType = 'counseling' | 'insight' | 'art' | 'strategy';

export interface AIHistoryItem {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  type: AIHistoryType;
  title: string;
  query?: string;
  response: string;
  imageUrl?: string;
  audioUrl?: string;
  verseRef?: string;
}

export type EngineLangKey = 'KO' | 'EN' | 'JP' | 'CN' | 'ES' | 'DE' | 'HI' | 'HE';

export type EnginePiece = { title?: string; body?: string; };

export type EngineLangBlock = {
  dry?: EnginePiece;
  devotion?: EnginePiece;
  merged?: string | EnginePiece;
  situation?: string;
  bible?: { ref: string; text: string };
};

export type EngineResponseData = {
  id?: string;
  situation?: string;
  dry?: EnginePiece;
  devotion?: EnginePiece;
  merged?: string | EnginePiece;
  tag?: string;
  tags?: string[];
  status?: string;
  bible?: { ref: string; text: string };
  audio?: { 
    KO?: string;
    EN?: string;
    JP?: string;
    CN?: string;
    ES?: string;
    DE?: string;
    HI?: string;
    HE?: string;
    // Legacy support
    KO_MUKSANG?: string;
    KO_GEONJO?: string;
  };
  audioFileIds?: Partial<Record<EngineLangKey, string>>;
  audioJson?: Partial<Record<EngineLangKey, string>>;
  audioWebApp?: Partial<Record<EngineLangKey, string>>;
  translations?: Partial<Record<EngineLangKey, EngineLangBlock>>;
  langs?: Partial<Record<EngineLangKey, EngineLangBlock>>;
  AUDIO_CREATED_AT?: string;
  AUDIO_FILE_ID?: string;
  AUDIO_SAFE_ID?: string;
  AUDIO_FILE_NAME?: string;
  createdAt?: string;
  slot?: number;
};

export type DailyPack = {
  success: boolean;
  dayKey: string;
  items: EngineResponseData[];
  updatedAt: string;
  meta?: any;
};
