
import React, { useState, useEffect, useRef } from 'react';
import { UserInfo } from '../types';
import LockIcon from './icons/LockIcon';
import { checkPassword } from '../services/authService';

interface PinModalProps {
  isOpen: boolean;
  user: UserInfo;
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, user, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setPin('');
      setError('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Check against User PIN OR Global Master Password
    if (pin === user.pin || checkPassword(pin)) {
      onSuccess(user.id);
    } else {
      setError('認証に失敗しました。');
      setPin('');
      inputRef.current?.select();
    }
  };
  
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPin(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
                <LockIcon className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">認証が必要です</h3>
            <p className="text-slate-600">こんにちは、<span className="font-bold">{user.nickname}</span> さん</p>
            <p className="text-sm text-slate-500 mt-1">PINコード または パスワードを入力してください。</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div>
                <input
                    ref={inputRef}
                    type="password"
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="PIN または Password"
                    className={`w-full text-center tracking-widest text-xl font-bold px-4 py-3 bg-slate-100 rounded-lg border ${error ? 'border-red-400 ring-red-400' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200`}
                    autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-1.5 px-1 text-center">{error}</p>}
            </div>
            <button
                type="submit"
                disabled={!pin}
                className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                認証
            </button>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
