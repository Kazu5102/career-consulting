
// components/ShareReportModal.tsx - v4.41 - Enhanced Report with History
import React, { useState, useEffect, useRef } from 'react';
import { StoredConversation, AnalysisHistoryEntry } from '../types';
import { generateReport } from '../services/reportService';
import { getAnalysisHistory } from '../services/analysisService';
import { addLogEntry } from '../services/devLogService';
import LockIcon from './icons/LockIcon';
import FileTextIcon from './icons/FileTextIcon';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  conversations: StoredConversation[];
  // analysisCache is no longer used, we fetch history internally
  analysisCache: any | null | undefined;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({ isOpen, onClose, userId, conversations }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [historyCount, setHistoryCount] = useState({ trajectory: 0, skill: 0 });
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
            setIsLoading(false);
            setTimeout(() => passwordInputRef.current?.focus(), 100);
            
            // Preview history count
            const history = getAnalysisHistory(userId);
            setHistoryCount({
                trajectory: history.filter(h => h.type === 'trajectory').length,
                skill: history.filter(h => h.type === 'skillMatching').length
            });
        }
    }, [isOpen, userId]);
    
    if (!isOpen) return null;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 4) {
            setError('パスワードは4文字以上で設定してください。');
            return;
        }
        if (password !== confirmPassword) {
            setError('パスワードが一致しません。');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            // Fetch fresh history at generation time
            const history = getAnalysisHistory(userId);
            
            const blob = await generateReport({ userId, conversations, analysisHistory: history }, password);
            const date = new Date().toISOString().split('T')[0];
            const suggestedName = `report_${userId}_${date}.html`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = suggestedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addLogEntry({
                type: 'audit',
                level: 'info',
                action: 'Report Generated',
                details: `Encrypted report for user ${userId}. Included history: Trajectory(${history.filter(h => h.type==='trajectory').length}), Skill(${history.filter(h => h.type==='skillMatching').length}).`
            });

            onClose();
        } catch (err) {
            console.error("Failed to generate and save report:", err);
            const message = err instanceof Error ? err.message : '不明なエラーです。';
            setError(`レポートの生成または保存に失敗しました: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 z-[300] flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in zoom-in duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-xl">
                            <FileTextIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">レポートの暗号化出力</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <form onSubmit={handleGenerate}>
                    <div className="p-8 space-y-6">
                        <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
                            <p className="text-xs text-sky-800 font-bold leading-relaxed">
                                相談者 (<span className="font-mono">{userId}</span>) の履歴を暗号化HTMLとして出力します。
                                <br/>
                                <span className="block mt-2 opacity-80 border-t border-sky-200 pt-2">
                                    ・会話履歴: {conversations.length}件<br/>
                                    ・軌跡分析履歴: {historyCount.trajectory}件<br/>
                                    ・適職診断履歴: {historyCount.skill}件
                                </span>
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="report-password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">暗号化パスワード</label>
                                <input
                                    ref={passwordInputRef}
                                    id="report-password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="パスワードを入力"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all text-sm font-bold tracking-widest"
                                    required
                                />
                            </div>
                             <div>
                                <label htmlFor="report-confirm-password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">パスワード (確認用)</label>
                                <input
                                    id="report-confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="もう一度入力"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all text-sm font-bold tracking-widest"
                                    required
                                />
                            </div>
                        </div>
                        {error && <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}
                    </div>

                    <footer className="p-8 bg-slate-50 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:bg-slate-300"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="uppercase tracking-widest text-xs">Generating...</span>
                                </>
                            ) : (
                                <>
                                    <LockIcon className="w-5 h-5" />
                                    <span className="uppercase tracking-widest text-xs">Generate Report HTML</span>
                                </>
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ShareReportModal;
