
// App.tsx - v5.78 - 2026-05-06 - True Resiliency (Model Alignment)
import React, { useState, useEffect, useCallback } from 'react';
import UserView from './views/UserView';
import AdminView from './views/AdminView';
import PasswordModal from './components/PasswordModal';
import LegalConsentModal from './components/LegalConsentModal';
import { checkPassword } from './services/authService';
import { checkServerStatus, useMockService } from './services/index';
import UserSelectionView from './views/UserSelectionView';
import { APP_VERSION, STORAGE_KEYS } from './constants';

type AppMode = 'user' | 'admin';
type ServerStatus = 'checking' | 'ok' | 'error';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('user');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isFallbackMode, setIsFallbackMode] = useState(false);

    useEffect(() => {
        const verifyServer = async () => {
            try { 
                await checkServerStatus(); 
                setServerStatus('ok'); 
            } catch (error) { 
                console.error("Server connection failed, falling back to mock mode.", error);
                useMockService(); // Fallback to mock service
                setIsFallbackMode(true);
                setServerStatus('ok'); // Allow app to proceed
            }
        };
        verifyServer();

        // Protocol 3.0: Strict version-based consent check
        const hasConsented = localStorage.getItem(STORAGE_KEYS.CONSENT);
        if (!hasConsented) {
            setIsLegalModalOpen(true);
        }
    }, []);

    const handleLegalConfirm = useCallback(() => {
        localStorage.setItem(STORAGE_KEYS.CONSENT, 'true');
        setIsLegalModalOpen(false);
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

    const handleSwitchMode = () => {
        if (mode === 'user') {
            setIsPasswordModalOpen(true);
        } else {
            setMode('user');
            setCurrentUserId(null);
        }
    };

    const renderMainContent = () => {
        if (serverStatus === 'checking') {
            return (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Initializing Architecture...</p>
                </div>
            );
        }

        if (mode === 'admin') {
            return <AdminView />;
        }

        if (!currentUserId) {
            return <UserSelectionView onUserSelect={handleUserSelect} />;
        }

        return <UserView userId={currentUserId} onSwitchUser={handleSwitchUser} />;
    };

    const showProtocolDetail = () => {
        const baseMsg = `【Secure AI Architecture v${APP_VERSION}】\n\n1. 特許等に基づく独自のAI連携プロトコル\n2. 入力ゆらぎ（打鍵間隔）による内省状態の自動推定\n3. 揮発性メモリ管理によるゼロトラスト・データ設計\n4. AES-GCM暗号化（自己完結型HTML）による専門家連携\n5. 厚労省ガイドライン準拠の秘匿性管理`;
        const extraMsg = isFallbackMode ? "\n\n⚠️ Debug Mode: AI応答はシミュレーションが優先されます。" : "";
        alert(baseMsg + extraMsg);
    };

    return (
        <div className="flex flex-col min-h-[100dvh] font-sans bg-slate-100 relative overflow-x-hidden">
            <header className={`text-white p-2 shadow-lg z-10 sticky top-0 border-b border-white/10 transition-colors duration-500 ${isFallbackMode ? 'bg-slate-800' : 'bg-slate-900'}`}>
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={showProtocolDetail}
                                    className={`${isFallbackMode ? 'bg-amber-500 hover:bg-amber-400' : 'bg-sky-500 hover:bg-sky-400'} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm transition-colors flex items-center gap-1 normal-case`}
                                >
                                    <span>{isFallbackMode ? 'Demo Mode' : 'Secured Arch 3.0'}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                <span className="text-[10px] font-sans font-bold text-slate-400 tracking-wider">Ver {APP_VERSION}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline font-bold text-xs text-slate-300">Mode: {mode === 'user' ? 'Client' : 'Administrator'}</span>
                        <button 
                            onClick={handleSwitchMode} 
                            className={`px-4 py-1.5 rounded-full text-xs transition-all font-bold tracking-wide shadow-lg normal-case ${
                                mode === 'user' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                            }`}
                        >
                            {mode === 'user' ? 'Switch Admin' : 'Exit Admin'}
                        </button>
                    </div>
                </div>
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-center overflow-auto p-4">
              {renderMainContent()}
            </main>

            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordSubmit} />
            <LegalConsentModal isOpen={isLegalModalOpen} onConfirm={handleLegalConfirm} />
        </div>
    );
}

export default App;
