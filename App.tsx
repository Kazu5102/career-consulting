
// App.tsx - v2.26 - Global Version Visibility
import React, { useState, useEffect } from 'react';
import UserView from './views/UserView';
import AdminView from './views/AdminView';
import PasswordModal from './components/PasswordModal';
import { checkPassword } from './services/authService';
import { checkServerStatus } from './services/index';
import UserSelectionView from './views/UserSelectionView';

type AppMode = 'user' | 'admin';
type ServerStatus = 'checking' | 'ok' | 'error';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('user');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const verifyServer = async () => {
            try { 
                await checkServerStatus(); 
                setServerStatus('ok'); 
            } catch (error) { 
                setServerStatus('error'); 
            }
        };
        verifyServer();
    }, []);

    const handleUserSelect = (userId: string) => setCurrentUserId(userId);
    const handleSwitchUser = () => setCurrentUserId(null);
    const handlePasswordSubmit = (password: string): boolean => {
        if (checkPassword(password)) { 
            setMode('admin'); 
            setIsPasswordModalOpen(false); 
            return true; 
        }
        return false;
    };

    const handleSwitchMode = () => mode === 'user' ? setIsPasswordModalOpen(true) : setMode('user');

    const renderUserContent = () => {
        if (!currentUserId) return <UserSelectionView onUserSelect={handleUserSelect} />;
        return <UserView userId={currentUserId} onSwitchUser={handleSwitchUser} />;
    };

    return (
        <div className="flex flex-col min-h-[100dvh] font-sans bg-slate-100 relative overflow-x-hidden">
            <header className="bg-slate-800 text-white p-2 shadow-md z-10 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    {/* Visual Version Indicator - Visible on all screens */}
                    <div className="flex items-center gap-2">
                        <span className="bg-sky-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">System</span>
                        <span className="text-sm font-mono font-bold text-white tracking-wide">Ver 2.26</span>
                    </div>

                    <div className="flex items-center">
                        <span className="mr-4 font-bold text-sm sm:text-base">モード: {mode === 'user' ? 'ユーザー' : '管理者'}</span>
                        <button onClick={handleSwitchMode} className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md text-xs sm:text-sm transition-colors font-bold shadow-sm">切替</button>
                    </div>
                </div>
            </header>
            
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
              {serverStatus === 'ok' ? (
                  mode === 'user' ? renderUserContent() : <AdminView />
              ) : (
                  <div className="h-full flex-1 flex items-center justify-center text-slate-500 p-4 text-center">
                    {serverStatus === 'checking' ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-bold">接続確認中...</p>
                        </div>
                    ) : (
                        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100">
                            <p className="font-black text-xl">接続エラー</p>
                            <p className="text-sm mt-2">サーバーとの通信に失敗しました。再読み込みしてください。</p>
                        </div>
                    )}
                  </div>
              )}
            </div>

            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordSubmit} />
        </div>
    );
}

export default App;
