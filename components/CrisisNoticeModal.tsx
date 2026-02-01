
// components/CrisisNoticeModal.tsx - v4.35 - Mobile Scroll & Text Fix
import React, { useEffect } from 'react';
import { addLogEntry } from '../services/devLogService';

interface CrisisNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  intensity?: 'normal' | 'high'; // ネガティブワードの連発度合いに応じたメッセージ切り替え
}

const CrisisNoticeModal: React.FC<CrisisNoticeModalProps> = ({ isOpen, onClose, intensity = 'normal' }) => {
  useEffect(() => {
    if (isOpen) {
      addLogEntry({
        type: 'audit',
        level: 'warn',
        action: 'Emergency Intervention Triggered',
        details: 'Crisis keywords detected. Modal displayed. No user content saved.'
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[300] overflow-y-auto backdrop-blur-xl" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-500 border border-white/20" onClick={e => e.stopPropagation()}>
          {/* 背景にグラデーションを配置して視覚的な柔らかさを演出 */}
          <div className="bg-gradient-to-br from-rose-500 to-amber-500 p-8 text-center text-white">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/20 mb-6 shadow-lg backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
              </div>
              <h2 className="text-3xl font-black tracking-tight">大切に思っている、あなたへ</h2>
              <p className="mt-2 text-rose-50 font-bold opacity-90 uppercase tracking-widest text-xs">Emergency Compassion Support</p>
          </div>
          
          <div className="p-8 sm:p-10 space-y-8">
              {/* テキストを左寄せしつつ、ブロック全体を中央に配置 */}
              <div className="flex justify-center w-full">
                  <div className="text-slate-700 leading-relaxed font-bold text-left inline-block space-y-4 max-w-full">
                      {intensity === 'high' ? (
                        <p className="text-lg">
                          何度もそのお言葉が出るほど、今は本当にお辛い状況なのですね。<br/>
                          あなたの命と心が、私にとっては何より大切です。
                        </p>
                      ) : (
                        <p>
                          今、とてもお辛い状況にいらっしゃるのですね。<br/>
                          一人で抱え込むには、あまりに重いお悩みだったのでしょう。<br/>
                          専門の相談員が、あなたの力になりたいと待っています。
                        </p>
                      )}
                  </div>
              </div>
              
              <div className="space-y-4">
                  <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 shadow-sm">
                      <h3 className="text-xs font-black text-rose-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          今すぐ、声を聞かせてください
                      </h3>
                      <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div className="text-center sm:text-left">
                                  <p className="font-black text-slate-800 text-lg">よりそいホットライン</p>
                                  <p className="text-xs text-slate-500 font-bold">24時間対応・年中無休</p>
                              </div>
                              <a href="tel:0120279338" className="w-full sm:w-auto px-8 py-3 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 text-center">
                                  0120-279-338
                              </a>
                          </div>
                          <div className="border-t border-rose-200/50 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div className="text-center sm:text-left">
                                  <p className="font-black text-slate-800 text-lg">いのちの電話</p>
                                  <p className="text-xs text-slate-500 font-bold">フリーダイヤル</p>
                              </div>
                              <a href="tel:0120783556" className="w-full sm:w-auto px-8 py-3 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 text-center">
                                  0120-783-556
                              </a>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 bg-sky-50 rounded-[2rem] border border-sky-100 shadow-sm">
                      <h3 className="text-xs font-black text-sky-600 mb-4 uppercase tracking-widest">文字で相談したいとき</h3>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                          <p className="text-sm font-black text-slate-800">生きづらびっと（LINE相談）</p>
                          <a href="https://yorisoi-chat.jp/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-3 bg-sky-600 text-white font-black rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all active:scale-95 text-center">
                              LINEで相談
                          </a>
                      </div>
                  </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                      「あなたのことを大切に思っている人が、必ずここにいます」
                  </p>
              </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row gap-4">
              <button
                onClick={onClose}
                className="w-full px-6 py-4 font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
              >
                相談を続ける
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-4 font-black text-rose-600 bg-rose-100/50 border border-rose-200 hover:bg-rose-100 rounded-2xl transition-all active:scale-95"
              >
                対話をリセットする
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisNoticeModal;
