import React, { useState } from 'react';
import { extractDataFromReport } from '../services/reportService';
import * as userService from '../services/userService';
import * as conversationService from '../services/conversationService';
import * as analysisService from '../services/analysisService';

interface RestoreReportModalProps {
    isOpen: boolean;
    file: File | null;
    onClose: () => void;
    onSuccess: (userId: string) => void;
}

const RestoreReportModal: React.FC<RestoreReportModalProps> = ({ isOpen, file, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    if (!isOpen || !file) return null;

    const handleRestore = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsRestoring(true);

        try {
            const text = await file.text();
            const data = await extractDataFromReport(text, password);

            if (!data) {
                setError('パスワードが間違っているか、ファイルが破損しています。');
                setIsRestoring(false);
                return;
            }

            // 復元処理
            const newUserId = `user_${Date.now()}`; // 新しいIDを割り当てる
            
            // ユーザー作成
            const users = await userService.getUsers();
            const existingNicknames = users.map(u => u.nickname);
            const newUser = {
                id: newUserId,
                nickname: userService.generateNickname(existingNicknames) + ' (復元)',
                pin: userService.generatePin()
            };
            await userService.saveUsers([...users, newUser]);

            // 会話履歴の復元 (userIdを書き換え)
            const restoredConvs = data.conversations.map(c => ({ ...c, userId: newUserId }));
            const currentConvs = await conversationService.getAllConversations();
            await conversationService.replaceAllConversations([...currentConvs, ...restoredConvs]);

            // 分析履歴の復元 (userIdを書き換え)
            const restoredAnalysis = data.analysisHistory.map(a => ({ ...a, userId: newUserId }));
            const currentAnalysis = await analysisService.getAllAnalysisHistory();
            await analysisService.restoreAnalysisHistory([...currentAnalysis, ...restoredAnalysis]);

            onSuccess(newUserId);
        } catch (err) {
            console.error(err);
            setError('復元中にエラーが発生しました。');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">レポートから復元</h2>
                    <p className="text-sm text-slate-600 mb-6">
                        選択したファイル: <span className="font-semibold">{file.name}</span><br/>
                        レポート作成時に設定したパスワードを入力してください。
                    </p>

                    <form onSubmit={handleRestore} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="パスワード"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                                required
                                autoFocus
                            />
                        </div>
                        
                        {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isRestoring}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={isRestoring || !password}
                                className="flex-1 px-4 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                            >
                                {isRestoring ? '復元中...' : '復元して再開'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RestoreReportModal;
