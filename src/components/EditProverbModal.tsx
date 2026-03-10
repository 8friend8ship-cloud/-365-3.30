import React, { useState, useEffect } from 'react';
import type { ProverbData } from '../data/proverbs';

interface EditProverbModalProps {
  proverbData: [string, ProverbData];
  onClose: () => void;
  onSave: (updatedProverb: ProverbData) => void;
}

export default function EditProverbModal({ proverbData, onClose, onSave }: EditProverbModalProps) {
  const [key, initialData] = proverbData;
  const [editedData, setEditedData] = useState<ProverbData>(initialData);

  useEffect(() => {
    setEditedData(initialData);
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleMergedChange = (field: 'title' | 'body', value: string) => {
    setEditedData(prev => {
      const currentMerged = typeof prev.merged === 'object' ? prev.merged : { title: prev.title || '', body: prev.commentary || '' };
      return {
        ...prev,
        merged: {
          ...currentMerged,
          [field]: value
        }
      };
    });
  };

  const handleSave = () => {
    onSave(editedData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex justify-center items-end md:items-center animate-fade-in p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] md:h-[85vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#5D6D5F]">잠언 수정: <span className="font-mono">{key}</span></h3>
          <button onClick={onClose} className="md:hidden text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700">통합 데이터 (V4 Merged)</h4>
            <div>
              <label className="text-xs font-bold text-emerald-800 block mb-1">통합 제목</label>
              <input 
                type="text" 
                value={typeof editedData.merged === 'object' ? editedData.merged?.title : editedData.title} 
                onChange={(e) => handleMergedChange('title', e.target.value)} 
                className="w-full p-3 border-emerald-200 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-emerald-800 block mb-1">통합 본문</label>
              <textarea 
                value={typeof editedData.merged === 'object' ? editedData.merged?.body : editedData.commentary} 
                onChange={(e) => handleMergedChange('body', e.target.value)} 
                className="w-full p-3 border-emerald-200 border rounded-lg h-48 focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">기본 데이터 (Legacy)</h4>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">잠언 말씀</label>
              <textarea name="verse" value={editedData.verse} onChange={handleInputChange} className="w-full p-3 border rounded-lg h-24 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">기본 제목</label>
              <input type="text" name="title" value={editedData.title} onChange={handleInputChange} className="w-full p-3 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">대화 상대 (Partner)</label>
                <input 
                  type="text" 
                  name="partner" 
                  value={editedData.partner || ''} 
                  onChange={handleInputChange} 
                  className="w-full p-3 border rounded-lg text-sm" 
                  placeholder="예: 이설 친구"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">분류 코드 (Category)</label>
                <input 
                  type="text" 
                  name="categoryCode" 
                  value={editedData.categoryCode || ''} 
                  onChange={handleInputChange} 
                  className="w-full p-3 border rounded-lg text-sm" 
                  placeholder="예: C01_..."
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">취소</button>
          <button onClick={handleSave} className="flex-[2] py-4 text-sm font-bold text-white bg-[#5D6D5F] rounded-xl hover:bg-[#4a574c] transition-all shadow-lg">저장하기</button>
        </div>
      </div>
    </div>
  );
}
