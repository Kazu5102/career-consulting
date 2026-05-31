// components/ExportSuccessModal.tsx - v6.04 - 2026-05-28 - Update Secure HTML Backup Instructions & Align Versions (Plan B)
import React from 'react';
import CheckIcon from './icons/CheckIcon';

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({ isOpen, onClose }) => {
  const VERSION = "6.03";
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckIcon />
            </div>
            <h2 className="text-xl font-bold text-slate-800">バックアップ完了</h2>
            <div className="text-slate-600 text-sm mt-4 text-left space-y-3 leading-relaxed">
              <p>
                <strong>個人用履歴バックアップ（暗号化HTMLファイル）</strong>のダウンロードが完了しました。
              </p>
              <div className="bg-sky-50 p-4 rounded-xl text-xs text-sky-800 space-y-2 border border-sky-100">
                <span className="font-extrabold block">🛡️ ゼロトラストセキュリティに関する重要事項</span>
                <p>・出力されたHTMLファイルは、あなたが設定したパスワードを用いて<strong>Web Crypto API（AES-GCM）により強力に暗号化</strong>されています。</p>
                <p>・このバックアップは、<strong>それ単体でローカルビューアーとして動作</strong>します。パスワードがなければ、キャリアアドバイザー（管理者）であっても一切閲覧できません。</p>
                <p>・復元・閲覧される際は、ファイルをドラッグ＆ドロップするか、口頭または物理的に別途共有されたパスワードを入力して展開してください。管理者側のデータベースに永続保存されることはありません。</p>
              </div>
            </div>
        </div>
        
        <div className="p-5 bg-slate-50 border-t rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700"
            >
              了解しました（安全に保管する）
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSuccessModal;
