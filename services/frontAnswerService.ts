export interface FrontAnswerResult {
  ok: boolean;
  status: 'ANSWERED' | 'QUEUED_FOR_RESEARCH' | string;
  answer?: string;
  detail?: string;
  responseId?: string;
  intent?: string;
  keyFacts?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  sources?: string[];
  updatedAt?: string;
  taskId?: string;
  error?: string;
}

export async function askBible365(question: string, options: {
  intent?: string;
  locale?: string;
  sessionId?: string;
} = {}): Promise<FrontAnswerResult> {
  const params = new URLSearchParams({
    appId: 'APP_BIBLE365',
    query: question,
    intent: options.intent || 'INT_BIBLE_TODAY_COUNSEL',
    locale: options.locale || 'ko-KR',
    market: 'KR',
    sessionId: options.sessionId || '',
  });
  const response = await fetch(`/api/front-answer?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const result = await response.json() as FrontAnswerResult;
  if (!response.ok || !result.ok) throw new Error(result.error || '답변 자료를 불러오지 못했습니다.');
  return result;
}
