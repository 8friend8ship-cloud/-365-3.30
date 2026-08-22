import { useMemo, useState } from 'react';
import { BookOpen, Lightbulb, MessageCircle, X } from 'lucide-react';
import { ProverbData } from '../data/proverbs';
import { saveAIHistory } from '../services/aiService';

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

  const buildCounsel = () => {
    const q = query.trim();
    const response = [
      `말씀: ${localized.source}`,
      localized.verse,
      '',
      `핵심 주제: ${localized.theme}`,
      localized.body,
      '',
      q ? `현재 질문: ${q}` : '',
      `오늘 적용: ${localized.application}`,
      '',
      '이 답변은 저장된 Bible365 말씀·해설·적용 백데이터만 재조합했습니다.'
    ].filter(Boolean).join('\n');
    setAnswer(response);
    saveAIHistory({
      type: 'counseling',
      title: `Bible365 Backdata Counsel - ${localized.source}`,
      query: q,
      response,
      verseRef: localized.source
    });
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
      '외부 검색이나 생성형 API는 호출하지 않았습니다.'
    ].join('\n');
    setAnswer(response);
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
            <h2 className="text-xl font-bold text-slate-900">Bible365 백데이터 연구실</h2>
            <p className="text-sm text-slate-500">Queens → Seed → T1 → T2 저장 결과 우선 / 브라우저 생성형 API 0회</p>
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
            <div className="flex items-center gap-2 font-semibold text-slate-900"><MessageCircle size={18} />내 상황과 연결</div>
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={4} className="mt-3 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-slate-600" placeholder="지금 고민이나 상황을 적으세요." />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={buildCounsel} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">말씀과 연결</button>
              <button onClick={buildInsight} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">오늘 말씀 요약</button>
            </div>
          </section>

          {answer && <pre className="whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">{answer}</pre>}
        </div>
      </div>
    </div>
  );
}
