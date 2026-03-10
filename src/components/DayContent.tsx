import { RadarChart, BarChart } from './Charts';
import { ProverbData } from '../data/proverbs';
import { getUIText } from '../i18n/uiTexts';
import { useMemo } from 'react';

interface DayContentProps {
  data: ProverbData | null;
  lang?: string;
}

interface SimulationProps {
  lang?: string;
}

const MountaineerSimulation = ({ lang = 'KO' }: SimulationProps) => {
  const t = (key: string) => getUIText(lang, key);
  
  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold serif text-center mb-8">{t('simTitle')}</h2>
      <div className="flex flex-col md:flex-row justify-center items-start gap-8">
        <div className="w-full md:w-1/3">
          <div className="flow-node bg-gray-800 text-white">{t('simSnow')}</div>
          <div className="flow-line"></div>
          <div className="flex justify-between items-start">
            <div className="w-5/12">
              <div className="flow-node bg-[#5D6D5F] text-white text-xs">{t('simLeaderPath')}</div>
              <div className="flow-line"></div>
              <div className="flow-node bg-green-100 text-green-800 font-bold border-2 border-green-500">{t('simSurvival')}</div>
            </div>
            <div className="w-5/12">
              <div className="flow-node bg-[#B07D62] text-white text-xs">{t('simMemberPath')}</div>
              <div className="flow-line"></div>
              <div className="flow-node bg-red-100 text-red-800 font-bold border-2 border-red-500">{t('simDeath')}</div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-2/3 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-500 mb-6">{t('simAnalysis')}</h3>
          <BarChart lang={lang} />
        </div>
      </div>
    </div>
  );
};

export default function DayContent({ data, lang = 'KO' }: DayContentProps) {
  const t = (key: string) => getUIText(lang, key);

  const displayTitle = useMemo(() => {
    if (!data) return '';
    const tr = data.translations?.[lang] ?? data.translations?.KO ?? {};
    // ✅ merged 우선 사용
    const m = tr.merged;
    if (typeof m === 'string') return tr.devotion?.title || tr.dry?.title || data.title || '';
    if (m?.title) return m.title;
    
    // Legacy fallback
    const devTitle = tr?.devotion?.title ?? '';
    const dryTitle = tr?.dry?.title ?? '';
    return devTitle || dryTitle || data.title || '';
  }, [data, lang]);

  const displayBody = useMemo(() => {
    if (!data) return '';
    const tr = data.translations?.[lang] ?? data.translations?.KO ?? {};
    // ✅ merged 우선 사용
    const m = tr.merged;
    if (typeof m === 'string') return m;
    if (m?.body) return m.body;

    // Legacy fallback
    const devBody = tr?.devotion?.body ?? '';
    const dryBody = tr?.dry?.body ?? '';
    return devBody || dryBody || data.commentary || '';
  }, [data, lang]);

  const displayVerse = useMemo(() => {
    if (!data) return '';
    const tr = data.translations?.[lang] ?? data.translations?.KO ?? {};
    // @ts-ignore
    return tr.verse ?? data.verse ?? '';
  }, [data, lang]);

  const displaySource = useMemo(() => {
    if (!data) return '';
    const tr = data.translations?.[lang] ?? data.translations?.KO ?? {};
    // @ts-ignore
    return tr.source ?? data.source ?? '';
  }, [data, lang]);

  const displayTheme = useMemo(() => {
    if (!data) return '';
    const tr = data.translations?.[lang] ?? data.translations?.KO ?? {};
    // @ts-ignore
    return tr.theme ?? data.theme ?? '';
  }, [data, lang]);

  const displayApplication = useMemo(() => {
    if (!data) return '';
    const tr = data.translations?.[lang] ?? data.translations?.KO ?? {};
    // @ts-ignore
    return tr.application ?? data.application ?? '';
  }, [data, lang]);

  if (!data) {
    return (
      <div className="text-center py-16 fade-in">
        <h2 className="text-2xl font-bold serif text-gray-500">{t('searchGuide')}</h2>
        <p className="text-gray-400 mt-2">예: 1:1-2 또는 1:3</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-16">
        <span style={{color: data.accentColor}} className="font-bold tracking-[0.2em] text-sm uppercase">{data.tag}</span>
        <h1 className="text-4xl md:text-5xl font-bold serif mt-4 text-[#5D6D5F]">{displayTitle}</h1>
        <div style={{borderColor: data.accentColor}} className="mt-8 max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border-l-8">
          <p className="text-lg md:text-xl italic text-gray-700 serif leading-relaxed">
            "{displayVerse}"
          </p>
          <p className="mt-4 font-bold text-gray-500">{displaySource}</p>
        </div>
      </div>

      {data.audio?.[lang] ? (
        <div className="flex justify-center mb-12">
          <audio 
            controls 
            src={data.audio[lang]} 
            key={data.audio[lang]} 
            className="w-full max-w-md" 
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : (
        <div className="flex justify-center mb-12">
          <div className="px-6 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm italic">
            {t('audioNotAvailable') || 'Audio not available for this language'}
          </div>
        </div>
      )}

      {data.simulation === 'mountaineer' ? (
        <MountaineerSimulation lang={lang} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold serif border-b-2 border-[#5D6D5F]/20 pb-2">{t('theme')}: {displayTheme}</h2>
            <p className="text-gray-600 leading-relaxed">
              {displayBody}
            </p>
            {displayApplication && (
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h4 className="font-bold mb-2">{t('todayApply')}</h4>
                <p className="text-sm text-gray-500">{displayApplication}</p>
              </div>
            )}
          </div>
          <div className="card p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
            <h3 className="text-center font-bold text-gray-500 mb-4">{t('radarAnalysis')}</h3>
            <RadarChart lang={lang} seed={displayVerse} />
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center max-w-2xl mx-auto">
        <p className="text-gray-600 italic">
          {data.simulation === 'mountaineer' ? displayBody : ''}
        </p>
      </div>
    </div>
  );
}
