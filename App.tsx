
// App.tsx - v2.08 - Interaction Psychological Analysis Integrated
import React, { useState, useEffect } from 'react';
import UserView from './views/UserView';
import AdminView from './views/AdminView';
import PasswordModal from './components/PasswordModal';
import { checkPassword } from './services/authService';
import { checkServerStatus } from './services/index';
import UserSelectionView from './views/UserSelectionView';
import * as devLogService from './services/devLogService';


type AppMode = 'user' | 'admin';
type ServerStatus = 'checking' | 'ok' | 'error';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('user');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const userPrompt = "操作履歴（迷い）の心理学的分析をキャリアコンサルティングに統合（案1：pro_notes強化）。";
        const aiSummary = "戻る・やり直し回数をGemini 3 Proが解析し、コンサルタント向けの高度な心理状態仮説を生成するロジックを実装。Ver2.08。";
        
        const logs = devLogService.getLogs();
        const lastEntry = logs.entries[logs.entries.length - 1];
        if (!lastEntry || lastEntry.userPrompt !== userPrompt) {
             devLogService.addLogEntry({
                userPrompt,
                aiSummary
             });
        }
    }, []);

    useEffect(() => {
        const verifyServer = async () => {
            try { await checkServerStatus(); setServerStatus('ok'); } catch (error) { setServerStatus('error'); }
        };
        verifyServer();
    }, []);

    const handleUserSelect = (userId: string) => setCurrentUserId(userId);
    const handleSwitchUser = () => setCurrentUserId(null);
    const handlePasswordSubmit = (password: string): boolean => {
        if (checkPassword(password)) { setMode('admin'); setIsPasswordModalOpen(false); return true; }
        return false;
    };

    const handleSwitchMode = () => mode === 'user' ? setIsPasswordModalOpen(true) : setMode('user');

    const renderUserContent = () => {
        if (!currentUserId) return <UserSelectionView onUserSelect={handleUserSelect} />;
        return <UserView userId={currentUserId} onSwitchUser={handleSwitchUser} />;
    };

    return (
        <div className="flex flex-col min-h-[100dvh] font-sans bg-slate-100 relative overflow-x-hidden">
            <header className="bg-slate-800 text-white p-2 text-center shadow-md z-10 sticky top-0">
                <div className="flex justify-center items-center">
                    <span className="mr-4 font-bold text-sm sm:text-base">モード: {mode === 'user' ? 'ユーザー' : '管理者'}</span>
                    <button onClick={handleSwitchMode} className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md text-xs sm:text-sm transition-colors">切替</button>
                </div>
            </header>
            
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
              {serverStatus === 'ok' ? (
                  mode === 'user' ? renderUserContent() : <AdminView />
              ) : (
                  <div className="h-full flex-1 flex items-center justify-center text-slate-500 p-4 text-center">
                    {serverStatus === 'checking' ? <p>接続中...</p> : <p>接続エラー</p>}
                  </div>
              )}
            </div>

            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordSubmit} />
            <div className="fixed bottom-1 right-2 z-[90] pointer-events-none opacity-50">
                <span className="text-[10px] text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">Ver2.08</span>
            </div>
        </div>
    );
}

export default App;
