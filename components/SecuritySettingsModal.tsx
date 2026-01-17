// components/SecuritySettingsModal.tsx - v3.63 - Survey Governance Toggle
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
  
  // アンケート設定の状態管理
  const [isSurveyEnabled, setIsSurveyEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('survey_enabled_v1');
    if (saved !== null) {
      setIsSurveyEnabled(saved === 'true');
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
          {/* アンケートガバナンス設定 */}
          <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-black text-sky-600 uppercase tracking-widest mb-4">
               {/* FIX: Ensure icon components handle optional className correctly */}
               <ClipboardIcon /> Governance Setting
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

          {/* パスワード変更フォーム */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">
               <LockIcon className="w-3.5 h-3.5" /> Identity Management
            </div>
            {success ? (
              <div className="py-4 flex flex-col items-center justify-center text-emerald-600 animate-in fade-in zoom-in">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                  <CheckIcon />
                </div>
                <p className="text-sm font-bold">パスワードを変更しました</p>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="現在のパスワード"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-sm"
                  required
                />
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="新しいパスワード (4文字以上)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-sm"
                  required
                />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="パスワードの確認"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-sm"
                  required
                />
                {error && <p className="text-[10px] text-rose-500 font-bold px-1">{error}</p>}
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-[0.98] shadow-lg mt-2 text-sm"
                >
                  Update Password
                </button>
              </div>
            )}
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