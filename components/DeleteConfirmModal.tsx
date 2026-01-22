
// components/DeleteConfirmModal.tsx - v1.00 - Protocol 2.0 Compliant
import React from 'react';
import TrashIcon from './icons/TrashIcon';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, count, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[400] flex justify-center items-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="bg-rose-600 p-8 text-center text-white">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 mb-6 shadow-lg backdrop-blur-sm">
                <TrashIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Data Erasure Warning</h2>
            <p className="mt-2 text-rose-100 font-bold opacity-90 text-[10px] tracking-[0.2em]">Protocol 2.0 Security Override</p>
        </div>
        
        <div className="p-8 sm:p-10 space-y-6">
            <div className="text-center">
                <p className="text-slate-800 font-black text-lg mb-2">選択した {count} 名のデータを削除しますか？</p>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-800 text-sm font-bold leading-relaxed text-left">
                    <p className="flex gap-2">
                        <span className="shrink-0">⚠️</span>
                        <span>対象者の対話履歴、要約、分析レポート等、すべての関連データが完全に消去されます。</span>
                    </p>
                    <p className="mt-2 flex gap-2 font-black">
                        <span className="shrink-0">🚫</span>
                        <span>この操作は取り消せません。</span>
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onConfirm}
                    className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
                >
                    Confirm & Erase Data
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
        
        <footer className="p-4 bg-slate-50 border-t text-center">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Protocol 2.0: Authorized Administrator Action Only</p>
        </footer>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
