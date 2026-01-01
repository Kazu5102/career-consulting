
import React, { useState, useEffect } from 'react';
import { StoredConversation, AnalysisData, AnalysisStateItem } from '../types';
import { analyzeConversations } from '../services/index';
import AnalyticsIcon from '../components/icons/AnalyticsIcon';
import AnalysisDisplay from '../components/AnalysisDisplay';

interface Props {
  conversations: StoredConversation[];
}

const loadingMessages = [
    'AIが総合分析を開始しました...',
    '全相談データを読み込んでいます...',
    '全体の傾向を抽出中です。これには数分かかる場合があります。',
    'インサイトをまとめています...',
    'レポートを生成しています。もうしばらくお待ちください。'
];

const AnalysisDashboard: React.FC<Props> = ({ conversations }) => {
  const [analysisState, setAnalysisState] = useState<AnalysisStateItem<AnalysisData>>({ status: 'idle', data: null, error: null });
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    if (analysisState.status === 'loading') {
        let messageIndex = 0;
        interval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 4000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [analysisState.status]);


  const handleRunAnalysis = async () => {
    if (conversations.length < 2) {
      alert("分析には少なくとも2件の相談履歴が必要です。");
      return;
    }
    setAnalysisState({ status: 'loading', data: null, error: null });
    setLoadingMessage(loadingMessages[0]);
    try {
      const result = await analyzeConversations(conversations);
      setAnalysisState({ status: 'success', data: result, error: null });
    } catch (err) {
      console.error("Failed to generate analysis:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setAnalysisState({ status: 'error', data: null, error: `分析中にエラーが発生しました: ${errorMessage}` });
    }
  };

  const { status, data, error } = analysisState;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800">総合分析レポート</h2>
        <button
            onClick={handleRunAnalysis}
            disabled={status === 'loading' || conversations.length < 2}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
            <AnalyticsIcon />
            {status === 'loading' ? '分析中...' : '総合分析を実行'}
        </button>
      </div>
      <div className="flex-1 bg-slate-50 rounded-lg p-6 overflow-y-auto">
          {status === 'loading' && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                  <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-semibold">{loadingMessage}</p>
              </div>
          )}
          {status === 'error' && error && (
              <div className="flex flex-col items-center justify-center h-full text-center text-red-500 bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">分析エラー</h3>
                  <p className="mt-1">{error}</p>
              </div>
          )}
          {status === 'success' && data && (
              <AnalysisDisplay comprehensiveState={analysisState} />
          )}
          {status === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <AnalyticsIcon className="w-12 h-12 text-slate-400 mb-4" />
                  <h3 className="font-semibold text-lg">全体の傾向を分析します</h3>
                  <p className="mt-1">相談履歴が2件以上になると、<br />全体の傾向や共通の課題を分析できます。</p>
                  <p className="mt-2 text-sm">現在の相談履歴: {conversations.length}件</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default AnalysisDashboard;