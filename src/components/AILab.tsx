import { useMemo, useState } from 'react';
import { BookOpen, Lightbulb, MessageCircle, X } from 'lucide-react';
import { ProverbData } from '../data/proverbs';
import { saveAIHistory } from '../services/aiService';
import { requestBible365Counsel } from '../services/counselingService';

interface AILabProps {
  verseData: ProverbData | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

const normalize = (value: unknown) => String(value || '').trim();

export default function AILab({ verseData, isOpen, onClose, lang = 'KO' }: AILabProps) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isCounselLoading, setIsCounselLoading] = useState(false);
  const [counselMeta, setCounselMeta] = useState('');

  const localized = useMemo(() => {
    if (!verseData) return null;
    const tr = verseData.translations?.[lang] || verseData.translations?.KO || null;
    return {
      title: normalize(tr?.merged?.title || tr?.devotion?.title || verseData.title),
      body: normalize(tr?.merged?.body || tr?.devotion?.body || verseData.commentary),
      verse: normalize(tr?.verse || verseData.verse),
      source: normalize(tr?.source || verseData.reference),
      theme: normalize(tr?.theme || verseData.theme),
      application: normalize(tr?.application || verseData.application),
    };
  }, [verseData, lang]);

  if (!isOpen || !verseData || !localized) return null;

  const buildCounsel = async () => {
    const q = query.trim();
    if (!q) {
      setAnswer('지금 고민이나 상황을 한 문장 이상 적어주세요.');
      return;
    }

    setIsCounselLoading(true);
    setCounselMeta('');
    try {
      const pack = await requestBible365Counsel({
        question: q,
        verseRef: localized.source,
        verseText: localized.verse,
        theme: localized.theme,
        application: localized.application,
        audience: '본인',
        lang,
        sessionKey: `${lang}|${localized.source}|${q.slice(0, 80)}`,
      });

      const persona = pack.personalization?.personaName || '상황 맞춤형';
      const situation = pack.personalization?.situationName || '현재 고민';
      const response = [
        '글·상담',
        `상황: ${situation}`,
        `페르소나: ${persona}`,
        '',
        `말씀: ${pack.scripture?.ref || localized.source}`,
        pack.scripture?.text || localized.verse,
        '',
        `현재 질문: ${q}`,
        '',
        pack.draftSeed || localized.body,
        '',
        '오늘의 점검',
        '1. 지금 멈출 것은 무엇인가?',
        '2. 지금 시작할 것은 무엇인가?',
        '3. 계속 유지할 것은 무엇인가?',
        '4. 24시간 안에 할 수 있는 한 가지 행동은 무엇인가?',
        '',
        '※ 특정 목회자를 상담자 페르소나로 사용하지 않습니다. 본문 문맥과 저장된 Bible365/DryWriter 템플릿을 우선합니다.'
      ].filter(Boolean).join('\n');

      setAnswer(response);
      setCounselMeta(`${pack.status || 'READY'} · ${pack.templateId || 'DRYWRITER_BIBLE_COUNSEL_V1_20260830'}`);
      saveAIHistory({
        type: 'counseling',
        title: `Bible365 글·상담 - ${localized.source} - ${persona}`,
        query: q,
        response,
        verseRef: localized.source
      });
    } catch (error) {
      setAnswer(`상담 패키지를 준비하지 못했습니다. ${String(error)}`);
    } finally {
      setIsCounselLoading(false);
    }
  };

  const buildInsight = () => {
    const response = [
      `제목: ${localized.title}`,
      `본문: ${localized.verse}`,
      `주제: ${localized.theme}`,
      '',
      localized.body,
      '',
      `실행 질문: ${localized.application}`,
      '',
      '외부 검색이나 브라우저 생성형 API를 직접 호출하지 않았습니다.'
    ].join('\n');
    setAnswer(response);
    setCounselMeta('저장 백데이터 요약');
    saveAIHistory({
      type: 'insight',
      title: `Bible365 Backdata Insight - ${localized.source}`,
      query: localized.theme,
      response,
      verseRef: localized.source
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bible365 글·상담</h2>
            <p className="text-sm text-slate-500">상황 → Queens → Seed → DryWriter T1 Storyboard → T2 개인화 랜덤 → Front</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="닫기"><X size={20} /></button>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-amber-900"><BookOpen size={18} />{localized.title}</div>
            <p className="mt-2 text-sm font-medium text-amber-900">{localized.source}</p>
            <p className="mt-2 whitespace-pre-line text-slate-800">{localized.verse}</p>
          </section>

          <section className="rounded-xl border p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900"><Lightbulb size={18} />저장된 해설·적용</div>
            <p className="mt-3 whitespace-pre-line text-slate-700">{localized.body}</p>
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{localized.application}</p>
          </section>

          <section className="rounded-xl border p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900"><MessageCircle size={18} />내 상황으로 글·상담 만들기</div>
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={4} className="mt-3 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-600" placeholder="지금 고민이나 상황을 적으세요. 상황·문제에 맞는 Seed와 페르소나가 자동 선택됩니다." />
            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={isCounselLoading} onClick={buildCounsel} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isCounselLoading ? '상담 패키지 준비 중...' : '글·상담 만들기'}</button>
              <button onClick={buildInsight} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">오늘 말씀 요약</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">특정 목회자 이름을 상담자 이름으로 사용하지 않으며, 검증된 본문 문맥과 저장 Seed를 우선합니다.</p>
          </section>

          {counselMeta && <p className="text-xs text-slate-500">{counselMeta}</p>}
          {answer && <pre className="whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">{answer}</pre>}
        </div>
      </div>
    </div>
  );
}
