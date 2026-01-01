

import React, { useState, useEffect, useRef } from 'react';
import { StoredConversation, UserAnalysisCache } from '../types';
import { generateReport } from '../services/reportService';
import LockIcon from './icons/LockIcon';
import ShareIcon from './icons/ShareIcon';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  conversations: StoredConversation[];
  analysisCache: UserAnalysisCache | null | undefined;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({ isOpen, onClose, userId, conversations, analysisCache }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
            setIsLoading(false);
            setTimeout(() => passwordInputRef.current?.focus(), 100);
        }
    }, [isOpen]);
    
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
            const blob = await generateReport({ userId, conversations, analysisCache }, password);
            const date = new Date().toISOString().split('T')[0];
            const suggestedName = `report_${userId}_${date}.html`;

            // Proposal 1: Unify to a single, stable download method to prevent crashes.
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = suggestedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ShareIcon /> レポートの共有</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <form onSubmit={handleGenerate}>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-600">
                            相談者 (<span className="font-semibold font-mono">{userId}</span>) のレポートをパスワードで暗号化して、単一のHTMLファイルとしてエクスポートします。
                        </p>
                        <div>
                            <label htmlFor="report-password" className="block text-sm font-bold text-slate-700 mb-1">暗号化パスワード</label>
                            <input
                                ref={passwordInputRef}
                                id="report-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                                required
                            />
                        </div>
                         <div>
                            <label htmlFor="report-confirm-password" className="block text-sm font-bold text-slate-700 mb-1">パスワード (確認用)</label>
                            <input
                                id="report-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
                    </div>

                    <footer className="p-5 bg-slate-50 border-t border-slate-200 mt-auto">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors duration-200 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>生成中...</span>
                                </>
                            ) : (
                                <>
                                    <LockIcon />
                                    生成してダウンロード
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