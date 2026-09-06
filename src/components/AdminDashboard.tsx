import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import type { ProverbData } from '../data/proverbs';
import EditProverbModal from './EditProverbModal';
import DialogModal from './DialogModal';
import { getUIText } from '../i18n/uiTexts';
import { Download, Music, RefreshCw, Trash2 } from 'lucide-react';
import { fetchProverbsFromSheet } from '../services/sheetService';
import type { DailyPack } from '../types';

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

export default function AdminDashboard({
  isOpen,
  onClose,
  proverbs = {},
  setProverbs,
  lang = 'KO',
  enginePack,
  onRefreshEngine,
  isLoadingEngine = false,
}: AdminDashboardProps) {
  const t = (key: string) => getUIText(lang, key);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingProverb, setEditingProverb] = useState<[string, ProverbData] | null>(null);
  const [updatedTodayCount, setUpdatedTodayCount] = useState(0);
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: () => {} });

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

  const handleFetchAndCombineAudio = async () => {
    setIsFetchingAudio(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/bible365/engine?type=today', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const nextItems = data.items || data.payload?.items || [];
      if (!data.success && nextItems.length === 0) throw new Error(data.message || data.error || 'Invalid response');
      setItems(nextItems);
      showAlert(`${nextItems.length}개의 오디오/콘텐츠 데이터를 가져왔습니다.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFetchError(message);
      showAlert('오디오 데이터를 가져오지 못했습니다.');
    } finally {
      setIsFetchingAudio(false);
    }
  };

  const handleSyncFromSheet = async () => {
    showConfirm('중앙 Bible1 데이터에서 최신 내용을 가져오시겠습니까?', async () => {
      setIsSyncing(true);
      try {
        const sheetData = await fetchProverbsFromSheet();
        setProverbs(prev => ({ ...prev, ...sheetData }));
        showAlert('Bible1 데이터 동기화가 완료되었습니다.');
      } catch (error) {
        console.error(error);
        showAlert('데이터 동기화 중 오류가 발생했습니다.');
      } finally {
        setIsSyncing(false);
      }
    });
  };

  const handleDownload = () => {
    const file = new Blob([JSON.stringify(proverbs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bible365-proverbs.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = e => {
      try {
        const value = e.target?.result;
        if (typeof value !== 'string') throw new Error('EMPTY_FILE');
        setProverbs(JSON.parse(value));
        showAlert('JSON 데이터가 로컬 화면에 반영되었습니다.');
      } catch {
        showAlert('유효하지 않은 JSON 파일입니다.');
      }
    };
  };

  const handleDelete = (key: string) => {
    showConfirm(`'${key}' 항목을 로컬 화면에서 삭제하시겠습니까?`, () => {
      setProverbs(prev => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
    });
  };

  const stats = {
    total: Object.keys(proverbs).length,
    completed: Object.values(proverbs).filter(p => p && ((p.merged && typeof p.merged !== 'string' && p.merged.title) || (p.title && (p.commentary?.length || 0) > 50))).length,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end md:items-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] md:h-[90vh] flex flex-col p-4 md:p-8">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold serif text-[#5D6D5F]">{t('adminDashboardTitle')}</h2>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="px-3 py-1 bg-gray-100 rounded-full">{t('adminTotal')}: {stats.total}</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">{t('adminDone')}: {stats.completed}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">{t('adminToday')}: {updatedTodayCount}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold">{t('adminClose')}</button>
        </div>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
          브라우저 API Key·Apps Script URL·Access Token 입력 기능은 제거되었습니다. 관리 화면은 same-origin Bible365 서버 게이트웨이만 사용합니다.
        </div>

        <div className="flex-grow overflow-y-auto space-y-6 pr-1">
          <section className="p-4 md:p-6 border rounded-xl">
            <h3 className="font-bold text-[#5D6D5F] mb-3">Canonical Delivery Status</h3>
            <div className="text-sm text-gray-600">Status: {isFetchingAudio ? 'Checking...' : items.length ? 'Connected' : 'Not checked'}</div>
            {fetchError && <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded">{fetchError}</div>}
            <button onClick={handleFetchAndCombineAudio} disabled={isFetchingAudio} className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50">
              <Music className="w-4 h-4" /> {isFetchingAudio ? 'Checking...' : 'Check & Fetch'}
            </button>
            {items.length > 0 && (
              <div className="mt-4 space-y-3">
                {items.slice(0, 10).map(item => (
                  <div key={item.id || item.contentKey} className="p-3 border rounded-lg bg-gray-50">
                    <div className="font-bold text-sm">{item.id || item.contentKey || 'Bible365 item'}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {Object.entries(item.audio || {}).filter(([, url]) => !!url).map(([audioLang, url]) => (
                        <AudioPlayer key={audioLang} lang={audioLang} url={url as string} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="p-4 md:p-6 border rounded-xl">
            <h3 className="font-bold text-[#5D6D5F] mb-3">Engine Data Status</h3>
            <div className="text-sm text-gray-600">Last Updated: {enginePack?.updatedAt || 'Unknown'}</div>
            <div className="text-sm text-gray-600">Items: {enginePack?.items?.length || 0}</div>
            <button onClick={onRefreshEngine} disabled={isLoadingEngine} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${isLoadingEngine ? 'animate-spin' : ''}`} /> Refresh Engine
            </button>
          </section>

          <section className="p-4 md:p-6 border rounded-xl">
            <div className="flex flex-wrap gap-3 mb-4">
              <button onClick={handleSyncFromSheet} disabled={isSyncing} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                <Download className="w-4 h-4" /> {isSyncing ? '동기화 중...' : 'Bible1 동기화'}
              </button>
              <button onClick={handleDownload} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">JSON 내보내기</button>
              <label className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer">
                JSON 불러오기
                <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
              </label>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3">ID</th><th className="p-3">Reference</th><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(proverbs).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([key, proverb]) => {
                    if (!proverb) return null;
                    const tr = proverb.translations?.[lang] ?? proverb.translations?.KO ?? {};
                    const merged = tr.merged ?? proverb.merged;
                    const title = (typeof merged === 'object' ? merged?.title : '') || tr?.dry?.title || proverb.title || '';
                    const done = Boolean((typeof merged === 'object' && merged?.title && merged?.body) || (proverb.title && (proverb.commentary?.length || 0) > 50));
                    return (
                      <tr key={key}>
                        <td className="p-3 font-mono font-bold">{key}</td>
                        <td className="p-3">{proverb.reference || proverb.source || ''}</td>
                        <td className="p-3 max-w-md truncate">{title || '비어 있음'}</td>
                        <td className="p-3">{done ? 'DONE' : 'INCOMPLETE'}</td>
                        <td className="p-3">
                          <div className="flex gap-3">
                            <button onClick={() => setEditingProverb([key, proverb])} className="text-blue-600 hover:underline">{t('adminEdit')}</button>
                            <button onClick={() => handleDelete(key)} className="text-red-600 hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" />{t('adminDelete')}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {editingProverb && (
        <EditProverbModal
          proverbData={editingProverb}
          onClose={() => setEditingProverb(null)}
          onSave={updated => {
            setProverbs(current => ({ ...current, [editingProverb[0]]: updated }));
            setEditingProverb(null);
            setUpdatedTodayCount(prev => prev + 1);
          }}
        />
      )}
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
