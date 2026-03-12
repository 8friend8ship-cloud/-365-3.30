import { AudioPlayer } from './AudioPlayer';
import React, { useState, useEffect } from 'react';
import type { ProverbData } from '../data/proverbs';
import { historicalEvents } from '../data/historicalEvents';
import EditProverbModal from './EditProverbModal';
import KeyManagementModal from './KeyManagementModal';
import DialogModal from './DialogModal';
import { getUIText } from '../i18n/uiTexts';
import { Shield, Key, History, Trash2, Download, Image as ImageIcon, Music, ChevronDown, ChevronUp, MessageCircle, Search, Sparkles, RefreshCw } from 'lucide-react';
import { getAI, getAIHistory, clearAIHistory, deleteAIHistoryItem } from '../services/aiService';
import { fetchProverbsFromSheet } from '../services/sheetService';
import { AIHistoryItem, DailyPack } from '../types';
import { Type } from '@google/genai';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  proverbs: Record<string, ProverbData>;
  setProverbs: React.Dispatch<React.SetStateAction<Record<string, ProverbData>>>;
  lang?: string;
  enginePack?: DailyPack | null;
  onRefreshEngine?: () => void;
  isLoadingEngine?: boolean;
  deliveryEngineUrl: string;
}

export default function AdminDashboard({ isOpen, onClose, proverbs = {}, setProverbs, lang = 'KO', enginePack, onRefreshEngine, isLoadingEngine = false, deliveryEngineUrl }: AdminDashboardProps) {
  const t = (key: string) => getUIText(lang, key);
  
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleFetchAndCombineAudio = async () => {
    setIsFetchingAudio(true);
    setFetchError(null);
    try {
      const url = new URL(deliveryEngineUrl);
      url.searchParams.set("type", "today");
      url.searchParams.set("token", "bible2026secret");
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.success && (data.items || data.payload?.items)) {
        const items = data.items || data.payload?.items;
        console.log("Items to process:", items);
        setItems(items);
        showAlert(`${items.length}개의 오디오 데이터를 가져왔습니다.`);
      } else {
        const errorMessage = data.message || JSON.stringify(data);
        setFetchError(`API Error: ${errorMessage}`);
        showAlert("오디오 데이터를 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setFetchError(`Fetch Error: ${errorMessage}`);
      showAlert("오디오 가져오기 중 오류가 발생했습니다.");
    } finally {
      setIsFetchingAudio(false);
    }
  };

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

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ key: string; commentary: string; application: string } | null>(null);
  const [editingProverb, setEditingProverb] = useState<[string, ProverbData] | null>(null);
  const [updatedTodayCount, setUpdatedTodayCount] = useState(0);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasExternalKey, setHasExternalKey] = useState(() => !!localStorage.getItem("EXTERNAL_API_KEYS_ENCRYPTED"));
  const [aiHistory, setAiHistory] = useState<AIHistoryItem[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());



  useEffect(() => {
    if (isOpen) {
      setAiHistory(getAIHistory());
    }
  }, [isOpen]);

  const handleClearHistory = () => {
    showConfirm('모든 AI 생성 기록을 삭제하시겠습니까?', () => {
      clearAIHistory();
      setAiHistory([]);
      setSelectedHistoryIds(new Set());
    });
  };

  const handleDeleteSelectedHistory = () => {
    if (selectedHistoryIds.size === 0) return;
    showConfirm(`선택한 ${selectedHistoryIds.size}개의 기록을 삭제하시겠습니까?`, () => {
      selectedHistoryIds.forEach(id => deleteAIHistoryItem(id));
      setAiHistory(prev => prev.filter(item => !selectedHistoryIds.has(item.id)));
      setSelectedHistoryIds(new Set());
    });
  };

  const toggleHistorySelection = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newSelected = new Set(selectedHistoryIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedHistoryIds(newSelected);
  };

  const handleDeleteHistoryItem = (id: string) => {
    showConfirm('이 기록을 삭제하시겠습니까?', () => {
      deleteAIHistoryItem(id);
      setAiHistory(prev => prev.filter(item => item.id !== id));
    });
  };

  const downloadHistoryItem = (item: AIHistoryItem) => {
    const a = document.createElement("a");
    if (item.imageUrl) {
      a.href = item.imageUrl;
      a.download = `ai-image-${item.id}.png`;
    } else if (item.audioUrl) {
      a.href = item.audioUrl;
      a.download = `ai-audio-${item.id}.wav`;
    } else {
      const file = new Blob([item.response], { type: 'text/plain' });
      a.href = URL.createObjectURL(file);
      a.download = `ai-script-${item.id}.txt`;
    }
    a.click();
  };

  const handleKeyModalClose = () => {
    setIsKeyModalOpen(false);
    setHasExternalKey(!!localStorage.getItem("EXTERNAL_API_KEYS_ENCRYPTED"));
  };

  const handleDownload = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(proverbs, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "proverbs.json";
    link.click();
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target && typeof e.target.result === 'string') {
          try {
            const newProverbsData = JSON.parse(e.target.result);
            setProverbs(newProverbsData);
            showAlert('잠언 데이터가 성공적으로 업데이트되었습니다.');
          } catch (error) {
            showAlert('에러: 유효하지 않은 JSON 파일입니다.');
          }
        }
      };
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target && typeof e.target.result === 'string') {
          try {
            const csvText = e.target.result;
            const lines = csvText.split('\n');
            // Remove BOM if present
            if (lines[0].charCodeAt(0) === 0xFEFF) {
              lines[0] = lines[0].slice(1);
            }
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
            
            const newProverbs: Record<string, ProverbData> = { ...proverbs };
            let successCount = 0;

            for(let i=1; i<lines.length; i++) {
              if(!lines[i].trim()) continue;
              
              // Simple CSV parser handling quotes
              const row: string[] = [];
              let current = '';
              let inQuote = false;
              for(let j=0; j<lines[i].length; j++) {
                const char = lines[i][j];
                if(char === '"') {
                  if (j + 1 < lines[i].length && lines[i][j+1] === '"') {
                    current += '"';
                    j++;
                  } else {
                    inQuote = !inQuote;
                  }
                } else if(char === ',' && !inQuote) {
                  row.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              row.push(current.trim());

              const data: any = {};
              headers.forEach((h, idx) => {
                if(row[idx]) data[h] = row[idx].replace(/^"|"$/g, '').replace(/""/g, '"');
              });

              if(data.reference) {
                // Key generation: remove book name, keep chapter:verse
                let key = data.reference;
                if (key.includes(' ')) {
                    const parts = key.split(' ');
                    key = parts[parts.length - 1];
                }

                newProverbs[key] = {
                  id: data.id || `csv_${Date.now()}_${i}`,
                  reference: data.reference,
                  title: data.title || '',
                  verse: data.verse || '',
                  source: data.source || data.reference,
                  theme: data.theme || '',
                  commentary: data.commentary || '',
                  application: data.application || '',
                  chartType: 'radar',
                  accentColor: '#5D6D5F',
                  tag: data.tag || '',
                  partner: data.partner || '',
                  categoryCode: data.categorycode || data.category_code || '',
                };
                successCount++;
              }
            }
            
            setProverbs(newProverbs);
            showAlert(`${successCount}개의 잠언 데이터가 CSV에서 가져와졌습니다.`);
          } catch (error) {
            console.error(error);
            showAlert('CSV 파싱 중 오류가 발생했습니다. 형식을 확인해주세요.');
          }
        }
      };
    }
  };

  const handleSyncFromSheet = async () => {
    showConfirm('Google Sheet에서 최신 데이터를 가져오시겠습니까? 기존 데이터는 업데이트됩니다.', async () => {
      setIsSyncing(true);
      try {
        const sheetData = await fetchProverbsFromSheet();
        setProverbs(prev => ({
          ...prev,
          ...sheetData
        }));
        showAlert('Google Sheet 데이터 동기화가 완료되었습니다.');
      } catch (error) {
        console.error(error);
        showAlert('데이터 동기화 중 오류가 발생했습니다.');
      } finally {
        setIsSyncing(false);
      }
    });
  };

  const triggerUpload = () => {
    const input = document.getElementById('json-upload-input') as HTMLInputElement;
    input?.click();
  };

  const triggerCsvUpload = () => {
    const input = document.getElementById('csv-upload-input') as HTMLInputElement;
    input?.click();
  };

  const handleDelete = (keyToDelete: string) => {
    console.log("Attempting to delete:", keyToDelete);
    showConfirm(`정말로 '${keyToDelete}' 잠언을 삭제하시겠습니까?`, () => {
      const { [keyToDelete]: _, ...remainingProverbs } = proverbs;
      console.log("Remaining proverbs count:", Object.keys(remainingProverbs).length);
      setProverbs(remainingProverbs);
    });
  };

  const handleAutoGenerate = async () => {
    console.log("handleAutoGenerate called");
    setIsGenerating(true);
    setGeneratedResult(null);
    setErrorMsg(null);

    try {
      const incompleteKey = Object.keys(proverbs).find(key => {
        const p = proverbs[key];
        if (!p) return false;
        const tr = p.translations?.[lang] ?? p.translations?.KO ?? {};
        const m = tr.merged ?? p.merged;
        const isDone = (typeof m === 'object' && m?.title && m?.body) || (p.title && (p.commentary?.length || 0) > 50);
        return !isDone;
      });

      console.log("Incomplete key found:", incompleteKey);

      if (!incompleteKey) {
        showAlert("모든 잠언에 V4 콘텐츠가 채워져 있습니다.");
        setIsGenerating(false);
        return;
      }

      const targetProverb = proverbs[incompleteKey];
      
      if (!targetProverb || (typeof targetProverb.verse === 'string' && targetProverb.verse.includes('말씀입니다.'))) {
        setErrorMsg("먼저 '365 성경 구절 텍스트 가져오기'를 실행하여 성경 텍스트를 채워주세요.");
        setIsGenerating(false);
        return;
      }

      const theme = targetProverb.theme || "지혜";

      let eventForTheme = historicalEvents.find(e => e.theme.toLowerCase() === theme.toLowerCase());
      if (!eventForTheme) {
        eventForTheme = historicalEvents[Math.floor(Math.random() * historicalEvents.length)];
      }

      const ai = getAI();
      if (!ai) {
        setErrorMsg("API Key가 설정되지 않았습니다.");
        setIsGenerating(false);
        return;
      }

      const v4_prompt = `
        당신은 역사적 사건을 바탕으로 잠언과 전도서의 지혜를 스토리텔링하는 세계 최고의 콘텐츠 작가입니다.
        다음 V4 템플릿 구조에 맞춰 독자가 전율을 느끼고 깨달음을 얻을 수 있는 묵상 글을 10개 생성해주세요.
        반드시 한국어로 작성하고 JSON 배열 형식으로 응답하세요.

        --- 정보 ---
        - 잠언/전도서: "${targetProverb.verse}" (${targetProverb.source})
        - 주제: ${theme}
        - 역사 사건: ${eventForTheme.event} (${eventForTheme.person || '관련 인물'})
        - 사건 요약: ${eventForTheme.summary}

        --- V4 구조 (JSON 필드명) ---
        1. hookingQuestion: '왜' 또는 '어떻게'로 시작하는 뇌를 깨우는 질문.
        2. historicalStory: 사건을 5~8문장의 몰입감 넘치는 이야기로 재구성 (설명 금지, 이야기하듯).
        3. insight: 이야기에서 인간 심리와 본성으로 연결하는 날카로운 통찰.
        4. quote: 관련 철학자/인물의 짧고 강렬한 격언.
        5. interpretation: 말씀의 핵심 의미와 하나님의 관점 해석.
        6. wisdomAcquisition: 지혜를 얻는 구체적 방법 2~3가지.
        7. applicationDeclaration: '그러므로 우리는 ... 해야 합니다' 식의 선언.
        8. conclusion: 지혜로운 자의 정의와 결론.
        9. finalQuestion: 독자에게 던지는 마지막 질문.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: v4_prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hookingQuestion: { type: Type.STRING },
                historicalStory: { type: Type.STRING },
                insight: { type: Type.STRING },
                quote: { type: Type.STRING },
                interpretation: { type: Type.STRING },
                wisdomAcquisition: { type: Type.STRING },
                applicationDeclaration: { type: Type.STRING },
                conclusion: { type: Type.STRING },
                finalQuestion: { type: Type.STRING },
              },
            },
          },
        },
      });
      const rawText = response.text || '[]';
      const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
      const v4_contents = JSON.parse(cleanText);
      
      // Find 10 incomplete keys
      const incompleteKeys = Object.keys(proverbs).filter(key => {
        const p = proverbs[key];
        if (!p) return false;
        const tr = p.translations?.[lang] ?? p.translations?.KO ?? {};
        const m = tr.merged ?? p.merged;
        const isDone = (typeof m === 'object' && m?.title && m?.body) || (p.title && (p.commentary?.length || 0) > 50);
        return !isDone;
      }).slice(0, 10);

      setProverbs(currentProverbs => {
        let newProverbs = { ...currentProverbs };
        
        v4_contents.forEach((v4_content: any, index: number) => {
          if (index < incompleteKeys.length) {
            const key = incompleteKeys[index];
            newProverbs[key] = {
              ...newProverbs[key],
              title: v4_content.hookingQuestion,
              commentary: `${v4_content.historicalStory}\n\n${v4_content.insight}\n\n${v4_content.quote}\n\n${v4_content.interpretation}`,
              application: `${v4_content.wisdomAcquisition}\n\n${v4_content.applicationDeclaration}\n\n${v4_content.conclusion}\n\n${v4_content.finalQuestion}`,
              merged: {
                title: v4_content.hookingQuestion,
                body: `${v4_content.historicalStory}\n\n${v4_content.insight}\n\n${v4_content.quote}\n\n${v4_content.interpretation}\n\n${v4_content.wisdomAcquisition}\n\n${v4_content.applicationDeclaration}\n\n${v4_content.conclusion}\n\n${v4_content.finalQuestion}`
              }
            };
          }
        });
        return newProverbs;
      });

      setGeneratedResult({ 
        key: incompleteKeys.join(', '), 
        commentary: `${v4_contents.length}개의 콘텐츠가 생성되었습니다.`, 
        application: ''
      });
      setUpdatedTodayCount(prev => prev + v4_contents.length);

    } catch (error: any) {
      console.error("V4 Content Generation error:", error);
      setErrorMsg(`V4 콘텐츠 생성 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const [isFetchingVerses, setIsFetchingVerses] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchVerseTexts = async () => {
    const ai = getAI();
    if (!ai) {
      setErrorMsg("API Key가 설정되지 않았습니다.");
      return;
    }

    setIsFetchingVerses(true);
    setErrorMsg(null);
    try {
      // Find verses that have placeholder text
      const placeholderKeys = Object.keys(proverbs).filter(key => typeof proverbs[key]?.verse === 'string' && proverbs[key].verse.includes('말씀입니다.'));
      
      if (placeholderKeys.length === 0) {
        showAlert("모든 성경 구절 텍스트가 이미 채워져 있습니다.");
        setIsFetchingVerses(false);
        return;
      }

      // Process in batches of 10 to avoid token limits
      const batchKeys = placeholderKeys.slice(0, 10);

      const prompt = `
        당신은 성경 전문가입니다. 다음 10개의 성경 구절의 정확한 텍스트(한국어 개역개정 기준)를 제공해주세요.
        반드시 JSON 배열 형태로 응답해야 합니다.
        구절 목록에 주어진 'id' 값을 절대로 변경하지 말고 그대로 응답의 'id' 필드에 사용하세요.
        
        구절 목록:
        ${batchKeys.map(key => `- id: "${key}", 구절: ${proverbs[key]?.source}`).join('\n')}
        
        응답 형식:
        [
          { "id": "Pr_2_1", "verse": "내 아들아 네가 만일 나의 말을 받으며 나의 계명을 네게 간직하며" },
          ...
        ]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                verse: { type: Type.STRING },
              },
            },
          },
        },
      });

      const rawText = response.text || '[]';
      const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
      const fetchedVerses = JSON.parse(cleanText);
      
      if (fetchedVerses.length === 0) {
        throw new Error("API 응답에서 구절 데이터를 찾을 수 없습니다.");
      }
      
      setProverbs(currentProverbs => {
        let newProverbs = { ...currentProverbs };
        fetchedVerses.forEach((fv: any) => {
          if (fv.id && newProverbs[fv.id]) {
            newProverbs[fv.id] = { ...newProverbs[fv.id], verse: fv.verse };
          }
        });
        return newProverbs;
      });

      showAlert(`${fetchedVerses.length}개의 성경 구절 텍스트를 성공적으로 가져왔습니다. 계속해서 버튼을 눌러 나머지를 가져오세요.`);
    } catch (error: any) {
      console.error("Fetch Verses error:", error);
      setErrorMsg(`성경 구절 텍스트를 가져오는 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsFetchingVerses(false);
    }
  };

  const stats = {
    total: Object.keys(proverbs).length,
    completed: Object.values(proverbs).filter(p => p && ((p.merged && typeof p.merged !== 'string' && p.merged.title) || (p.title && (p.commentary?.length || 0) > 50))).length,
    incomplete: Object.values(proverbs).filter(p => p && !p.merged && !p.title).length,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end md:items-center animate-fade-in p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] md:h-[90vh] flex flex-col p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 mb-6 gap-4 md:gap-0">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl md:text-2xl font-bold serif text-[#5D6D5F]">{t('adminDashboardTitle')}</h2>
              </div>
              <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-800 transition-colors font-bold p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setIsKeyModalOpen(true)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
                  hasExternalKey 
                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 animate-pulse'
                }`}
              >
                <Key className={`w-3.5 h-3.5 ${hasExternalKey ? 'text-green-600' : 'text-amber-600'}`} />
                {hasExternalKey ? '개인 API Key 설정됨' : '개인 API Key 등록 필요'}
              </button>
              <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-[10px] md:text-xs font-bold text-gray-600 whitespace-nowrap">{t('adminTotal')}: {stats.total}</span>
              <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] md:text-xs font-bold text-green-700 whitespace-nowrap">{t('adminDone')}: {stats.completed}</span>
              <span className="px-3 py-1 bg-blue-100 rounded-full text-[10px] md:text-xs font-bold text-blue-700 whitespace-nowrap">{t('adminToday')}: {updatedTodayCount}</span>
            </div>
          </div>
          <button onClick={onClose} className="hidden md:block text-gray-500 hover:text-gray-800 transition-colors font-bold">{t('adminClose')}</button>
        </div>



        {!hasExternalKey && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 animate-pulse">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              AI 기능을 사용하려면 상단의 <strong>[개인 API Key 등록 필요]</strong> 버튼을 눌러 본인의 Gemini API 키를 등록해주세요.
            </p>
          </div>
        )}
        <div className="flex-grow overflow-y-auto pr-2 md:pr-4 space-y-6 md:space-y-8">
          <div className="p-4 md:p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-[#5D6D5F] mb-4">Delivery Engine Status</h3>
            <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-600">
                    <span className="font-bold">Status:</span> {isFetchingAudio ? 'Checking...' : items.length > 0 ? 'Connected' : 'Disconnected'}
                </div>
                {fetchError && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200 break-all">
                        <span className="font-bold">Error Output:</span> {fetchError}
                    </div>
                )}
                <button 
                    onClick={handleFetchAndCombineAudio}
                    disabled={isFetchingAudio}
                    className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition-all w-fit flex items-center gap-2 disabled:opacity-50"
                >
                    {isFetchingAudio ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Checking...
                        </>
                    ) : (
                        <>
                            <Music className="w-4 h-4" />
                            Check & Fetch Audio
                        </>
                    )}
                </button>
            </div>
            {items.length > 0 && (
                <div className="mt-4 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="p-4 border rounded-xl bg-gray-50">
                            <h3 className="font-bold mb-3">{item.id}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(item.audio).map(([lang, url]) => (
                                    <AudioPlayer 
                                        key={lang}
                                        lang={lang}
                                        url={url as string} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
          
          <div className="p-4 md:p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-[#5D6D5F] mb-4">Engine Data Status</h3>
            <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-600">
                    <span className="font-bold">Last Updated (Server):</span> {enginePack?.updatedAt || 'Unknown'}
                </div>
                {enginePack?.items?.[0]?.createdAt && (
                    <div className="text-sm text-gray-600">
                        <span className="font-bold">Content Created At:</span> {enginePack.items[0].createdAt}
                    </div>
                )}
                 <div className="text-sm text-gray-600">
                    <span className="font-bold">Items Count:</span> {enginePack?.items?.length || 0}
                </div>
                <button 
                    onClick={onRefreshEngine}
                    disabled={isLoadingEngine}
                    className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all w-fit flex items-center gap-2 disabled:opacity-50"
                >
                    {isLoadingEngine ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Refreshing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Force Refresh Engine Data (Latest)
                        </>
                    )}
                </button>
            </div>
          </div>
          
          <div className="p-4 md:p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-[#5D6D5F] mb-4">{t('adminContentStatus')}</h3>
            <div className="h-64 overflow-y-auto border rounded-xl bg-white">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 sticky top-0 text-gray-600 font-bold border-b">
                  <tr>
                    <th className="p-3 whitespace-nowrap">ID</th>
                    <th className="p-3 whitespace-nowrap">성경 구절</th>
                    <th className="p-3 min-w-[150px]">{t('adminThTitle')}</th>
                    <th className="p-3 text-center whitespace-nowrap">{t('adminThStatus')}</th>
                    <th className="p-3 text-center whitespace-nowrap">{t('adminThManage')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(proverbs).sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true})).map(([key, proverb]) => {
                    if (!proverb) return null;
                    const tr = proverb.translations?.[lang] ?? proverb.translations?.KO ?? {};
                    const m = tr.merged ?? proverb.merged;
                    const displayTitle = (typeof m === 'object' ? m?.title : null) ?? tr?.dry?.title ?? proverb.title ?? '';
                    
                    const isDone = (typeof m === 'object' && m?.title && m?.body) || (proverb.title && (proverb.commentary?.length || 0) > 50);
                    const hasVerseText = typeof proverb.verse === 'string' && !proverb.verse.includes('말씀입니다.');

                    return (
                      <tr key={key} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-mono font-bold">{key}</td>
                        <td className="p-3 text-center">
                          {hasVerseText ? (
                            <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 rounded">완료</span>
                          ) : (
                            <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 rounded">대기</span>
                          )}
                        </td>
                        <td className="p-3 truncate max-w-[120px] md:max-w-md">{displayTitle || <span className="text-gray-300 italic">비어 있음</span>}</td>
                        <td className="p-3 text-center">
                          {isDone ? (
                            <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-100 rounded">{t('adminStatusDone')}</span>
                          ) : (
                            <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 rounded">{t('adminStatusIncomplete')}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => setEditingProverb([key, proverb])} className="text-blue-600 hover:underline text-xs">{t('adminEdit')}</button>
                            <button onClick={() => handleDelete(key)} className="text-red-600 hover:underline text-xs">{t('adminDelete')}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 md:p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-[#5D6D5F] mb-2">잠언 데이터 영구 저장 및 관리</h3>
            <p className="text-xs text-gray-500 mb-4">
              ⚠️ <strong>중요:</strong> 브라우저에서 수정/삭제한 내용은 현재 컴퓨터에만 임시 저장됩니다.<br/>
              모든 사용자에게 영구적으로 반영하려면 반드시 <strong>[잠언 데이터 JSON 다운로드]</strong> 버튼을 눌러 파일을 받은 후, 개발자에게 전달하여 깃허브(src/data/proverbs.ts)에 덮어써야 합니다.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={handleSyncFromSheet} 
                disabled={isSyncing}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Sheet 동기화
                  </>
                )}
              </button>
              <button onClick={handleDownload} className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all">잠언 데이터 JSON 다운로드</button>
              <button 
                onClick={() => {
                  const todayStr = new Date().toLocaleDateString('en-CA');
                  localStorage.removeItem(`bible_engine_cache_${todayStr}`);
                  showAlert('오늘의 엔진 캐시가 삭제되었습니다. 페이지를 새로고침하거나 엔진을 다시 불러와주세요.');
                }} 
                className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-orange-700 transition-all"
              >
                엔진 캐시 삭제
              </button>
              <button onClick={triggerUpload} className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all">잠언 데이터 JSON 불러오기</button>
              <input type="file" id="json-upload-input" accept=".json" onChange={handleUpload} className="hidden" />
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-900 mb-2">{t('adminV4Title')}</h3>
            <p className="text-sm text-indigo-700 mb-4">{t('adminV4Desc')}</p>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-fade-in">
                <span className="text-red-500 font-bold">⚠️</span>
                <p className="text-xs text-red-700 font-medium leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button onClick={handleAutoGenerate} disabled={isGenerating} className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-base hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md">
                {isGenerating ? t('adminV4Generating') : t('adminV4Button')}
              </button>
              <button onClick={fetchVerseTexts} disabled={isFetchingVerses} className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-base hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md">
                {isFetchingVerses ? '성경 구절 텍스트 가져오는 중...' : '365 성경 구절 텍스트 가져오기 (10개씩)'}
              </button>
            </div>
            
            <div className="mt-3 text-xs text-indigo-600/80 bg-indigo-100/50 p-3 rounded-lg flex items-start gap-2">
              <span className="text-indigo-500">💡</span>
              <p>생성된 데이터는 현재 브라우저(로컬 스토리지)에만 임시 저장됩니다. 영구적으로 반영하려면 상단의 <strong>[JSON 내보내기]</strong> 버튼을 눌러 파일을 다운로드한 후, 개발자에게 전달하여 깃허브 코드(src/data/proverbs.ts)에 업데이트해야 합니다.</p>
            </div>

            {generatedResult && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200 animate-slide-up">
                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
                  <span>✅</span> {generatedResult.key} {t('adminUpdateComplete')}
                </div>
                <p className="text-xs text-gray-500 italic">"{generatedResult.commentary.slice(0, 100)}..."</p>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 bg-white rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#5D6D5F] flex items-center gap-2">
                <History className="w-5 h-5" /> AI 생성 기록 (날짜별)
              </h3>
              <div className="flex items-center gap-4">
                {selectedHistoryIds.size > 0 && (
                  <button 
                    onClick={handleDeleteSelectedHistory}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-bold bg-red-50 px-2 py-1 rounded"
                  >
                    <Trash2 className="w-3 h-3" /> 선택 삭제 ({selectedHistoryIds.size})
                  </button>
                )}
                <button 
                  onClick={handleClearHistory}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold"
                >
                  <Trash2 className="w-3 h-3" /> 전체 삭제
                </button>
              </div>
            </div>

            {aiHistory.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm">
                생성된 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by date */}
                {(Array.from(new Set(aiHistory.map(h => h.date))) as string[]).sort((a, b) => b.localeCompare(a)).map(date => (
                  <div key={date} className="space-y-2">
                    <div className="text-xs font-bold text-gray-400 px-2 flex items-center gap-2">
                      <div className="h-px bg-gray-200 flex-grow"></div>
                      {date}
                      <div className="h-px bg-gray-200 flex-grow"></div>
                    </div>
                    {aiHistory.filter(h => h.date === date).map(item => (
                      <div key={item.id} className={`bg-gray-50 rounded-xl border ${selectedHistoryIds.has(item.id) ? 'border-red-300 bg-red-50/30' : 'border-gray-100'} overflow-hidden transition-all`}>
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                          onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-2 cursor-pointer"
                              onClick={(e) => toggleHistorySelection(item.id, e)}
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedHistoryIds.has(item.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleHistorySelection(item.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                              />
                            </div>
                            <div className={`p-2 rounded-lg ${
                              item.type === 'art' ? 'bg-amber-100 text-amber-600' :
                              item.type === 'counseling' ? 'bg-blue-100 text-blue-600' :
                              item.type === 'insight' ? 'bg-green-100 text-green-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              {item.type === 'art' ? <ImageIcon className="w-4 h-4" /> :
                               item.type === 'counseling' ? <MessageCircle className="w-4 h-4" /> :
                               item.type === 'insight' ? <Search className="w-4 h-4" /> :
                               <Sparkles className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-800">{item.title}</div>
                              <div className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleTimeString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                handleDeleteHistoryItem(item.id); 
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors z-10 relative"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation(); 
                                downloadHistoryItem(item); 
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors z-10 relative"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {expandedHistoryId === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                        
                        {expandedHistoryId === item.id && (
                          <div className="px-4 pb-4 pt-2 border-t border-gray-100 animate-slide-down">
                            {item.query && (
                              <div className="mb-3">
                                <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Query</div>
                                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 italic">
                                  {item.query}
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Response</div>
                              {item.imageUrl ? (
                                <div className="rounded-lg overflow-hidden border border-gray-200">
                                  <img src={item.imageUrl} alt="Generated Art" className="w-full h-auto" />
                                </div>
                              ) : item.audioUrl ? (
                                <audio controls src={item.audioUrl} className="w-full h-8" />
                              ) : (
                                <div className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-100 whitespace-pre-wrap leading-relaxed">
                                  {item.response}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      {editingProverb && (
        <EditProverbModal 
          proverbData={editingProverb} 
          onClose={() => setEditingProverb(null)}
          onSave={(updatedProverb) => {
            setProverbs(current => ({
              ...current,
              [editingProverb[0]]: updatedProverb,
            }));
            setEditingProverb(null);
            setUpdatedTodayCount(prev => prev + 1);
          }}
        />
      )}
      <KeyManagementModal 
        isOpen={isKeyModalOpen}
        onClose={handleKeyModalClose}
        lang={lang}
      />
      <DialogModal
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
      />
    </div>
  );
}
