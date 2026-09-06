export default async function handler(req, res) {
  res.statusCode = 503;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({
    success: false,
    error: 'COUNSEL_SERVER_RUNTIME_NOT_BOUND',
    fallback: 'LOCAL_QUALIFIED_T1_SEED',
    note: '개인 질문은 현재 서버에 저장하지 않고 검증된 로컬 T1 Seed fallback을 사용합니다.'
  }));
}
