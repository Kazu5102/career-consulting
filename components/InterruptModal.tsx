
// components/InterruptModal.tsx - v3.94 - Clarity Enhancement Update
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-black text-slate-800 text-center">相談を中断しますか？</h2>
          <p className="text-sm text-slate-500 mt-2 text-center font-medium">現在の対話内容の取扱いを選択してください。</p>
        </div>

        {/* 保存方法の解説セクション */}
        <div className="px-8 py-6 bg-slate-50/80 border-y border-slate-100 space-y-5">
          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <div className="w-1 h-4 bg-sky-500 rounded-full"></div>
              1. 相談を中断して保存（即時保護）
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed pl-3 font-medium">
              今のログを**ありのまま**保存してすぐに閉じます。AI解析を待たずに済みますが、**「振り返りシート」や「詳細ノート」は生成されません。**急用で離脱したい時に適しています。
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
              2. 相談を完了して要約（AI整理）
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed pl-3 font-medium">
              AIが全体を分析し、**気づきの整理と専門家への引継ぎノート**を作成します。解析に数十秒かかります。相談に区切りがついた時や、記録を残したい時に適しています。
            </p>
          </div>
        </div>
        
        <div className="p-8 pt-6 space-y-3">
            <button
              onClick={onSaveAndInterrupt}
              className="w-full flex flex-col items-center justify-center p-5 font-bold rounded-2xl transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700 ring-2 ring-sky-300 shadow-lg active:scale-[0.98]"
            >
              <span>中断して保存する</span>
              <span className="text-[10px] font-medium opacity-80 mt-1 uppercase tracking-tighter">Save Log without AI Analysis</span>
            </button>
            <button
              onClick={onExitWithoutSaving}
              className="w-full p-4 font-bold rounded-2xl transition-colors duration-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-sm active:scale-[0.98]"
            >
              保存せずに終了する
            </button>
             <button
              onClick={onContinue}
              className="w-full p-4 font-bold rounded-2xl transition-colors duration-200 text-slate-500 hover:bg-slate-100 text-sm"
            >
              相談を続ける
            </button>
        </div>
        <footer className="px-8 pb-4 text-center">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">※ 完了後の要約はチャット下の「相談を完了する」から行えます</p>
        </footer>
      </div>
    </div>
  );
};

export default InterruptModal;