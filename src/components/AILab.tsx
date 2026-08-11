import { useState } from 'react';
import { ProverbData } from '../data/proverbs';
import { getUIText } from '../i18n/uiTexts';
import { Download, FileText, Image as ImageIcon, Music } from 'lucide-react';
import DialogModal from './DialogModal';

interface AILabProps {
  verseData: ProverbData | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

export default function AILab({ verseData, isOpen, onClose, lang = 'KO' }: AILabProps) {
  const t = (key: string) => getUIText(lang, key);
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<{ uri: string; title: string }[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [loadingGuru, setLoadingGuru] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingArt, setLoadingArt] = useState(false);
  const [loadingTTS, setLoadingTTS] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => {},
  });

  const showAlert = (message: string, title = '알림') => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => setDialogConfig(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = '확인') => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        setDialogConfig(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setDialogConfig(prev => ({ ...prev, isOpen: false })),
    });
  };

  if (!isOpen || !verseData) return null;

  const blockDirectBrowserAI = (feature: string) => {
    // DIRECT_BROWSER_AI_DISABLED: route AI work through the audited central Writer/Media backend.
    setAiResponse(`${feature} 기능은 안전한 중앙 Writer/Media 연결이 완료될 때까지 실행하지 않습니다.`);
    setGroundingLinks([]);
    setGeneratedImage(null);
    setLoadingGuru(false);
    setLoadingInsight(false);
    setLoadingArt(false);
    setLoadingTTS(false);
  };

  const askAIGuru = async () => {
    if (!query || !verseData) return;
    blockDirectBrowserAI('AI 지혜 상담');
  };

  const searchDeepInsight = async () => {
    if (!verseData) return;
    blockDirectBrowserAI('성경 원어·역사 탐색');
  };

  const generateWordArt = async () => {
    if (!verseData) return;
    blockDirectBrowserAI('말씀 이미지 생성');
  };

  const speakResponse = async () => {
    if (!aiResponse) return;
    blockDirectBrowserAI('말씀 음성 생성');
  };

  const playPCM = (base64: string) => {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for(let i=0; i<binary.length; i++) array[i] = binary.charCodeAt(i);
    
    const wav = createWav(array.buffer, 24000);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    return url;
  };

  const createWav = (pcmBuffer: ArrayBuffer, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + pcmBuffer.byteLength);
    const view = new DataView(buffer);
    const writeString = (offset: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmBuffer.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmBuffer.byteLength, true);
    new Uint8Array(buffer, 44).set(new Uint8Array(pcmBuffer));
    return buffer;
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  const downloadImage = () => {
    if (!generatedImage || !verseData) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `verse-art-${verseData.reference}.png`;
    a.click();
  };

  return (
    <section id="ai-lab" className="mt-16">
      <div className="ai-glass rounded-3xl p-8 shadow-2xl border-2 border-[#5D6D5F]/10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold serif text-[#5D6D5F] flex items-center">
            <span className="mr-3">✨</span> {t('aiLabTitle')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{t('aiLabClose')}</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature 1: AI Counseling */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">💬</span> ✨ {t('aiLabMentorTitle')}
            </h3>
            <p className="text-xs text-gray-500 mb-4">{t('aiLabMentorDesc')}</p>
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-3 text-sm border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5D6D5F] outline-none h-24 mb-4" 
              placeholder={t('aiLabMentorPlaceholder')}
            />
            <button 
              onClick={askAIGuru} 
              disabled={loadingGuru}
              className="w-full bg-[#5D6D5F] text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex justify-center items-center disabled:opacity-50"
            >
              <span>{t('aiLabMentorButton')}</span>
              {loadingGuru && <div className="loader ml-2"></div>}
            </button>
          </div>

          {/* Feature 2: Insight Search */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">🔍</span> ✨ {t('aiLabInsightTitle')}
            </h3>
            <p className="text-xs text-gray-500 mb-4">{t('aiLabInsightDesc')}</p>
            <div className="text-xs text-gray-600 h-32 overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg italic">
              {t('aiLabInsightPlaceholder')}
            </div>
            <button 
              onClick={searchDeepInsight}
              disabled={loadingInsight}
              className="w-full border-2 border-[#5D6D5F] text-[#5D6D5F] py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex justify-center items-center disabled:opacity-50"
            >
              <span>{t('aiLabInsightButton')}</span>
              {loadingInsight && <div className="loader ml-2"></div>}
            </button>
          </div>

          {/* Feature 3: Word Art Gen */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">🎨</span> ✨ {t('aiLabArtTitle')}
            </h3>
            <p className="text-xs text-gray-500 mb-4">{t('aiLabArtDesc')}</p>
            <div className="w-full max-w-4xl mx-auto bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden min-h-[200px] max-h-[500px] shadow-inner">
              {generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={generatedImage} 
                    className="w-full h-full object-contain" 
                    alt="Generated Verse Art" 
                  />
                  <button 
                    onClick={downloadImage}
                    className="absolute bottom-4 right-4 p-2.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all shadow-lg backdrop-blur-sm"
                    title="Download Image"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center w-full">
                  <span className="text-xs text-gray-400">{t('aiLabArtPlaceholder')}</span>
                </div>
              )}
            </div>
            <button 
              onClick={generateWordArt}
              disabled={loadingArt}
              className="w-full bg-[#D4A373] text-white py-3 rounded-xl font-bold text-sm mt-4 hover:shadow-lg transition-all flex justify-center items-center disabled:opacity-50"
            >
              <span>{t('aiLabArtButton')}</span>
              {loadingArt && <div className="loader ml-2"></div>}
            </button>
          </div>
        </div>

        {/* Response Area */}
        {aiResponse && (
          <div className="mt-8 bg-white/50 p-6 rounded-2xl border-l-4 border-[#5D6D5F] fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5D6D5F]">{t('aiLabResultTitle')}</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (!verseData) return;
                    const content = `[AI Counseling Script]
Date: ${new Date().toLocaleString()}
Reference: ${verseData.reference}
Partner: ${verseData.partner || 'N/A'}
Category: ${verseData.categoryCode || 'N/A'}
Verse Text: ${verseData.verse}

--------------------------------------------------

${aiResponse}`;
                    downloadFile(content, `ai-script-${verseData.reference}.txt`, 'text/plain');
                  }}
                  className="text-xs flex items-center text-gray-500 hover:text-[#5D6D5F] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  {t('downloadScript')}
                </button>
                <button onClick={speakResponse} disabled={loadingTTS} className="text-xs flex items-center text-gray-500 hover:text-gray-800 disabled:opacity-50">
                  <span className="mr-1">🔊</span> ✨ {t('aiLabSpeakButton')}
                  {loadingTTS && <div className="loader ml-2"></div>}
                </button>
                {lastAudioUrl && (
                  <button 
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = lastAudioUrl;
                      a.download = `ai-audio-${verseData.reference}.wav`;
                      a.click();
                    }}
                    className="text-xs flex items-center text-gray-500 hover:text-[#5D6D5F] transition-colors"
                  >
                    <Music className="w-3.5 h-3.5 mr-1" />
                    음성 다운로드
                  </button>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
            {groundingLinks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {groundingLinks.map((link, idx) => (
                  <a key={idx} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-all">
                    🔗 {link.title || '출처'}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <DialogModal
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
      />
    </section>
  );
}
