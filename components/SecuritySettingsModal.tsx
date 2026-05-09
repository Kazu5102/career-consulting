
// components/SecuritySettingsModal.tsx - v5.74 - 2026-05-09 - Auth: 環境変数ベースのマスターパスワード機能（UI変更不可）に変更
import React, { useState, useEffect } from 'react';
import { setPassword } from '../services/authService';
import LockIcon from './icons/LockIcon';
import CheckIcon from './icons/CheckIcon';
import ClipboardIcon from './icons/ClipboardIcon';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // 初期状態をfalseに固定
  const [isSurveyEnabled, setIsSurveyEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('survey_enabled_v1');
    if (saved !== null) {
      setIsSurveyEnabled(saved === 'true');
    } else {
      // 初回訪問時は明示的にfalseを保存し、表示を抑制する
      localStorage.setItem('survey_enabled_v1', 'false');
      setIsSurveyEnabled(false);
    }
  }, [isOpen]);

  const toggleSurvey = () => {
    const newValue = !isSurveyEnabled;
    setIsSurveyEnabled(newValue);
    localStorage.setItem('survey_enabled_v1', String(newValue));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPwd !== confirmPwd) {
      setError('新しいパスワードが一致しません。');
      return;
    }

    const result = setPassword(newPwd, currentPwd);
    if (result.success) {
      setSuccess(true);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => {
          setSuccess(false);
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[300] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <LockIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">System & Security</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="p-8 space-y-8">
          <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-black text-sky-600 uppercase tracking-widest mb-4">
               <ClipboardIcon className="w-3.5 h-3.5" /> Governance Setting
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">アンケート表示設定</h3>
                <p className="text-[10px] text-slate-500 mt-1">要約生成中のアンケート介入を制御します</p>
              </div>
              <button 
                onClick={toggleSurvey}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isSurveyEnabled ? 'bg-sky-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSurveyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-xl border border-white">
              <p className="text-[10px] font-bold text-slate-400">Status: {isSurveyEnabled ? 'ENABLED (アンケートを表示します)' : 'DISABLED (要約へ直通します)'}</p>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">
               <LockIcon className="w-3.5 h-3.5" /> Identity Management
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600 font-medium">セキュリティ保護層（V5.74）</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  マスターパスワードは現在、サーバーの環境変数（VITE_ADMIN_PASSWORD）によって安全に一元管理されています。この端末からのパスワード変更は無効化されています。
                </p>
              </div>
              <button
                type="button"
                disabled
                className="w-full py-4 bg-slate-300 text-slate-500 font-bold rounded-2xl shadow-none mt-2 text-sm cursor-not-allowed"
              >
                Managed by Server
              </button>
            </div>
          </form>
        </div>
        
        <footer className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Protocol 2.0 Identity & Governance
            </p>
        </footer>
      </div>
    </div>
  );
};

export default SecuritySettingsModal;
