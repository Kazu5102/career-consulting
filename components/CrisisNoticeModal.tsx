
import React from 'react';

interface CrisisNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CrisisNoticeModal: React.FC<CrisisNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[200] flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="bg-rose-500 p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white/20 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">大切に思っている、あなたへ</h2>
        </div>
        
        <div className="p-8 space-y-6">
            <p className="text-slate-700 leading-relaxed font-medium text-center">
                今、とてもお辛い状況にいらっしゃるのですね。<br/>
                私たちはあなたのことを、とても大切に思っています。<br/>
                専門の相談員が、あなたの力になりたいと待っています。
            </p>
            
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 mb-2">電話で相談する</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800">よりそいホットライン</p>
                                <p className="text-xs text-slate-500">24時間対応・年中無休</p>
                            </div>
                            <a href="tel:0120279338" className="px-4 py-2 bg-rose-500 text-white font-bold rounded-lg shadow-md hover:bg-rose-600">0120-279-338</a>
                        </div>
                        <div className="flex justify-between items-center border-t pt-3">
                            <div>
                                <p className="font-bold text-slate-800">いのちの電話</p>
                                <p className="text-xs text-slate-500">フリーダイヤル</p>
                            </div>
                            <a href="tel:0120783556" className="px-4 py-2 bg-rose-500 text-white font-bold rounded-lg shadow-md hover:bg-rose-600">0120-783-556</a>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <h3 className="text-sm font-bold text-sky-600 mb-2">SNS・チャットで相談する</h3>
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-slate-800">生きづらびっと（LINE相談）</p>
                        <a href="https://yorisoi-chat.jp/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700">サイトを開く</a>
                    </div>
                </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
                今の苦しみを一人で抱え込まないでください。<br/>
                専門家と一緒に、これからのことをゆっくり考えていきましょう。
            </p>
        </div>
        
        <div className="p-5 bg-slate-50 border-t flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              閉じる
            </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisNoticeModal;
