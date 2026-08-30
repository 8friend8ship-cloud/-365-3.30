export type CounselPersona = {
  id: string;
  name: string;
  tone?: string;
};

export type CounselPackage = {
  version?: string;
  templateId?: string;
  requestId?: string;
  uiTitle?: string;
  counselorLabel?: string;
  namedPastorCounselor?: boolean;
  personalization?: {
    mode?: string;
    situationId?: string;
    situationName?: string;
    personaId?: string;
    personaName?: string;
    tone?: string;
  };
  scripture?: {
    ref?: string;
    text?: string;
    theme?: string;
    application?: string;
  };
  userQuestion?: string;
  t1Id?: string;
  storyboard?: any;
  draftSeed?: string;
  outputGuide?: any;
  qa?: string[];
  status?: string;
};

export type CounselRequest = {
  question: string;
  verseRef?: string;
  verseText?: string;
  theme?: string;
  application?: string;
  audience?: string;
  lang?: string;
  sessionKey?: string;
};

// URL은 공개 endpoint 포인터일 뿐 credential이 아니다.
// 실제 credential/token은 VITE_*에 두지 않고 server-side router 또는 Apps Script 권한 경계에서 처리한다.
const COUNSEL_WEBAPP_URL =
  (import.meta.env.VITE_COUNSEL_WEBAPP_URL as string | undefined) ||
  (import.meta.env.VITE_BIBLE_WEBAPP_URL as string | undefined) ||
  '';

const FALLBACK_PERSONAS: CounselPersona[] = [
  { id: 'PERSONA_LISTEN', name: '경청형', tone: '담담하게 듣고 감정을 과장하지 않음' },
  { id: 'PERSONA_REALITY', name: '현실점검형', tone: '사실·감정·선택·책임을 분리' },
  { id: 'PERSONA_RELATION', name: '관계회복형', tone: '도움·공경·화해·경계의 균형' },
  { id: 'PERSONA_ACTION', name: '실천동행형', tone: '24시간 안의 작은 행동에 집중' },
  { id: 'PERSONA_GROWTH', name: '배움성장형', tone: '인내·일관성·지정의를 성장으로 연결' },
];

const SITUATIONS = [
  { id: 'SIT_ANXIETY', name: '불안_걱정', words: ['불안','걱정','두려움','초조'] },
  { id: 'SIT_FAMILY', name: '가족_관계갈등', words: ['가족','부부','자녀','부모','갈등','관계'] },
  { id: 'SIT_CAREER', name: '직장_진로_결정', words: ['직장','진로','이직','퇴사','선택','결정'] },
  { id: 'SIT_FINANCE', name: '경제_재정압박', words: ['돈','재정','빚','부채','수입','생활비'] },
  { id: 'SIT_GUILT', name: '실패_죄책감', words: ['실패','죄책감','후회','실수','자책'] },
  { id: 'SIT_GRIEF', name: '상실_슬픔', words: ['상실','슬픔','죽음','이별','아픔'] },
  { id: 'SIT_LONELY', name: '외로움_소외', words: ['외로움','소외','고립','혼자'] },
  { id: 'SIT_BURNOUT', name: '봉사_소진', words: ['봉사','섬김','사역','소진','번아웃','피곤'] },
];

const hashIndex = (value: string, length: number) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash) % Math.max(1, length);
};

const classifySituation = (text: string) => {
  const normalized = text.toLowerCase();
  let best = SITUATIONS[0];
  let bestScore = -1;
  SITUATIONS.forEach((s) => {
    const score = s.words.reduce((n, word) => n + (normalized.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  });
  return best;
};

export function buildLocalCounselFallback(input: CounselRequest): CounselPackage {
  const situation = classifySituation(`${input.question} ${input.theme || ''}`);
  const persona = FALLBACK_PERSONAS[hashIndex(`${input.sessionKey || ''}|${input.question}`, FALLBACK_PERSONAS.length)];
  const requestId = `LOCAL_${Date.now()}`;
  return {
    version: 'B365_COUNSEL_FRONT_FALLBACK_V1',
    templateId: 'DRYWRITER_BIBLE_COUNSEL_V1_20260830',
    requestId,
    uiTitle: '글·상담',
    counselorLabel: '',
    namedPastorCounselor: false,
    personalization: {
      mode: 'LOCAL_DETERMINISTIC_FALLBACK',
      situationId: situation.id,
      situationName: situation.name,
      personaId: persona.id,
      personaName: persona.name,
      tone: persona.tone,
    },
    scripture: {
      ref: input.verseRef,
      text: input.verseText,
      theme: input.theme,
      application: input.application,
    },
    userQuestion: input.question,
    draftSeed: [
      `현재 상황: ${input.question}`,
      `상황 분류: ${situation.name}`,
      `상담 페르소나: ${persona.name}`,
      '본문 확인: 한 구절만 떼어 단정하지 않고 앞뒤 문맥을 확인합니다.',
      '점검: 본·권위·은사·진보·일관성·인간관계·지정의·건강한 섬김 중 필요한 렌즈를 적용합니다.',
      '행동: 오늘 멈출 것·시작할 것·유지할 것을 나누고 24시간 안의 한 가지 행동을 정합니다.',
    ].join('\n'),
    qa: [
      'SCRIPTURE_CONTEXT_REQUIRED',
      'NO_CONDEMNATION_OR_SPIRITUAL_OVERCLAIM',
      'NO_NAMED_PASTOR_COUNSELOR_LABEL',
      'PRACTICAL_ACTION_PRESENT',
    ],
    status: 'LOCAL_FALLBACK',
  };
}

export async function requestBible365Counsel(input: CounselRequest): Promise<CounselPackage> {
  if (!COUNSEL_WEBAPP_URL) return buildLocalCounselFallback(input);

  try {
    const payload = {
      action: 'counsel_enqueue',
      templateId: 'DRYWRITER_BIBLE_COUNSEL_V1_20260830',
      personalizationMode: 'RANDOM_FROM_QUALIFIED_T1_SEEDS',
      ...input,
    };
    const response = await fetch(COUNSEL_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`COUNSEL_HTTP_${response.status}`);
    const data = await response.json();
    if (!data?.success || !data?.package) throw new Error(data?.error || 'COUNSEL_INVALID_RESPONSE');
    return data.package as CounselPackage;
  } catch (error) {
    console.warn('Bible365 counseling backend unavailable; using stored-template fallback.', error);
    return buildLocalCounselFallback(input);
  }
}
