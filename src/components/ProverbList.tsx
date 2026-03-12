import { ProverbData } from '../data/proverbs';

interface ProverbListProps {
  proverbs: Record<string, ProverbData>;
  onSelectVerse: (key: string) => void;
  lang?: string;
}

export default function ProverbList({ proverbs = {}, onSelectVerse, lang = 'KO' }: ProverbListProps) {
  return (
    <div className="absolute top-16 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-lg z-40 max-h-[50vh] overflow-y-auto animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ul className="space-y-2">
          {Object.entries(proverbs)
            .filter(([_, proverb]) => proverb && proverb.title && proverb.commentary && !(typeof proverb.verse === 'string' && proverb.verse.includes('말씀입니다.')))
            .map(([key, proverb]) => {
            const tr = proverb.translations?.[lang] ?? proverb.translations?.KO ?? {};
            const m = tr.merged ?? proverb.merged;
            const displayTitle = (typeof m === 'object' ? m?.title : null) ?? tr?.devotion?.title ?? tr?.dry?.title ?? proverb.title ?? '';
            const displaySource = tr?.source ?? proverb.source ?? '';
            const displayVerse = tr?.verse ?? proverb.verse ?? '';
            const displayTheme = tr?.theme ?? proverb.theme ?? '';

            return (
              <li key={key}>
                <button
                  onClick={() => onSelectVerse(key)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm text-[#5D6D5F]">{displaySource}</p>
                    {proverb.tag && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold whitespace-nowrap">
                        #{proverb.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1 leading-relaxed mb-1">{displayTheme}</p>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{displayVerse}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
