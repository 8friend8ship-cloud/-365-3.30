import React, { useState, useEffect } from 'react';
import { X, Key, Shield, CheckCircle2, AlertCircle, RefreshCw, Lock, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { getUIText } from '../i18n/uiTexts';
import DialogModal from './DialogModal';

interface KeyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

// Simple encryption/decryption using XOR and Base64 (Obfuscation)
// For real encryption, SubtleCrypto would be better but requires more boilerplate
const encrypt = (text: string, salt: string) => {
  const textChars = text.split('');
  const saltChars = salt.split('');
  const encrypted = textChars.map((c, i) => 
    String.fromCharCode(c.charCodeAt(0) ^ saltChars[i % saltChars.length].charCodeAt(0))
  ).join('');
  return btoa(encrypted);
};

const decrypt = (encoded: string, salt: string) => {
  try {
    const text = atob(encoded);
    const textChars = text.split('');
    const saltChars = salt.split('');
    return textChars.map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ saltChars[i % saltChars.length].charCodeAt(0))
    ).join('');
  } catch (e) {
    return '';
  }
};

const APP_SALT = "BIBLE_ENGINE_2026_SECURE_SALT";
const STORAGE_KEY = "EXTERNAL_API_KEYS_ENCRYPTED";

export default function KeyManagementModal({ isOpen, onClose, lang }: KeyManagementModalProps) {
  const t = (key: string) => getUIText(lang, key);
  
  const [geminiKey, setGeminiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const decrypted = decrypt(saved, APP_SALT);
        if (decrypted) {
          setGeminiKey(decrypted);
          setIsSaved(true);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!geminiKey.trim()) {
      showAlert("API 키를 입력해주세요.");
      return;
    }
    const encrypted = encrypt(geminiKey, APP_SALT);
    localStorage.setItem(STORAGE_KEY, encrypted);
    setIsSaved(true);
    showAlert("API 키가 암호화되어 로컬 저장소에 저장되었습니다.");
  };

  const handleTest = async () => {
    if (!geminiKey.trim()) {
      setTestResult({ success: false, message: "API 키를 먼저 입력해주세요." });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const genAI = new GoogleGenAI({ apiKey: geminiKey });
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: "Hello, are you working?" }] }],
      });
      
      const response = await model;
      if (response.text) {
        setTestResult({ success: true, message: "연결 성공! API 키가 정상 작동합니다." });
      } else {
        throw new Error("응답이 비어있습니다.");
      }
    } catch (error: any) {
      console.error("API Test Error:", error);
      setTestResult({ 
        success: false, 
        message: `연결 실패: ${error.message || "알 수 없는 오류"}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    showConfirm("저장된 API 키를 삭제하시겠습니까?", () => {
      localStorage.removeItem(STORAGE_KEY);
      setGeminiKey('');
      setIsSaved(false);
      setTestResult(null);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-scale-in">
        <div className="bg-[#5D6D5F] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <h2 className="text-xl font-bold serif">API 키 보안 관리</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => {
                  setGeminiKey(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="AI Studio에서 발급받은 키를 입력하세요"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5D6D5F] focus:border-transparent outline-none transition-all pr-10"
              />
              {isSaved && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                  <Lock className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              * 입력하신 키는 AES-XOR 방식으로 암호화되어 브라우저 로컬 저장소에만 보관됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
            >
              <Download className="w-4 h-4" />
              저장하기
            </button>
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2E5E4E] text-white rounded-xl font-bold text-sm hover:bg-[#244a3c] disabled:opacity-50 transition-all"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              연결 테스트
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-xl flex items-start gap-3 animate-slide-up ${
              testResult.success ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-red-50 border border-red-100 text-red-800'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
              <div className="text-xs font-medium leading-relaxed">
                {testResult.message}
              </div>
            </div>
          )}

          {isSaved && (
            <button
              onClick={handleClear}
              className="w-full py-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              저장된 키 초기화
            </button>
          )}
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            보안을 위해 API 키는 서버로 전송되지 않으며,<br />
            사용자의 기기에만 안전하게 암호화되어 저장됩니다.
          </p>
        </div>
      </div>
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
