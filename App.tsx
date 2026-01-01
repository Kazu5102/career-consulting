
// App.tsx - v2.0 - Forcing redeployment to clear stubborn cache.
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

    // This useEffect runs once when the component mounts after file updates.
    // It logs the interaction that LED to this code change, creating an "automated" log.
    useEffect(() => {
        const userPrompt = "初期質問フローの全体設計（ステップ1〜4）をチャット完全統合型で実装してください。";
        const aiSummary = "キャリア発達段階に基づいた構造化された初期質問フローを実装。ステップごとに動的なラベル変換（成長期なら『男の子・女の子』等）と主訴の出し分けを行い、収集したデータをAIのシステムプロンプトに最適化して統合しました。Ver1.94。";
        
        // Ensure we don't log the same thing multiple times on hot reloads
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
            try {
                await checkServerStatus();
                setServerStatus('ok');
            } catch (error) {
                console.error("Server health check failed:", error);
                setServerStatus('error');
            }
        };
        verifyServer();
        
    }, []);

    const handleUserSelect = (userId: string) => {
        setCurrentUserId(userId);
    };

    const handleSwitchUser = () => {
        setCurrentUserId(null);
    };

    const handleSwitchToAdmin = () => {
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = (password: string): boolean => {
        if (checkPassword(password)) {
            setMode('admin');
            setIsPasswordModalOpen(false);
            return true;
        }
        return false;
    };

    const handleSwitchMode = () => {
        if (mode === 'user') {
            handleSwitchToAdmin();
        } else {
            setMode('user');
        }
    };

    const ServerStatusBanner: React.FC = () => {
        if (serverStatus === 'ok') return null;

        const message = serverStatus === 'checking' 
            ? 'バックエンドサーバーの接続を確認中...'
            : 'サーバー通信エラー: プレビュー環境がサーバー機能に未対応か、設定に問題がある可能性があります。';
        
        const bgColor = serverStatus === 'checking' ? 'bg-blue-600' : 'bg-red-600';

        return (
            <div className={`w-full p-2 text-center text-white text-sm font-semibold ${bgColor}`}>
                {message}
            </div>
        );
    };
    
    const renderUserContent = () => {
        if (!currentUserId) {
            return <UserSelectionView onUserSelect={handleUserSelect} />;
        }
        return <UserView userId={currentUserId} onSwitchUser={handleSwitchUser} />;
    };

    return (
        <div className="flex flex-col min-h-screen font-sans bg-slate-100 relative">
            <header className="relative bg-slate-800 text-white p-2 text-center shadow-md z-10 sticky top-0">
                <div className="flex justify-center items-center">
                    <span className="mr-4 font-bold">表示モード: {mode === 'user' ? 'ユーザー画面 (AIキャリア相談)' : '管理者画面'}</span>
                    <button
                        onClick={handleSwitchMode}
                        className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md text-sm transition-colors"
                    >
                        {mode === 'user' ? '管理者画面へ' : 'ユーザー画面へ'}
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">（これはデモ用の表示切り替え機能です）</p>
            </header>
            
            <ServerStatusBanner />

            <div className="flex-1 flex flex-col items-center justify-center">
              {serverStatus === 'ok' ? (
                  mode === 'user' ? renderUserContent() : <AdminView />
              ) : (
                  <div className="h-full flex-1 flex items-center justify-center text-slate-500 p-4 text-center">
                    {serverStatus === 'checking' && <p>サーバー接続待機中...</p>}
                    {serverStatus === 'error' && (
                        <div>
                            <h2 className="text-xl font-bold text-red-500 mb-2">表示エラー</h2>
                            <p>アプリケーションの表示に必要なサーバー機能との通信に失敗しました。<br/>
                            「考え中」で停止する問題を防ぐため、コンテンツの表示を中断しています。</p>
                        </div>
                    )}
                  </div>
              )}
            </div>

            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
            />

            {/* Version Badge fixed at bottom-right */}
            <div className="fixed bottom-1 right-2 z-50 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                    Ver1.94
                </span>
            </div>
        </div>
    );
}

export default App;
