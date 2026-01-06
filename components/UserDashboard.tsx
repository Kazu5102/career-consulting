
// components/UserDashboard.tsx - v2.86 - Data Portability and Sorting Enhancement
import React, { useState, useRef, useMemo } from 'react';
import { StoredConversation, STORAGE_VERSION, StoredData, UserInfo } from '../types';
import ConversationDetailModal from './ConversationDetailModal';
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
  pin: string;
}

type SortOrder = 'desc' | 'asc';

const UserDashboard: React.FC<UserDashboardProps> = ({ conversations, onNewChat, onResume, userId, nickname, onSwitchUser, pin }) => {
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [isExportSuccessModalOpen, setIsExportSuccessModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ver 2.86: 秒まで表示し、より精密な履歴表示へ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  
  const getAITypeDisplay = (conv: StoredConversation) => {
    if (!conv.aiType) return '';
    return conv.aiType === 'human' ? ' (人間)' : ' (犬)';
  };

  const handleExportUserData = async () => {
      if (conversations.length === 0 || isExporting) return;
      setIsExporting(true);
      try {
          const userData: UserInfo = { id: userId, nickname, pin };
          const dataToStore: StoredData = { 
              version: STORAGE_VERSION, 
              data: conversations,
              userInfo: userData
          };
          const blob = new Blob([JSON.stringify(dataToStore, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `career_data_${nickname}_${new Date().toISOString().split('T')[0]}.json`;
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

            if (imported.userInfo) {
                const currentUsers = JSON.parse(localStorage.getItem('careerConsultingUsers_v1') || '[]');
                if (!currentUsers.find((u: UserInfo) => u.id === imported.userInfo.id)) {
                    localStorage.setItem('careerConsultingUsers_v1', JSON.stringify([...currentUsers, imported.userInfo]));
                }
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

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [conversations, sortOrder]);

  const toggleSort = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

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
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
                 <button onClick={onNewChat} className="w-full px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-all text-center">新しい相談を始める</button>
                 <button onClick={handleExportUserData} disabled={conversations.length === 0 || isExporting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 disabled:bg-slate-400"><ExportIcon />データを保存する</button>
                 <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all"><ImportIcon />過去のデータを読み込む</button>
                 <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
             </div>
             <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl mb-4">
                <p className="text-xs text-sky-800 font-bold leading-relaxed">
                  ※AIとの対話内容は保存・管理されています。より詳細な適性診断やキャリアアドバイスをご希望の場合は、この画面の「保存」からデータを出力し、専門のキャリアコンサルタントへご提示ください。
                </p>
             </div>
             
             <div className="flex justify-between items-center mb-2">
                 <h2 className="text-lg font-bold text-slate-800">相談履歴 ({conversations.length}件)</h2>
                 <button 
                    onClick={toggleSort} 
                    className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    {sortOrder === 'desc' ? '新しい順' : '古い順'}
                 </button>
             </div>
          </header>
          
          <div className="flex-1 overflow-y-auto -mr-3 pr-3 space-y-2 mt-2">
            {sortedConversations.length > 0 ? (
                sortedConversations.map(conv => (
                    <div key={conv.id} className="w-full text-left p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-sky-50 transition-colors duration-150">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex-grow cursor-pointer" onClick={() => setSelectedConversation(conv)}>
                                <div className="font-mono font-semibold text-slate-700 flex items-center gap-2">
                                  {formatDate(conv.date)}
                                  {conv.status === 'interrupted' && <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-sans">中断</span>}
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
      <ExportSuccessModal isOpen={isExportSuccessModalOpen} onClose={() => setIsExportSuccessModalOpen(false)} />
    </>
  );
};

export default UserDashboard;
