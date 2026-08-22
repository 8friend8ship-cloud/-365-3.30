import React, { useEffect } from 'react';
import { X, ShieldCheck, Database, Server } from 'lucide-react';
import { purgeLegacyBrowserApiKeys } from '../services/aiService';

interface KeyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

export default function KeyManagementModal({ isOpen, onClose }: KeyManagementModalProps) {
  useEffect(() => {
    if (isOpen) purgeLegacyBrowserApiKeys();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bible365 실행 상태</h2>
            <p className="mt-1 text-sm text-slate-500">브라우저 API Key 없이 백데이터를 우선 사용합니다.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck className="mt-0.5 text-emerald-700" size={22} />
            <div>
              <div className="font-semibold text-emerald-900">브라우저 API Key 비활성</div>
              <div className="text-sm text-emerald-800">기존 브라우저 저장 키가 있으면 이 화면을 열 때 삭제합니다.</div>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
            <Database className="mt-0.5 text-slate-700" size={22} />
            <div>
              <div className="font-semibold text-slate-900">기본 데이터 경로</div>
              <div className="text-sm text-slate-600">로컬 캐시 → 저장된 Daily Pack → Apps Script 읽기 브리지 순서입니다.</div>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
            <Server className="mt-0.5 text-slate-700" size={22} />
            <div>
              <div className="font-semibold text-slate-900">비밀값 처리</div>
              <div className="text-sm text-slate-600">관리·오디오용 토큰은 서버측 환경변수만 사용하며 프런트 번들에 넣지 않습니다.</div>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800">
          확인
        </button>
      </div>
    </div>
  );
}
