import React from 'react';
import CheckIcon from './icons/CheckIcon';

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckIcon />
            </div>
            <h2 className="text-xl font-bold text-slate-800">エクスポート完了</h2>
            <p className="text-slate-600 mt-4">
              データのエクスポートが完了しました。<br/>
              ダウンロードしたJSONファイルを、メール等で管理者にご提出ください。
            </p>
        </div>
        
        <div className="p-5 bg-slate-50 border-t rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700"
            >
              OK
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSuccessModal;
