
// App.tsx - v4.10 - Version Sync
import React, { useState, useEffect } from 'react';
import UserView from './views/UserView';
import AdminView from './views/AdminView';
import PasswordModal from './components/PasswordModal';
import LegalConsentModal from './components/LegalConsentModal';
import { checkPassword } from './services/authService';
import { checkServerStatus, useMockService } from './services/index';
import UserSelectionView from './views/UserSelectionView';

type AppMode = 'user' | 'admin';
type ServerStatus = 'checking' | 'ok' | 'error';

const VERSION = "4.10";
const CONSENT_KEY = `legal_consent_v${VERSION}`;

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

        // Protocol 2.0: Strict version-based consent check
        const hasConsented = localStorage.getItem(CONSENT_KEY);
        if (!hasConsented) {
            setIsLegalModalOpen(true);
        }
    }, []);

    const handleLegalConfirm = () => {
        localStorage.setItem(CONSENT_KEY, 'true');
        setIsLegalModalOpen(false);
    };

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

    const showProtocolDetail = () => {
        const baseMsg = `【Protocol 2.0 Verified (v${VERSION})】\n\n1. 厚生労働省「キャリアコンサルティング倫理綱領」準拠\n2. AI利活用ガイドラインに基づく「人間中心の設計」\n3. ハルシネーション抑制アルゴリズムの採用\n4. データ学習利用の拒否（オプトアウト）設定済\n5. 暗号化通信およびAES-GCMレポート出力`;
        const extraMsg = isFallbackMode ? "\n\n⚠️ 現在、オフライン/デモモードで動作しています。AI応答はシミュレーションです。" : "";
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
                                    <span>{isFallbackMode ? 'Demo Mode' : 'Protocol 2.0 Verified'}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                <span className="text-[10px] font-sans font-bold text-slate-400 tracking-wider">Ver {VERSION}</span>
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
            
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
              {serverStatus === 'ok' ? (
                  mode === 'user' ? renderUserContent() : <AdminView />
              ) : (
                  <div className="h-full flex-1 flex items-center justify-center text-slate-500 p-4 text-center">
                    {serverStatus === 'checking' ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-black text-slate-800 uppercase tracking-widest text-xs">System Verifying...</p>
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-rose-100 max-w-sm">
                            {/* Fallback code handled in useEffect, this block is theoretically unreachable now unless fallback fails */}
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <p className="font-black text-xl text-slate-900 mb-2">System Critical Error</p>
                            <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all">Reload</button>
                        </div>
                    )}
                  </div>
              )}
            </div>

            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordSubmit} />
            <LegalConsentModal isOpen={isLegalModalOpen} onConfirm={handleLegalConfirm} />
        </div>
    );
}

export default App;
