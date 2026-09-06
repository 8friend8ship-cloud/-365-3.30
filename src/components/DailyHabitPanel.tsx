import { useMemo, useState } from 'react';
import type { ProverbData } from '../data/proverbs';

type Props = {
  data: ProverbData | null;
  onOpenArchive: () => void;
};

const dayKey = () => new Date().toLocaleDateString('sv-SE');
const readJson = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
};
const writeJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export default function DailyHabitPanel({ data, onOpenArchive }: Props) {
  const contentId = data?.id || data?.reference || 'today';
  const [completed, setCompleted] = useState<string[]>(() => readJson('b365_completed_days', []));
  const [bookmarks, setBookmarks] = useState<string[]>(() => readJson('b365_bookmarks', []));
  const [reflection, setReflection] = useState(() => localStorage.getItem(`b365_reflection:${contentId}`) || '');
  const today = dayKey();
  const doneToday = completed.includes(today);
  const bookmarked = bookmarks.includes(contentId);

  const streak = useMemo(() => {
    const set = new Set(completed);
    let count = 0;
    const d = new Date();
    if (!set.has(today)) d.setDate(d.getDate() - 1);
    while (set.has(d.toLocaleDateString('sv-SE'))) { count += 1; d.setDate(d.getDate() - 1); }
    return count;
  }, [completed, today]);
  const toggleComplete = () => {
    const next = doneToday ? completed.filter(d => d !== today) : [...new Set([...completed, today])];
    setCompleted(next); writeJson('b365_completed_days', next);
  };
  const toggleBookmark = () => {
    const next = bookmarked ? bookmarks.filter(id => id !== contentId) : [...new Set([...bookmarks, contentId])];
    setBookmarks(next); writeJson('b365_bookmarks', next);
  };
  const saveReflection = (value: string) => {
    setReflection(value); localStorage.setItem(`b365_reflection:${contentId}`, value);
  };
  const share = async () => {
    if (!data) return;
    const text = `${data.title || '오늘의 말씀'}\n${data.reference || ''}\n${data.verse || ''}`;
    if (navigator.share) await navigator.share({ title: data.title || 'Bible365', text });
    else await navigator.clipboard.writeText(text);
  };

  return <section aria-label="오늘의 묵상 습관" className="rounded-2xl border border-[#e4e9e4] bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold text-[#5D6D5F]">오늘의 습관</p><p className="mt-1 text-sm text-gray-600">연속 {streak}일 · 기록은 이 기기에만 저장됩니다.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={toggleComplete} className="rounded-full border px-3 py-2 text-sm">{doneToday ? '✓ 오늘 완료' : '오늘 완료하기'}</button>
        <button onClick={toggleBookmark} className="rounded-full border px-3 py-2 text-sm">{bookmarked ? '★ 저장됨' : '☆ 북마크'}</button>
        <button onClick={share} className="rounded-full border px-3 py-2 text-sm">공유</button>
        <button onClick={onOpenArchive} className="rounded-full border px-3 py-2 text-sm">최근 말씀</button>
      </div>
    </div>
    <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="b365-reflection">오늘의 메모</label>
    <textarea
      id="b365-reflection"
      value={reflection}
      onChange={e => saveReflection(e.target.value)}
      placeholder="오늘 마음에 남은 한 문장이나 실천을 적어보세요."
      className="mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#5D6D5F]"
    />
    <p className="mt-2 text-xs text-gray-400">메모 내용은 분석 서버로 전송하지 않습니다.</p>
  </section>;
}
