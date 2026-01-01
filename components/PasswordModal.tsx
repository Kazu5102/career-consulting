
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
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (onSubmit(password)) {
      setPassword('');
      // Parent component will close the modal on success
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
                <LockIcon className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">管理者認証</h3>
            <p className="text-sm text-slate-500 mt-1">管理者画面にアクセスするにはパスワードが必要です。</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div>
                <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    className={`w-full px-4 py-3 bg-slate-100 rounded-lg border ${error ? 'border-red-400 ring-red-400' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200`}
                    autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-1.5 px-1">{error}</p>}
            </div>
            <button
                type="submit"
                disabled={!password}
                className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                認証
            </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
