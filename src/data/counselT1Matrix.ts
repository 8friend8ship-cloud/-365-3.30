export type CounselT1Seed = {
  t1Id: string;
  situationId: string;
  situationName: string;
  personaId: string;
  personaName: string;
  storyboard: string;
  seedBody: string;
  templateId: 'DRYWRITER_BIBLE_COUNSEL_V1_20260830';
};

const STORYBOARD = '상황→본문문맥→8렌즈2~4개→관계→24시간행동→질문';
const TEMPLATE_ID = 'DRYWRITER_BIBLE_COUNSEL_V1_20260830' as const;

const PERSONAS = [
  ['PERSONA_LISTEN', '경청형'],
  ['PERSONA_REALITY', '현실점검형'],
  ['PERSONA_RELATION', '관계회복형'],
  ['PERSONA_ACTION', '실천동행형'],
  ['PERSONA_GROWTH', '배움성장형'],
] as const;

const SITUATIONS = [
  {
    id: 'SIT_ANXIETY', name: '불안_걱정', bodies: [
      '불안과 걱정을 사실과 감정으로 나누고 말씀 문맥을 확인한 뒤 오늘 가능한 한 가지 행동으로 연결',
      '불안의 사실·감정·선택·책임을 구분하고 통제 가능한 행동만 남김',
      '불안 속에서 도움을 요청할 사람과 공경·관계 회복의 범위를 점검',
      '걱정을 반복하기보다 24시간 안에 할 수 있는 한 가지 행동을 정함',
      '인내와 일관성을 성장의 증거로 보고 지·정·의를 연결',
    ]
  },
  {
    id: 'SIT_FAMILY', name: '가족_관계갈등', bodies: [
      '가족 갈등에서 먼저 사실과 상처를 구분하고 상대를 정죄하지 않음',
      '내 책임과 상대 책임을 구분하고 요구보다 내가 먼저 행동할 부분을 점검',
      '도움·공경·화해와 건강한 경계를 함께 점검',
      '오늘 한 문장 사과·감사·경청 중 하나를 실행하도록 구조화',
      '관계의 일관성과 인내를 장기적 변화의 지표로 삼음',
    ]
  },
  {
    id: 'SIT_CAREER', name: '직장_진로_결정', bodies: [
      '결정을 재촉하지 않고 두려움·욕심·책임을 분리해 들음',
      '말씀과 현실 조건을 분리해 확인하고 사적 욕심을 결정의 근거로 두지 않음',
      '결정이 가족·동료·공동체 관계에 미치는 영향을 함께 살핌',
      '오늘 확인할 정보·상담할 사람·보류할 결정을 하나씩 정함',
      '결정 결과보다 과정에서의 순종·인내·배움을 점검',
    ]
  },
  {
    id: 'SIT_FINANCE', name: '경제_재정압박', bodies: [
      '재정 압박에서 수치심과 실제 숫자를 분리해 다룸',
      '수입·지출·부채·책임을 사실대로 확인하고 영적 단정으로 회피하지 않음',
      '가족과의 재정 대화·도움 요청·책임 분담을 점검',
      '오늘 확인할 지출 하나와 줄일 지출 하나를 정하는 식으로 작게 실행',
      '일관된 관리와 인내를 장기 성장으로 연결',
    ]
  },
  {
    id: 'SIT_GUILT', name: '실패_죄책감', bodies: [
      '실패와 자기정죄를 구분하고 사실을 과장하지 않음',
      '고칠 책임·받아들일 한계·다시 선택할 부분을 구분',
      '필요한 사과·회복·도움 요청을 구체화',
      '24시간 안에 고칠 수 있는 한 가지를 실행',
      '실패 이후의 인내·배움·일관성을 진보의 증거로 봄',
    ]
  },
  {
    id: 'SIT_GRIEF', name: '상실_슬픔', bodies: [
      '슬픔을 빨리 해결하려 하지 않고 충분히 인정함',
      '바꿀 수 없는 상실과 오늘 돌볼 수 있는 생활을 구분',
      '혼자 견디지 않고 도움을 받을 사람과 연결',
      '식사·수면·연락 등 오늘의 최소 행동 한 가지를 정함',
      '슬픔을 성급히 의미화하지 않고 인내와 배움의 시간을 존중',
    ]
  },
  {
    id: 'SIT_LONELY', name: '외로움_소외', bodies: [
      '외로움을 약함으로 정죄하지 않고 현재 연결 상태를 살핌',
      '실제 고립과 느끼는 외로움을 구분하고 가능한 접점을 찾음',
      '도움을 요청할 사람·공동체·공경할 관계를 확인',
      '오늘 한 사람에게 먼저 연락하는 행동으로 연결',
      '관계 형성의 일관성과 배움을 성장의 지표로 삼음',
    ]
  },
  {
    id: 'SIT_BURNOUT', name: '봉사_소진', bodies: [
      '섬김 피로를 믿음 부족으로 단정하지 않고 현재 소진을 인정',
      '은사 사용과 사적 욕심·책임 과다·휴식 부족을 분리해 점검',
      '도움을 나누고 공경과 건강한 경계가 함께 있는 섬김을 점검',
      '오늘 내려놓을 일 하나와 요청할 도움 하나를 정함',
      '건강한 섬김은 가르치고 배우는 순환과 지속 가능성을 포함한다고 점검',
    ]
  },
] as const;

export const T1_SEED_MATRIX: CounselT1Seed[] = SITUATIONS.flatMap((situation) =>
  PERSONAS.map(([personaId, personaName], index) => ({
    t1Id: `T1_${situation.id}_${personaId}`,
    situationId: situation.id,
    situationName: situation.name,
    personaId,
    personaName,
    storyboard: STORYBOARD,
    seedBody: situation.bodies[index],
    templateId: TEMPLATE_ID,
  }))
);

export function findT1Seed(situationId: string, personaId: string): CounselT1Seed | null {
  return T1_SEED_MATRIX.find((seed) => seed.situationId === situationId && seed.personaId === personaId) || null;
}
