
// views/UserSelectionView.tsx - v4.80 - In-Memory Restore
import React, { useState, useEffect, useRef } from 'react';
import { StoredConversation, UserInfo } from '../types';
import * as userService from '../services/userService';
import * as conversationService from '../services/conversationService';
import UserIcon from '../components/icons/UserIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PinModal from '../components/PinModal';
import NewUserInfoModal from '../components/NewUserInfoModal';
import RestoreReportModal from '../components/RestoreReportModal';

interface DisplayUser extends UserInfo {
  count: number;
  lastDate: string | null;
}

interface UserSelectionViewProps {
  onUserSelect: (userId: string) => void;
}

const UserSelectionView: React.FC<UserSelectionViewProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [newUser, setNewUser] = useState<UserInfo | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUsers = async () => {
        const userInfos = await userService.getUsers();
        const conversations = await conversationService.getAllConversations();

        const convsByUserId = conversations.reduce<Record<string, StoredConversation[]>>((acc, conv) => {
            if (!conv.userId) return acc;
            if (!acc[conv.userId]) acc[conv.userId] = [];
            acc[conv.userId].push(conv);
            return acc;
        }, {});
        
        Object.values(convsByUserId).forEach(userConvs => {
            userConvs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        
        const displayUsers = userInfos.map(userInfo => {
          const userConvs = convsByUserId[userInfo.id] || [];
          return {
            ...userInfo,
            count: userConvs.length,
            lastDate: userConvs.length > 0 ? userConvs[0].date : null,
          };
        }).sort((a, b) => {
            if (!a.lastDate) return 1;
            if (!b.lastDate) return -1;
            return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
        });

        setUsers(displayUsers);
    };
    loadUsers();
  }, [isRestoreModalOpen]); // Reload users after restore

  const handleCreateNewUser = async () => {
    const newUserInfo = await userService.addNewUser();
    setNewUser(newUserInfo);
    setIsNewUserModalOpen(true);
  };

  const handleNewUserConfirm = () => {
    if (newUser) {
      setIsNewUserModalOpen(false);
      onUserSelect(newUser.id);
    }
  };
  
  const handleUserClick = (user: UserInfo) => {
    setSelectedUser(user);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = (userId: string) => {
    setIsPinModalOpen(false);
    onUserSelect(userId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setSelectedFile(file);
          setIsRestoreModalOpen(true);
      }
      // Reset input
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleRestoreSuccess = (userId: string) => {
      setIsRestoreModalOpen(false);
      setSelectedFile(null);
      // 復元直後はPINなしでログインさせる
      onUserSelect(userId);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '相談履歴なし';
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 my-8">
        <header className="text-center pb-6"><h1 className="text-2xl font-bold text-slate-800">相談者の選択</h1><p className="mt-2 text-slate-600">あなたのニックネームを選んでください。</p></header>
        
        {/* Zero Trust Notice */}
        <div className="mb-6 p-4 bg-sky-50 border border-sky-100 rounded-xl text-sm text-sky-800">
            <p className="font-bold flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                完全揮発性メモリ動作中
            </p>
            <p>データはブラウザのメモリ上でのみ処理されます。画面を閉じるとデータは完全に消去されます。過去の続きを行いたい場合は、ダウンロードしたレポートを読み込んでください。</p>
        </div>

        <div className="space-y-3">
          {users.length > 0 && (
              <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                  {users.map(user => (
                    <button key={user.id} onClick={() => handleUserClick(user)} className="w-full flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-sky-100 border border-slate-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white"><UserIcon /></div><div className="flex-1 text-left overflow-hidden"><p className="font-bold text-slate-800 truncate" title={user.nickname}>{user.nickname}</p><p className="text-sm text-slate-500">{user.count}件の相談 | 最終: {formatDate(user.lastDate)}</p></div></button>
                  ))}
              </div>
          )}
          <div className="pt-4 border-t border-slate-200 space-y-3">
              <button onClick={handleCreateNewUser} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-all duration-200"><PlusCircleIcon />新しい相談者として始める</button>
              
              <div className="relative">
                  <input type="file" accept=".html" onChange={handleFileChange} className="hidden" id="report-upload" ref={fileInputRef} />
                  <label htmlFor="report-upload" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-200 transition-all duration-200 cursor-pointer border border-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      過去のレポートから復元する
                  </label>
              </div>
          </div>
        </div>
      </div>
      {selectedUser && <PinModal isOpen={isPinModalOpen} user={selectedUser} onClose={() => setIsPinModalOpen(false)} onSuccess={handlePinSuccess} />}
      {newUser && <NewUserInfoModal isOpen={isNewUserModalOpen} user={newUser} onConfirm={handleNewUserConfirm} />}
      <RestoreReportModal isOpen={isRestoreModalOpen} file={selectedFile} onClose={() => setIsRestoreModalOpen(false)} onSuccess={handleRestoreSuccess} />
    </>
  );
};

export default UserSelectionView;
