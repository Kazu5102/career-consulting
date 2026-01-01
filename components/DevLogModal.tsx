

import React, { useState, useEffect } from 'react';
import * as devLogService from '../services/devLogService';
import { DevLogEntry } from '../services/devLogService';
import LogIcon from './icons/LogIcon';
import TrashIcon from './icons/TrashIcon';
import FileTextIcon from './icons/FileTextIcon';

interface DevLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DevLogModal: React.FC<DevLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<DevLogEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      const allLogs = devLogService.getLogs();
      // Display newest first
      setLogs(allLogs.entries.slice().reverse());
    }
  }, [isOpen]);

  const handleClearLogs = () => {
    if (window.confirm("本当にすべての開発ログを削除しますか？この操作は元に戻せません。")) {
      devLogService.clearLogs();
      setLogs([]);
      // Do not close modal, so user sees the empty state
    }
  };

  const handleExportLogs = async () => {
    const logsData = devLogService.getLogs();
    if (logsData.entries.length === 0) {
      alert("エクスポートするログがありません。");
      return;
    }
    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const date = new Date().toISOString().split('T')[0];
    const suggestedName = `dev_log_${date}.json`;

    // Proposal 1: Unify to a single, stable download method to prevent crashes.
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Error during log export:', err);
        alert(`ログのエクスポート中にエラーが発生しました。`);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
             <LogIcon className="w-6 h-6 text-purple-600"/>
             <h2 className="text-xl font-bold text-slate-800">開発ログ</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportLogs} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors">
                <FileTextIcon />
                ログをエクスポート
            </button>
             <button onClick={handleClearLogs} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                <TrashIcon />
                ログをクリア
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>
        
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
          {logs.length > 0 ? (
            <div className="space-y-6">
              {logs.map((log, index) => (
                <div key={log.timestamp} className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
                  <p className="text-xs text-slate-500 font-mono mb-2 border-b pb-2">{formatDate(log.timestamp)}</p>
                  <div className="space-y-3">
                    <div>
                        <h4 className="font-semibold text-sm text-sky-700 mb-1">ユーザーリクエスト:</h4>
                        <p className="text-sm text-slate-800 bg-sky-50 p-2 rounded-md">{log.userPrompt}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-emerald-700 mb-1">AIの応答概要:</h4>
                        <p className="text-sm text-slate-800 bg-emerald-50 p-2 rounded-md">{log.aiSummary}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <LogIcon className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="font-semibold text-lg">開発ログはまだありません</h3>
                <p className="mt-1">開発を進めると、ここに対話の履歴が自動的に記録されます。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevLogModal;