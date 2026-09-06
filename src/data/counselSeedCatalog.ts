export type FrequentCounselSeed = {
  id: string;
  priority: number;
  match: string[];
  situationId: string;
  personaId: string;
  t1Id: string;
  sourceRef: string;
  seedBody: string;
};

export const FREQUENT_COUNSEL_SEEDS: FrequentCounselSeed[] = [
  {
    id: 'HOT_PROV_1_1_2',
    priority: 100,
    match: ['proverbs 1:1-2', '잠언 1:1-2', '지식', '지혜', '선택'],
    situationId: 'SIT_CAREER',
    personaId: 'PERSONA_ACTION',
    t1Id: 'T1_SIT_CAREER_PERSONA_ACTION',
    sourceRef: '잠언 1:1-2',
    seedBody: '지식의 양보다 말씀을 실제 선택으로 옮기는 지혜를 점검하고, 오늘 확인할 정보·상담할 사람·보류할 결정을 하나씩 정한다.',
  },
  {
    id: 'HOT_PHOTO_8LENS_20260830',
    priority: 99,
    match: ['행실', '사랑', '믿음', '은사', '사적욕심', '인내', '승리', '전도', '선교', '공경', '지정의', '건강한 섬김'],
    situationId: 'SIT_BURNOUT',
    personaId: 'PERSONA_GROWTH',
    t1Id: 'T1_SIT_BURNOUT_PERSONA_GROWTH',
    sourceRef: '디모데전서 4:12-16; 5:1-16 / 2026-08-30 손글씨 보정 Seed',
    seedBody: '본이 됨→말씀을 행동함→은사를 사람을 세우는 데 사용→인내와 일관성→도움·공경→지·정·의→가르치고 배우는 건강한 섬김으로 연결한다.',
  },
  {
    id: 'HOT_ANXIETY_LISTEN',
    priority: 90,
    match: ['불안', '걱정', '두려움', '초조'],
    situationId: 'SIT_ANXIETY',
    personaId: 'PERSONA_LISTEN',
    t1Id: 'T1_SIT_ANXIETY_PERSONA_LISTEN',
    sourceRef: 'COMMON',
    seedBody: '불안과 걱정을 사실과 감정으로 나누고 말씀 문맥을 확인한 뒤 오늘 가능한 한 가지 행동으로 연결한다.',
  },
  {
    id: 'HOT_FAMILY_RELATION',
    priority: 90,
    match: ['가족', '부부', '자녀', '부모', '갈등', '관계', '용서'],
    situationId: 'SIT_FAMILY',
    personaId: 'PERSONA_RELATION',
    t1Id: 'T1_SIT_FAMILY_PERSONA_RELATION',
    sourceRef: 'COMMON',
    seedBody: '도움·공경·화해와 건강한 경계를 함께 점검한다.',
  },
  {
    id: 'HOT_CAREER_REALITY',
    priority: 90,
    match: ['직장', '진로', '이직', '퇴사', '사업', '선택', '결정'],
    situationId: 'SIT_CAREER',
    personaId: 'PERSONA_REALITY',
    t1Id: 'T1_SIT_CAREER_PERSONA_REALITY',
    sourceRef: 'COMMON',
    seedBody: '말씀과 현실 조건을 분리해 확인하고 사적 욕심을 결정의 근거로 두지 않는다.',
  },
  {
    id: 'HOT_FINANCE_REALITY',
    priority: 90,
    match: ['돈', '경제', '재정', '빚', '부채', '수입', '지출', '생활비'],
    situationId: 'SIT_FINANCE',
    personaId: 'PERSONA_REALITY',
    t1Id: 'T1_SIT_FINANCE_PERSONA_REALITY',
    sourceRef: 'COMMON',
    seedBody: '수입·지출·부채·책임을 사실대로 확인하고 영적 단정으로 회피하지 않는다.',
  },
  {
    id: 'HOT_GUILT_LISTEN',
    priority: 90,
    match: ['실패', '죄책감', '후회', '실수', '자책'],
    situationId: 'SIT_GUILT',
    personaId: 'PERSONA_LISTEN',
    t1Id: 'T1_SIT_GUILT_PERSONA_LISTEN',
    sourceRef: 'COMMON',
    seedBody: '실패와 자기정죄를 구분하고 사실을 과장하지 않는다.',
  },
  {
    id: 'HOT_GRIEF_LISTEN',
    priority: 90,
    match: ['상실', '슬픔', '죽음', '이별', '아픔'],
    situationId: 'SIT_GRIEF',
    personaId: 'PERSONA_LISTEN',
    t1Id: 'T1_SIT_GRIEF_PERSONA_LISTEN',
    sourceRef: 'COMMON',
    seedBody: '슬픔을 빨리 해결하려 하지 않고 충분히 인정한다.',
  },
  {
    id: 'HOT_LONELY_RELATION',
    priority: 90,
    match: ['외로움', '소외', '고립', '혼자'],
    situationId: 'SIT_LONELY',
    personaId: 'PERSONA_RELATION',
    t1Id: 'T1_SIT_LONELY_PERSONA_RELATION',
    sourceRef: 'COMMON',
    seedBody: '도움을 요청할 사람·공동체·공경할 관계를 확인한다.',
  },
  {
    id: 'HOT_BURNOUT_ACTION',
    priority: 90,
    match: ['봉사', '섬김', '사역', '소진', '번아웃', '피곤'],
    situationId: 'SIT_BURNOUT',
    personaId: 'PERSONA_ACTION',
    t1Id: 'T1_SIT_BURNOUT_PERSONA_ACTION',
    sourceRef: 'COMMON',
    seedBody: '오늘 내려놓을 일 하나와 요청할 도움 하나를 정한다.',
  },
].sort((a, b) => b.priority - a.priority);

export function findFrequentCounselSeed(text: string, verseRef = ''): FrequentCounselSeed | null {
  const haystack = `${text || ''} ${verseRef || ''}`.toLowerCase();
  let best: FrequentCounselSeed | null = null;
  let bestScore = 0;

  FREQUENT_COUNSEL_SEEDS.forEach((seed) => {
    const score = seed.match.reduce((sum, keyword) => sum + (haystack.includes(keyword.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore || (score === bestScore && score > 0 && seed.priority > (best?.priority || 0))) {
      best = seed;
      bestScore = score;
    }
  });

  return bestScore > 0 ? best : null;
}

export const COUNSEL_TEST_FIXTURES = [
  {
    requestId: 'B365_TEST_PROV_1_1_2_20260830_A',
    sessionKey: 'TEST|PROV1:1-2|KNOWLEDGE_WISDOM',
    question: '정보는 많이 알고 있지만 실제 선택에서는 지혜롭게 행동하지 못합니다. 말씀을 행동으로 옮기려면 오늘 무엇부터 해야 할까요?',
    verseRef: '잠언 1:1-2',
    theme: '지식 vs 지혜',
    expectedSituationId: 'SIT_CAREER',
    expectedPersonaId: 'PERSONA_ACTION',
    expectedT1Id: 'T1_SIT_CAREER_PERSONA_ACTION',
  },
  {
    requestId: 'B365_TEST_PHOTO_8LENS_20260830_3',
    sessionKey: 'TEST|PHOTO8LENS|SERVICE',
    question: '말씀은 알고 있지만 행실이 따라가지 않을 때가 많고 은사와 섬김에도 내 욕심이 섞일까 걱정됩니다. 사람을 세우는 건강한 섬김을 어떻게 시작해야 할까요?',
    verseRef: '디모데전서 4:12-16; 5:1-16',
    theme: '말씀을 삶으로 보여주는 성숙한 신앙인',
    expectedSituationId: 'SIT_BURNOUT',
    expectedPersonaId: 'PERSONA_GROWTH',
    expectedT1Id: 'T1_SIT_BURNOUT_PERSONA_GROWTH',
  },
  {
    requestId: 'B365_TEST_FAMILY_20260830_A',
    sessionKey: 'TEST|FAMILY|RELATION',
    question: '가족과 말다툼이 반복됩니다. 상대를 바꾸려고 하기 전에 내가 먼저 무엇을 행동해야 할까요?',
    verseRef: '잠언 15:1',
    theme: '가족 관계와 말의 태도',
    expectedSituationId: 'SIT_FAMILY',
    expectedPersonaId: 'PERSONA_REALITY',
    expectedT1Id: 'T1_SIT_FAMILY_PERSONA_REALITY',
  },
] as const;
