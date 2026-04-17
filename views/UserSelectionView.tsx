
// views/UserSelectionView.tsx - v4.20 - Future-proofed Async Refactor
import React, { useState, useEffect } from 'react';
import { StoredConversation, UserInfo } from '../types';
import * as userService from '../services/userService';
import * as conversationService from '../services/conversationService';
import UserIcon from '../components/icons/UserIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PinModal from '../components/PinModal';
import NewUserInfoModal from '../components/NewUserInfoModal';

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
  }, []);

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
        <div className="space-y-3">
          {users.length > 0 && (
              <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                  {users.map(user => (
                    <button key={user.id} onClick={() => handleUserClick(user)} className="w-full flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-sky-100 border border-slate-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"><div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white"><UserIcon /></div><div className="flex-1 text-left overflow-hidden"><p className="font-bold text-slate-800 truncate" title={user.nickname}>{user.nickname}</p><p className="text-sm text-slate-500">{user.count}件の相談 | 最終: {formatDate(user.lastDate)}</p></div></button>
                  ))}
              </div>
          )}
          <div className="pt-4 border-t border-slate-200"><button onClick={handleCreateNewUser} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 transition-all duration-200"><PlusCircleIcon />新しい相談者として始める</button></div>
        </div>
      </div>
      {selectedUser && <PinModal isOpen={isPinModalOpen} user={selectedUser} onClose={() => setIsPinModalOpen(false)} onSuccess={handlePinSuccess} />}
      {newUser && <NewUserInfoModal isOpen={isNewUserModalOpen} user={newUser} onConfirm={handleNewUserConfirm} />}
    </>
  );
};

export default UserSelectionView;
