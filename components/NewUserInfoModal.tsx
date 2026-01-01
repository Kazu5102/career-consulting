import React from 'react';
import { UserInfo } from '../types';
import CheckIcon from './icons/CheckIcon';

interface NewUserInfoModalProps {
  isOpen: boolean;
  user: UserInfo;
  onConfirm: () => void;
}

const NewUserInfoModal: React.FC<NewUserInfoModalProps> = ({ isOpen, user, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckIcon />
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center">ようこそ！</h2>
            <p className="text-slate-600 mt-2 text-center">あなた専用の情報が作成されました。</p>
            
            <div className="my-6 space-y-4 text-left bg-slate-50 p-4 rounded-lg border">
                <div>
                    <p className="text-sm text-slate-500">あなたのニックネーム</p>
                    <p className="text-2xl font-bold text-sky-700">{user.nickname}</p>
                </div>
                 <div>
                    <p className="text-sm text-slate-500">認証用PINコード</p>
                    <p className="text-4xl font-mono font-bold tracking-widest text-sky-700">{user.pin}</p>
                </div>
            </div>
            
            <p className="text-sm text-slate-600 bg-amber-100 text-amber-800 p-3 rounded-lg text-left">
              <strong>重要:</strong> このニックネームとPINコードは、次回以降のログインで必要になります。忘れないようにメモしてください。
            </p>
        </div>
        
        <div className="p-5 bg-slate-50 border-t rounded-b-2xl">
            <button
              onClick={onConfirm}
              className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700"
            >
              はい、覚えました
            </button>
        </div>
      </div>
    </div>
  );
};

export default NewUserInfoModal;
