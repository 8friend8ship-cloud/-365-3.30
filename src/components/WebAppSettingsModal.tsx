import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { WEBAPP_REGISTRY, saveWebAppConfig } from '../config/webapps';

interface WebAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WebAppSettingsModal({ isOpen, onClose }: WebAppSettingsModalProps) {
  const [primaryId, setPrimaryId] = useState(WEBAPP_REGISTRY.PRIMARY_CONTENT.deploymentId);
  const [primaryUrl, setPrimaryUrl] = useState(WEBAPP_REGISTRY.PRIMARY_CONTENT.url);
  const [primaryToken, setPrimaryToken] = useState(WEBAPP_REGISTRY.PRIMARY_CONTENT.token);

  const [audioId, setAudioId] = useState(WEBAPP_REGISTRY.AUDIO_DELIVERY.deploymentId);
  const [audioUrl, setAudioUrl] = useState(WEBAPP_REGISTRY.AUDIO_DELIVERY.url);
  const [audioToken, setAudioToken] = useState(WEBAPP_REGISTRY.AUDIO_DELIVERY.token);

  const [proxyConfig, setProxyConfig] = useState<{ targetBaseUrl: string; targetToken: string } | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [lastModified, setLastModified] = useState<string | null>(localStorage.getItem('webapp_config_time'));
  
  const [testStatus, setTestStatus] = useState<{ primary?: string; audio?: string }>({});
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/audio-proxy/config')
        .then(res => res.json())
        .then(data => setProxyConfig(data))
        .catch(err => console.error('Failed to fetch proxy config', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.includes('script.google.com/macros/s/');
    } catch {
      return false;
    }
  };

  const checkWarnings = () => {
    const warnings = [];
    if (!primaryToken) warnings.push('Primary Content WebApp: Access Token이 비어 있습니다.');
    if (!audioToken) warnings.push('Audio Delivery WebApp: Access Token이 비어 있습니다.');
    if (primaryUrl === audioUrl) warnings.push('Primary와 Audio URL이 동일합니다. 분리하는 것이 좋습니다.');
    
    if (primaryId && primaryUrl && !primaryUrl.includes(primaryId)) {
      warnings.push('Primary Content WebApp: Deployment ID와 URL이 일치하지 않습니다.');
    }
    if (audioId && audioUrl && !audioUrl.includes(audioId)) {
      warnings.push('Audio Delivery WebApp: Deployment ID와 URL이 일치하지 않습니다.');
    }
    
    if (primaryUrl && !validateUrl(primaryUrl)) warnings.push('Primary Content WebApp: URL 형식이 올바르지 않습니다.');
    if (audioUrl && !validateUrl(audioUrl)) warnings.push('Audio Delivery WebApp: URL 형식이 올바르지 않습니다.');

    return warnings;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    const newConfig = {
      ...WEBAPP_REGISTRY,
      PRIMARY_CONTENT: {
        ...WEBAPP_REGISTRY.PRIMARY_CONTENT,
        deploymentId: primaryId,
        url: primaryUrl,
        token: primaryToken
      },
      AUDIO_DELIVERY: {
        ...WEBAPP_REGISTRY.AUDIO_DELIVERY,
        deploymentId: audioId,
        url: audioUrl,
        token: audioToken
      }
    };

    try {
      // 1. Save to local storage
      saveWebAppConfig(newConfig);
      
      const now = new Date().toLocaleString();
      localStorage.setItem('webapp_config_time', now);
      setLastModified(now);

      // 2. Update proxy server
      await fetch('/api/audio-proxy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBaseUrl: audioUrl,
          targetToken: audioToken
        })
      });

      // Refresh proxy config display
      const res = await fetch('/api/audio-proxy/config');
      const data = await res.json();
      setProxyConfig(data);

      setSaveMessage('설정이 성공적으로 저장되었습니다. (페이지를 새로고침하면 완벽히 적용됩니다)');
      
      // Auto clear message
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (error) {
      console.error(error);
      setSaveMessage('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (type: 'primary' | 'audio') => {
    setIsTesting(true);
    setTestStatus(prev => ({ ...prev, [type]: 'Testing...' }));
    
    const url = type === 'primary' ? primaryUrl : audioUrl;
    const token = type === 'primary' ? primaryToken : audioToken;
    
    try {
      const callbackName = `__test_cb_${Date.now()}`;
      const script = document.createElement('script');
      
      const cleanup = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as any)[callbackName];
      };

      const result = await new Promise<boolean>((resolve) => {
        (window as any)[callbackName] = (data: any) => {
          cleanup();
          resolve(data && data.success === true);
        };
        
        const testUrl = new URL(url);
        testUrl.searchParams.set('type', 'today');
        testUrl.searchParams.set('token', token);
        testUrl.searchParams.set('callback', callbackName);
        testUrl.searchParams.set('t', Date.now().toString());
        
        script.src = testUrl.toString();
        script.onerror = () => {
          cleanup();
          resolve(false);
        };
        document.body.appendChild(script);
        
        setTimeout(() => {
          cleanup();
          resolve(false);
        }, 10000);
      });

      if (result) {
        setTestStatus(prev => ({ ...prev, [type]: '✅ Success (Valid JSONP)' }));
      } else {
        setTestStatus(prev => ({ ...prev, [type]: '❌ Failed (Timeout or Invalid)' }));
      }
    } catch (error: any) {
      setTestStatus(prev => ({ ...prev, [type]: `❌ Error: ${error.message}` }));
    } finally {
      setIsTesting(false);
    }
  };

  const warnings = checkWarnings();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            WebApp Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                주의 사항
              </h4>
              <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Primary Content WebApp */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#5D6D5F]">1. Primary Content WebApp</h3>
              <button 
                onClick={() => handleTest('primary')}
                disabled={isTesting}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                Test / Ping
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Deployment ID</label>
                <input 
                  type="text" 
                  value={primaryId} 
                  onChange={e => setPrimaryId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="AKfycb..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">/exec URL</label>
                <input 
                  type="text" 
                  value={primaryUrl} 
                  onChange={e => setPrimaryUrl(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Access Token</label>
                <input 
                  type="text" 
                  value={primaryToken} 
                  onChange={e => setPrimaryToken(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="Secret Token"
                />
              </div>
              {testStatus.primary && (
                <div className={`text-sm font-medium ${testStatus.primary.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                  Test Result: {testStatus.primary}
                </div>
              )}
            </div>
          </div>

          {/* Audio Delivery WebApp */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-800">2. Audio Delivery WebApp</h3>
              <button 
                onClick={() => handleTest('audio')}
                disabled={isTesting}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                Test / Ping
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Deployment ID</label>
                <input 
                  type="text" 
                  value={audioId} 
                  onChange={e => setAudioId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="AKfycb..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">/exec URL</label>
                <input 
                  type="text" 
                  value={audioUrl} 
                  onChange={e => setAudioUrl(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Access Token</label>
                <input 
                  type="text" 
                  value={audioToken} 
                  onChange={e => setAudioToken(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Secret Token"
                />
              </div>
              {testStatus.audio && (
                <div className={`text-sm font-medium ${testStatus.audio.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                  Test Result: {testStatus.audio}
                </div>
              )}
            </div>
          </div>

          {/* Audio Proxy/API Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm text-white">
            <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              3. Audio Proxy/API (Server Status)
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-gray-400">현재 프록시 서버가 실제로 rewrite/fetch에 사용 중인 설정입니다.</p>
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 break-all">
                <span className="text-gray-400 font-bold block mb-1">Target Base URL:</span>
                <span className="font-mono text-green-400">{proxyConfig?.targetBaseUrl || 'Loading...'}</span>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 break-all">
                <span className="text-gray-400 font-bold block mb-1">Target Token:</span>
                <span className="font-mono text-yellow-400">{proxyConfig?.targetToken || 'Loading...'}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 flex flex-col">
            {lastModified && <span>마지막 수정: {lastModified}</span>}
            {saveMessage && (
              <span className={`font-medium mt-1 ${saveMessage.includes('오류') ? 'text-red-600' : 'text-green-600 flex items-center gap-1'}`}>
                {!saveMessage.includes('오류') && <CheckCircle className="w-4 h-4" />}
                {saveMessage}
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              닫기
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
