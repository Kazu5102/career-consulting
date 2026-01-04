
// components/UserDashboard.tsx - v2.42 - User-side Import Logic Added
import React, { useState, useRef } from 'react';
import { StoredConversation, SkillMatchingResult, STORAGE_VERSION, StoredData, AnalysisStateItem } from '../types';
import ConversationDetailModal from './ConversationDetailModal';
import SkillMatchingModal from './SkillMatchingModal';
import { performSkillMatching } from '../services/index';
import TargetIcon from './icons/TargetIcon';
import PlayIcon from './icons/PlayIcon';
import ExportIcon from './icons/ExportIcon';
import ImportIcon from './icons/ImportIcon';
import ExportSuccessModal from './ExportSuccessModal';

interface UserDashboardProps {
  conversations: StoredConversation[];
  onNewChat: () => void;
  onResume: (conversation: StoredConversation) => void;
  userId: string;
  nickname: string;
  onSwitchUser: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ conversations, onNewChat, onResume, userId, nickname, onSwitchUser }) => {
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [skillMatchingState, setSkillMatchingState] = useState<AnalysisStateItem<SkillMatchingResult>>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [isExportSuccessModalOpen, setIsExportSuccessModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const getAITypeDisplay = (conv: StoredConversation) => {
    if (!conv.aiType) return '';
    return conv.aiType === 'human' ? ' (人間)' : ' (犬)';
  };

  const handleRunSkillMatching = async () => {
    if (conversations.length === 0) {
      alert("分析には少なくとも1件の相談履歴が必要です。");
      return;
    }
    setIsMatchingModalOpen(true);
    setSkillMatchingState({ status: 'loading', data: null, error: null });
    try {
      const result = await performSkillMatching(conversations);
      setSkillMatchingState({ status: 'success', data: result, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setSkillMatchingState({ status: 'error', data: null, error: errorMessage });
    }
  };

  const handleExportUserData = async () => {
      if (conversations.length === 0 || isExporting) return;
      setIsExporting(true);
      try {
          const dataToStore: StoredData = { version: STORAGE_VERSION, data: conversations };
          const blob = new Blob([JSON.stringify(dataToStore, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `career_data_${userId}_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsExportSuccessModalOpen(true);
      } catch (err) {
          alert(`エラーが発生しました。`);
      } finally {
        setIsExporting(false);
      }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') return;
            const imported = JSON.parse(text);
            const importedConvs = Array.isArray(imported) ? imported : (imported.data || []);
            
            const existingIds = new Set(conversations.map(c => c.id));
            const newConvs = importedConvs.filter((c: any) => !existingIds.has(c.id));
            
            if (newConvs.length === 0) {
              alert("新しいデータは見つかりませんでした。");
              return;
            }

            const storedRaw = localStorage.getItem('careerConsultations');
            let currentAll = [];
            if (storedRaw) {
                const parsed = JSON.parse(storedRaw);
                currentAll = parsed.data || (Array.isArray(parsed) ? parsed : []);
            }
            
            const updated = [...currentAll, ...newConvs];
            localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updated }));
            alert(`${newConvs.length}件の履歴を復元しました。画面を再読み込みします。`);
            window.location.reload();
        } catch (error) {
            alert(`読み込みに失敗しました。ファイル形式を確認してください。`);
        }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-8 my-4 md:my-6 min-h-[80vh]">
          <header className="flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-200">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">{nickname}さんのダッシュボード</h1>
                  <p className="text-sm text-slate-500 mt-1 truncate" title={userId}>相談者ID: <span className="font-mono">{userId}</span></p>
                </div>
                <button onClick={onSwitchUser} className="flex-shrink-0 px-3 py-1.5 text-sm bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-all">相談者の選択</button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
                 <button onClick={onNewChat} className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-all text-center">新しい相談</button>
                 <button onClick={handleRunSkillMatching} disabled={conversations.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 disabled:bg-slate-400"><TargetIcon />適性診断</button>
                 <button onClick={handleExportUserData} disabled={conversations.length === 0 || isExporting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-400"><ExportIcon />保存</button>
                 <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all"><ImportIcon />読み込む</button>
                 <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
             </div>
             <h2 className="text-lg font-bold text-slate-800 mb-2">相談履歴 ({conversations.length}件)</h2>
          </header>
          
          <div className="flex-1 overflow-y-auto -mr-3 pr-3 space-y-2 mt-2">
            {conversations.length > 0 ? (
                [...conversations].reverse().map(conv => (
                    <div key={conv.id} className="w-full text-left p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-sky-50 transition-colors duration-150">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex-grow cursor-pointer" onClick={() => setSelectedConversation(conv)}>
                                <div className="font-semibold text-slate-700 flex items-center gap-2">
                                  {formatDate(conv.date)}
                                  {conv.status === 'interrupted' && <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">中断</span>}
                                </div>
                                <p className="text-sm text-slate-500">担当AI: {conv.aiName}{getAITypeDisplay(conv)}</p>
                            </div>
                            {conv.status === 'interrupted' && (
                                <button onClick={() => onResume(conv)} className="w-full sm:w-auto px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-2"><PlayIcon />再開</button>
                            )}
                        </div>
                    </div>
                ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 rounded-lg bg-slate-100">
                  <h3 className="text-md font-bold text-slate-700">相談履歴がありません</h3>
                  <p className="mt-2 text-sm">相談を始めるか、「読み込む」からデータを復元してください。</p>
              </div>
            )}
          </div>
      </div>
      {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
      <SkillMatchingModal isOpen={isMatchingModalOpen} onClose={() => setIsMatchingModalOpen(false)} analysisState={skillMatchingState} />
      <ExportSuccessModal isOpen={isExportSuccessModalOpen} onClose={() => setIsExportSuccessModalOpen(false)} />
    </>
  );
};

export default UserDashboard;
