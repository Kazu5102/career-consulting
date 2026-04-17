
// components/DevLogModal.tsx - v4.12 - Audit Visualization
import React, { useState, useEffect } from 'react';
import * as devLogService from '../services/devLogService';
import { DevLogEntry } from '../services/devLogService';
import LogIcon from './icons/LogIcon';
import TrashIcon from './icons/TrashIcon';
import FileTextIcon from './icons/FileTextIcon';
import LockIcon from './icons/LockIcon';
import DatabaseIcon from './icons/DatabaseIcon';

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
    if (window.confirm("全てのログを削除しますか？\n※セキュリティ監査ログも含まれます。通常は推奨されません。")) {
      devLogService.clearLogs();
      setLogs([]);
    }
  };

  const handleExportLogs = () => {
    const logsData = devLogService.getLogs();
    if (logsData.entries.length === 0) {
      alert("エクスポートするログがありません。");
      return;
    }
    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const date = new Date().toISOString().split('T')[0];
    const suggestedName = `audit_log_${date}.json`;

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
        alert(`ログのエクスポート中にエラーが発生しました。`);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getLogIcon = (type: string) => {
      switch(type) {
          case 'security': return <LockIcon className="w-4 h-4 text-rose-500" />;
          case 'audit': return <FileTextIcon className="w-4 h-4 text-amber-500" />;
          case 'system': return <DatabaseIcon className="w-4 h-4 text-sky-500" />;
          default: return <LogIcon className="w-4 h-4 text-slate-400" />;
      }
  };

  const getLogColor = (level: string) => {
      switch(level) {
          case 'critical': return 'bg-rose-50 border-rose-100';
          case 'warn': return 'bg-amber-50 border-amber-100';
          default: return 'bg-white border-slate-100';
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[200] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 rounded-lg"><LogIcon className="w-5 h-5 text-slate-600"/></div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">System Audit Logs</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol 2.0 Compliance Record</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportLogs} className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                <FileTextIcon className="w-3.5 h-3.5"/>
                Export JSON
            </button>
             <button onClick={handleClearLogs} className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-white text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors">
                <TrashIcon className="w-3.5 h-3.5"/>
                Clear
            </button>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>
        
        <div className="p-0 flex-1 overflow-y-auto bg-slate-50">
          {logs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {logs.map((log, index) => (
                <div key={index} className={`p-4 flex gap-4 ${getLogColor(log.level)} hover:bg-opacity-80 transition-colors`}>
                  <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{formatDate(log.timestamp)}</span>
                      <div className="p-1.5 bg-white rounded-full border border-slate-100 shadow-sm">
                        {getLogIcon(log.type)}
                      </div>
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                              log.level === 'critical' ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                              log.level === 'warn' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                              'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                              {log.type.toUpperCase()}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 truncate">{log.action}</h4>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed break-words whitespace-pre-wrap font-mono bg-white/50 p-2 rounded-lg border border-slate-200/50">
                          {log.details}
                      </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
                <LogIcon className="w-12 h-12 text-slate-200 mb-4" />
                <h3 className="font-bold text-lg text-slate-500">ログは空です</h3>
                <p className="text-xs font-medium mt-1">システム操作やセキュリティイベントがここに記録されます。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevLogModal;
