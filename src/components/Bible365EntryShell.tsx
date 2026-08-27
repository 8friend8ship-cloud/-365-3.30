import { useEffect, useMemo, useState } from 'react';

const BOT_BASE=String(import.meta.env.VITE_BOTS_FRONT_URL||'').trim().replace(/\/+$/,'');
const LANG_TO_LOCALE:Record<string,string>={KO:'ko-KR',EN:'en-US',JP:'ja-JP',CN:'zh-CN',ES:'es-ES',DE:'de-DE',HI:'hi-IN'};

function currentLocale(){
  const lang=String(localStorage.getItem('app_lang')||'KO').toUpperCase();
  return LANG_TO_LOCALE[lang]||'ko-KR';
}

export default function Bible365EntryShell(){
  const [locale,setLocale]=useState(()=>typeof window==='undefined'?'ko-KR':currentLocale());
  useEffect(()=>{
    const timer=window.setInterval(()=>{
      const next=currentLocale();
      setLocale(prev=>prev===next?prev:next);
    },800);
    return()=>window.clearInterval(timer);
  },[]);

  const botUrl=useMemo(()=>BOT_BASE?`${BOT_BASE}/?appId=APP_BIBLE365&locale=${encodeURIComponent(locale)}&source=bible365`:'',[locale]);

  return <>
    <section aria-label="Bible365 landing" className="border-b border-[#e8ece7] bg-gradient-to-br from-[#f7f9f5] via-white to-[#eef5ef] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#5D6D5F]">BIBLE365 · DAILY WISDOM</p>
        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="serif text-3xl font-bold leading-tight text-[#33433a] md:text-4xl">오늘의 말씀을 읽고, 듣고, 기록하고, 다시 찾을 수 있는 하루 묵상 홈</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">저장된 성경·묵상 백데이터를 우선 사용하고, 언어·오디오·전달 상태를 같은 계보에서 확인합니다. 연결되지 않은 기능은 성공으로 숨기지 않습니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="#content-area" className="rounded-full bg-[#5D6D5F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a574c]">오늘 말씀 보기</a>
            {botUrl?<a href={botUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#5D6D5F] px-4 py-2 text-sm font-semibold text-[#435247] hover:bg-white">묵상 도우미</a>:<span aria-disabled="true" title="VITE_BOTS_FRONT_URL is not configured" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-400">묵상 도우미 연결 대기</span>}
          </div>
        </div>
      </div>
    </section>
  </>;
}
