import React, { useState } from 'react';
import { getAI, saveAIHistory } from '../services/aiService';
import { getUIText } from '../i18n/uiTexts';
import { Copy, Download, Check } from 'lucide-react';

interface StrategyDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8 p-6 bg-gray-50 rounded-lg">
    <h3 className="text-lg font-bold text-[#5D6D5F] border-b pb-2 mb-4">{title}</h3>
    <div className="text-sm text-gray-700 space-y-2">{children}</div>
  </div>
);

export default function StrategyDashboard({ isOpen, onClose, lang = 'KO' }: StrategyDashboardProps) {
  const t = (key: string) => getUIText(lang, key);
  if (!isOpen) return null;

  const [librarianQuery, setLibrarianQuery] = useState('');
  const [librarianResult, setLibrarianResult] = useState('');
  const [isLoadingLibrarian, setIsLoadingLibrarian] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [transformedContent, setTransformedContent] = useState('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [librarianCopied, setLibrarianCopied] = useState(false);

  const handleLibrarianSearch = async () => {
    if (!librarianQuery) return;
    setIsLoadingLibrarian(true);
    setLibrarianResult('');

    const ai = getAI();
    if (!ai) {
      setLibrarianResult("API Key가 설정되지 않았습니다. [관리자 > API Key 관리]에서 등록해주세요.");
      setIsLoadingLibrarian(false);
      return;
    }

    const prompt = `You are a 'Librarian' persona. Regarding the following keywords/consultation content, recommend 3 interesting historical, scientific, or psychological facts or anecdotes that can be used in the 'Background Expansion' stage of the 7-step writing framework. Please summarize each item concisely with its source (based on web search). Please write the answer in ${lang} language.\n\nKeywords: "${librarianQuery}"`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const text = response.text || "검색 결과가 없습니다.";
      setLibrarianResult(text);
      
      saveAIHistory({
        type: 'strategy',
        title: `${t('strategyLibrarianButton')} - ${librarianQuery}`,
        query: librarianQuery,
        response: text
      });
    } catch (error) {
      console.error("Librarian Persona API error:", error);
      setLibrarianResult("자료 검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingLibrarian(false);
    }
  };

  const handleTransform = async (platform: 'youtube' | 'newsletter' | 'instagram') => {
    if (!originalContent) {
      setTransformedContent('먼저 원본 콘텐츠를 입력해주세요.');
      return;
    }
    setIsTransforming(true);
    setTransformedContent('');

    const ai = getAI();
    if (!ai) {
      setTransformedContent("API Key가 설정되지 않았습니다. [관리자 > API Key 관리]에서 등록해주세요.");
      setIsTransforming(false);
      return;
    }

    let platformInstruction = '';
    switch (platform) {
      case 'youtube':
        platformInstruction = '유튜브 영상 스크립트 형식으로 변환해줘. 시청자의 흥미를 유발할 수 있도록 친근한 구어체를 사용하고, 각 단락에 어울리는 시각적 요소(예: 관련 이미지, 인포그래픽)를 괄호 안에 지시해줘.';
        break;
      case 'newsletter':
        platformInstruction = '독자에게 깊이 있는 정보를 제공하는 뉴스레터 형식으로 변환해줘. 전문가적인 톤을 유지하되, 명확한 소제목으로 단락을 나누어 가독성을 높여줘.';
        break;
      case 'instagram':
        platformInstruction = '인스타그램 포스트 형식으로 변환해줘. 첫 문장에서 시선을 사로잡고, 이모지를 적절히 사용하여 감성을 전달해줘. 마지막에는 관련성 높은 해시태그 3~5개를 추가해줘.';
        break;
    }

    const prompt = `Please transform the following original content into a form optimized for the '${platform}' platform. Please follow these instructions: ${platformInstruction}. Please write the answer in ${lang} language.\n\n---Original Content---\n${originalContent}`;

    try {
      const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: [{ parts: [{ text: prompt }] }] });
      const text = response.text || "변환 결과를 생성할 수 없습니다.";
      setTransformedContent(text);
      
      saveAIHistory({
        type: 'strategy',
        title: `Content Transform (${platform})`,
        query: originalContent.slice(0, 50) + '...',
        response: text
      });
    } catch (error) {
      console.error("Content transformation API error:", error);
      setTransformedContent("콘텐츠 변환 중 오류가 발생했습니다.");
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCopy = () => {
    if (!transformedContent) return;
    navigator.clipboard.writeText(transformedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLibrarianCopy = () => {
    if (!librarianResult) return;
    navigator.clipboard.writeText(librarianResult);
    setLibrarianCopied(true);
    setTimeout(() => setLibrarianCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!transformedContent) return;
    const element = document.createElement("a");
    const file = new Blob([transformedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "transformed_content.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-6 md:p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold serif text-[#5D6D5F]">{t('strategyTitle')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">{t('strategyClose')}</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 md:pr-4">
          <Section title={t('strategySection1')}>
            <p><strong>{t('strategyCoreMessage').split(':')[0]}:</strong>{t('strategyCoreMessage').split(':')[1]}</p>
            <p><strong>{t('strategyTone').split(':')[0]}:</strong>{t('strategyTone').split(':')[1]}</p>
            <p><strong>{t('strategyGoal').split(':')[0]}:</strong>{t('strategyGoal').split(':')[1]}</p>
          </Section>

          <Section title={t('strategySection2')}>
            <p>{t('strategyStep1')}</p>
            <p>{t('strategyStep2')}</p>
            <p>{t('strategyStep3')}</p>
            <p>{t('strategyStep4')}</p>
            <p>{t('strategyStep5')}</p>
            <p>{t('strategyStep6')}</p>
            <p>{t('strategyStep7')}</p>
          </Section>

          <Section title={t('strategySection3')}>
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <input 
                type="text"
                value={librarianQuery}
                onChange={(e) => setLibrarianQuery(e.target.value)}
                placeholder={t('strategyLibrarianPlaceholder')}
                className="flex-grow px-3 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D6D5F] outline-none"
              />
              <button 
                onClick={handleLibrarianSearch}
                disabled={isLoadingLibrarian}
                className="bg-[#5D6D5F] text-white px-6 py-3 rounded-md font-bold text-sm hover:bg-[#4a574c] transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
              >
                {isLoadingLibrarian ? t('strategyLibrarianSearching') : t('strategyLibrarianButton')}
              </button>
            </div>
            {librarianResult && (
              <div className="relative">
                <div className="p-4 bg-white rounded border whitespace-pre-wrap max-h-60 overflow-y-auto pr-10">{librarianResult}</div>
                <button 
                  onClick={handleLibrarianCopy} 
                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-[#5D6D5F] hover:bg-gray-100 rounded transition-colors bg-white border border-gray-200 shadow-sm"
                  title="Copy"
                >
                  {librarianCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </Section>

          <Section title={t('strategySection4')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="font-bold text-sm mb-2 block">{t('strategyOriginalLabel')}</label>
                <textarea 
                  value={originalContent}
                  onChange={(e) => setOriginalContent(e.target.value)}
                  placeholder={t('strategyOriginalPlaceholder')}
                  className="w-full h-80 p-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D6D5F] outline-none resize-none shadow-sm"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-sm block">{t('strategyResultLabel')}</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy} 
                      className="p-1.5 text-gray-500 hover:text-[#5D6D5F] hover:bg-gray-100 rounded transition-colors" 
                      title="Copy"
                    >
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    </button>
                    <button 
                      onClick={handleDownload} 
                      className="p-1.5 text-gray-500 hover:text-[#5D6D5F] hover:bg-gray-100 rounded transition-colors" 
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <div className="w-full h-80 p-4 text-sm bg-white rounded-lg border border-gray-200 whitespace-pre-wrap overflow-y-auto shadow-sm">
                  {transformedContent || <span className="text-gray-400 italic">{t('strategyResultPlaceholder')}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button 
                onClick={() => handleTransform('youtube')} 
                disabled={isTransforming}
                className="bg-red-600 text-white px-5 py-2.5 text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {t('strategyYoutube')}
              </button>
              <button 
                onClick={() => handleTransform('newsletter')} 
                disabled={isTransforming}
                className="bg-blue-600 text-white px-5 py-2.5 text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {t('strategyNewsletter')}
              </button>
              <button 
                onClick={() => handleTransform('instagram')} 
                disabled={isTransforming}
                className="bg-purple-600 text-white px-5 py-2.5 text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {t('strategyInstagram')}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
