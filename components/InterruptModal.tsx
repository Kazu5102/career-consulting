
import React from 'react';

interface InterruptModalProps {
  isOpen: boolean;
  onSaveAndInterrupt: () => void;
  onExitWithoutSaving: () => void;
  onContinue: () => void;
}

const InterruptModal: React.FC<InterruptModalProps> = ({ isOpen, onSaveAndInterrupt, onExitWithoutSaving, onContinue }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onContinue}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 text-center">相談を中断しますか？</h2>
          <p className="text-sm text-slate-600 mt-2 text-center">現在の対話内容の取扱いを選択してください。</p>
        </div>
        
        <div className="p-6 pt-0 space-y-3">
            <button
              onClick={onSaveAndInterrupt}
              className="w-full flex flex-col items-center justify-center p-4 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700 ring-2 ring-sky-300"
            >
              <span>中断して保存する</span>
              <span className="text-xs font-normal opacity-90 mt-1">ここまでの内容を履歴に残します。</span>
            </button>
            <button
              onClick={onExitWithoutSaving}
              className="w-full p-3 font-semibold rounded-lg transition-colors duration-200 bg-red-100 text-red-700 hover:bg-red-200"
            >
              保存せずに終了する
            </button>
             <button
              onClick={onContinue}
              className="w-full p-3 font-semibold rounded-lg transition-colors duration-200 text-slate-600 hover:bg-slate-100"
            >
              相談を続ける
            </button>
        </div>
      </div>
    </div>
  );
};

export default InterruptModal;
