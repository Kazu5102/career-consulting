
import React, { useState, useEffect, useRef } from 'react';
import LockIcon from './icons/LockIcon';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => boolean;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
      setPassword('');
      setError('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (onSubmit(password)) {
      setPassword('');
    } else {
      setError('パスワードが正しくありません。');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleClose = () => {
      setPassword('');
      setError('');
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 relative" onClick={e => e.stopPropagation()}>
        {/* Cancel Button (Top Right) */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-slate-100 mb-4">
                <LockIcon className="h-7 w-7 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">管理者認証</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">管理者画面にアクセスするには<br/>パスワードが必要です。</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <div>
                <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    className={`w-full px-4 py-3.5 bg-slate-50 rounded-xl border-2 ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 text-center font-bold tracking-widest`}
                    autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-2 font-bold text-center animate-in shake duration-300">{error}</p>}
            </div>
            <button
                type="submit"
                disabled={!password}
                className="w-full py-4 font-black rounded-xl transition-all duration-300 bg-slate-900 text-white hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
            >
                認証
            </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
