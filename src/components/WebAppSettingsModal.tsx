import React, { useEffect, useState } from 'react';
import { X, RefreshCw, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

interface WebAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RuntimeStatus = {
  appId?: string;
  canonicalRepo?: string;
  canonicalGroup?: string;
  mode?: string;
  configured?: boolean;
  browserSecretExposure?: boolean;
  browserPrivateIdExposure?: boolean;
  backdataMode?: string;
};

export default function WebAppSettingsModal({ isOpen, onClose }: WebAppSettingsModalProps) {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [engineResult, setEngineResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const [runtimeRes, engineRes] = await Promise.all([
        fetch('/api/bible365/runtime-status', { cache: 'no-store' }),
        fetch('/api/bible365/engine?type=today', { cache: 'no-store' }),
      ]);
      const runtime = await runtimeRes.json();
      setStatus(runtime);
      setEngineResult(engineRes.ok ? '✅ Canonical gateway reachable' : `⚠️ Gateway HTTP ${engineRes.status}`);
    } catch (error) {
      setEngineResult(`❌ ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void refreshStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const secure = status?.browserSecretExposure === false && status?.browserPrivateIdExposure === false;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Bible365 Runtime Status
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className={`rounded-xl border p-4 ${secure ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2 font-bold">
              {secure ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {secure ? '브라우저 비밀정보 노출 차단됨' : '런타임 설정 확인 필요'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <StatusRow label="App" value={status?.appId || 'APP_BIBLE365'} />
            <StatusRow label="Mode" value={status?.mode || 'UNKNOWN'} />
            <StatusRow label="Configured" value={String(!!status?.configured)} />
            <StatusRow label="Backdata" value={status?.backdataMode || 'BIBLE1_CANONICAL_CHAIN'} />
            <StatusRow label="Repo" value={status?.canonicalRepo || '8friend8ship-cloud/-365-3.30'} />
            <StatusRow label="Gateway" value={engineResult || 'Not checked'} />
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Apps Script URL, Deployment ID, Spreadsheet ID, Editor ID, Access Token은 브라우저에서 입력·저장하지 않습니다.
            기존 Bible1 런타임 값은 서버 환경과 중앙 Registry에서만 관리합니다.
          </p>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={refreshStatus} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            다시 확인
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-700">닫기</button>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="text-[11px] font-bold text-gray-400 uppercase">{label}</div>
      <div className="mt-1 text-gray-800 break-all">{value}</div>
    </div>
  );
}
