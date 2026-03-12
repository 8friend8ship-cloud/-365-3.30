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
    
    // 1. Try selected language translation
    const tr = data.translations?.[lang];
    if (tr) {
      if (tr.merged && typeof tr.merged !== 'string' && tr.merged.title) {
        console.log(`[DayContent:displayTitle] lang=${lang}, usedField=translations.${lang}.merged.title`);
        return tr.merged.title;
      }
      if (tr.devotion?.title) {
        console.log(`[DayContent:displayTitle] lang=${lang}, usedField=translations.${lang}.devotion.title`);
        return tr.devotion.title;
      }
      if (tr.dry?.title) {
        console.log(`[DayContent:displayTitle] lang=${lang}, usedField=translations.${lang}.dry.title`);
        return tr.dry.title;
      }
    }

    // 2. Fallback to KO translation
    const koTr = data.translations?.KO;
    if (koTr) {
      if (koTr.merged && typeof koTr.merged !== 'string' && koTr.merged.title) {
        console.log(`[DayContent:displayTitle] lang=${lang} (fallback to KO), usedField=translations.KO.merged.title`);
        return koTr.merged.title;
      }
      if (koTr.devotion?.title) {
        console.log(`[DayContent:displayTitle] lang=${lang} (fallback to KO), usedField=translations.KO.devotion.title`);
        return koTr.devotion.title;
      }
      if (koTr.dry?.title) {
        console.log(`[DayContent:displayTitle] lang=${lang} (fallback to KO), usedField=translations.KO.dry.title`);
        return koTr.dry.title;
      }
    }

    // 3. Fallback to root fields
    const rootM = data.merged;
    if (rootM && typeof rootM !== 'string' && rootM.title) {
      console.log(`[DayContent:displayTitle] lang=${lang} (fallback to root), usedField=root.merged.title`);
      return rootM.title;
    }
    if (data.title) {
      console.log(`[DayContent:displayTitle] lang=${lang} (fallback to root), usedField=root.title`);
      return data.title;
    }

    console.log(`[DayContent:displayTitle] lang=${lang}, usedField=none (empty)`);
    return '';
  }, [data, lang]);

  const displayBody = useMemo(() => {
    if (!data) return '';
    
    // 1. Try selected language translation
    const tr = data.translations?.[lang];
    if (tr) {
      if (tr.merged) {
        if (typeof tr.merged === 'string') {
          console.log(`[DayContent:displayBody] lang=${lang}, usedField=translations.${lang}.merged (string)`);
          return tr.merged;
        }
        if (tr.merged.body) {
          console.log(`[DayContent:displayBody] lang=${lang}, usedField=translations.${lang}.merged.body`);
          return tr.merged.body;
        }
      }
      if (tr.devotion?.body) {
        console.log(`[DayContent:displayBody] lang=${lang}, usedField=translations.${lang}.devotion.body`);
        return tr.devotion.body;
      }
      if (tr.dry?.body) {
        console.log(`[DayContent:displayBody] lang=${lang}, usedField=translations.${lang}.dry.body`);
        return tr.dry.body;
      }
    }

    // 2. Fallback to KO translation
    const koTr = data.translations?.KO;
    if (koTr) {
      if (koTr.merged) {
        if (typeof koTr.merged === 'string') {
          console.log(`[DayContent:displayBody] lang=${lang} (fallback to KO), usedField=translations.KO.merged (string)`);
          return koTr.merged;
        }
        if (koTr.merged.body) {
          console.log(`[DayContent:displayBody] lang=${lang} (fallback to KO), usedField=translations.KO.merged.body`);
          return koTr.merged.body;
        }
      }
      if (koTr.devotion?.body) {
        console.log(`[DayContent:displayBody] lang=${lang} (fallback to KO), usedField=translations.KO.devotion.body`);
        return koTr.devotion.body;
      }
      if (koTr.dry?.body) {
        console.log(`[DayContent:displayBody] lang=${lang} (fallback to KO), usedField=translations.KO.dry.body`);
        return koTr.dry.body;
      }
    }

    // 3. Fallback to root fields
    const rootM = data.merged;
    if (rootM) {
      if (typeof rootM === 'string') {
        console.log(`[DayContent:displayBody] lang=${lang} (fallback to root), usedField=root.merged (string)`);
        return rootM;
      }
      if (rootM.body) {
        console.log(`[DayContent:displayBody] lang=${lang} (fallback to root), usedField=root.merged.body`);
        return rootM.body;
      }
    }
    if (data.commentary) {
      console.log(`[DayContent:displayBody] lang=${lang} (fallback to root), usedField=root.commentary`);
      return data.commentary;
    }

    console.log(`[DayContent:displayBody] lang=${lang}, usedField=none (empty)`);
    return '';
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
