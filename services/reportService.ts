
// services/reportService.ts - v4.60 - A4 Print Optimized
import { encryptData } from './cryptoService';
import { StoredConversation, AnalysisHistoryEntry, TrajectoryAnalysisData, SkillMatchingResult } from '../types';
import { marked } from 'marked';

interface ReportData {
  userId: string;
  conversations: StoredConversation[];
  analysisHistory: AnalysisHistoryEntry[];
}

export const generateReport = async (data: ReportData, password: string): Promise<Blob> => {
  const dataString = JSON.stringify(data);
  const encryptedData = await encryptData(dataString, password);
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Career Consulting - Encrypted Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;700;900&display=swap');
        body { font-family: 'Inter', 'Noto Sans JP', sans-serif; }
        #content { display: none; }
        .prose h1, .prose h2, .prose h3 { font-weight: 900; letter-spacing: -0.025em; color: #1e293b; }
        .prose p { line-height: 1.8; color: #475569; }
        .prose strong { color: #0f172a; }
        .timeline-line { position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e2e8f0; z-index: 0; }

        /* A4 Printing Optimization */
        @media print {
            @page {
                size: A4;
                margin: 15mm 20mm;
            }
            body {
                background-color: white !important;
                color: #000 !important;
                font-size: 10.5pt;
                line-height: 1.5;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* Hide UI elements */
            #password-screen, button, .no-print, header button {
                display: none !important;
            }

            /* Content Layout */
            #content {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: none !important;
                box-shadow: none !important;
            }

            /* Styling overrides for print clarity */
            .bg-slate-50, .bg-slate-100, .bg-white {
                background-color: transparent !important;
            }
            .shadow-xl, .shadow-lg, .shadow-md, .shadow-sm, .shadow-2xl {
                box-shadow: none !important;
                border: 1px solid #e2e8f0 !important;
            }
            .rounded-2xl, .rounded-3xl, .rounded-full, .rounded-\[2\.5rem\] {
                border-radius: 4px !important;
            }
            .border-white {
                border-color: #cbd5e1 !important;
            }
            
            /* Text colors */
            .text-slate-400, .text-slate-500, .text-slate-600 {
                color: #334155 !important;
            }
            .text-slate-900, .text-slate-800 {
                color: #000 !important;
            }

            /* Pagination Controls */
            .print-break-before {
                break-before: page;
                margin-top: 20mm !important;
            }
            .print-avoid-break {
                break-inside: avoid;
            }
            
            /* Timeline adjustments */
            .timeline-line {
                border-left: 2px solid #cbd5e1;
                background: none;
            }

            /* Specific Components */
            .cover-page {
                height: 90vh; /* Adjust for print margins */
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                break-after: page;
            }
            .cover-title {
                font-size: 28pt !important;
                margin-bottom: 10mm !important;
            }
            .section-header {
                border-bottom: 2px solid #000 !important;
                padding-bottom: 5mm !important;
                margin-bottom: 10mm !important;
            }
            
            /* Links */
            a { text-decoration: none; color: #000; }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen selection:bg-sky-100">
    <div id="password-screen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-md">
        <div class="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 animate-in zoom-in duration-300">
            <div class="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 class="text-2xl font-black text-center text-slate-900 mb-2">レポート閲覧認証</h1>
            <p class="text-sm text-slate-500 text-center mb-8 font-medium">このファイルは高度に暗号化されています。<br/>設定されたパスワードを入力してください。</p>
            
            <form onsubmit="decryptAndShow(event)" class="space-y-4">
                <input type="password" id="password" placeholder="Password" required class="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-center font-bold tracking-widest text-lg">
                <button type="submit" id="submit-btn" class="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all active:scale-[0.98] uppercase tracking-widest text-sm">
                    Unlock Report
                </button>
                <div id="error" class="text-rose-500 text-xs font-bold text-center mt-4 h-4"></div>
            </form>
            <p class="mt-8 text-[10px] text-slate-300 text-center uppercase font-black tracking-[0.2em]">Protocol 3.0 Security Verified</p>
        </div>
    </div>

    <main id="content" class="max-w-6xl mx-auto p-4 md:p-12 animate-in fade-in duration-700">
        <!-- Rendered Content Will Appear Here -->
    </main>
    
    <script>
        const encryptedData = '${encryptedData}';
        
        function hexToBytes(hex) {
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < hex.length; i += 2) {
                bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
            }
            return bytes;
        }

        async function decryptData(encryptedString, password) {
            try {
                const parts = encryptedString.split(':');
                if (parts.length !== 3) throw new Error('Invalid format');
                
                const iv = hexToBytes(parts[0]);
                const salt = hexToBytes(parts[1]);
                const data = hexToBytes(parts[2]);

                const keyMaterial = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
                const key = await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
                const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
                return new TextDecoder().decode(decrypted);
            } catch (error) {
                console.error('Decryption error:', error);
                return null;
            }
        }

        async function decryptAndShow(event) {
            event.preventDefault();
            const passwordInput = document.getElementById('password');
            const errorEl = document.getElementById('error');
            const submitBtn = document.getElementById('submit-btn');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Decrypting...';
            errorEl.textContent = '';
            
            const decrypted = await decryptData(encryptedData, passwordInput.value);
            
            if (decrypted) {
                try {
                    const reportData = JSON.parse(decrypted);
                    renderReport(reportData);
                    document.getElementById('password-screen').style.display = 'none';
                    document.getElementById('content').style.display = 'block';
                } catch (e) {
                    errorEl.textContent = 'データの破損または形式が不正です。';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Unlock Report';
                }
            } else {
                errorEl.textContent = 'パスワードが正しくありません。';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Unlock Report';
            }
        }

        function renderReport(data) {
            const content = document.getElementById('content');
            const now = new Date().toLocaleDateString('ja-JP', {year:'numeric', month:'long', day:'numeric'});
            
            // --- 1. Cover Page (A4 Optimized) ---
            let html = \`
                <div class="cover-page mb-16 md:mb-24">
                    <div class="mb-8">
                        <span class="inline-block px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-full uppercase tracking-widest no-print">Confidential Report</span>
                        <div class="hidden print:block text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-2 mb-4">Confidential Career Consultation Report</div>
                    </div>
                    <h1 class="cover-title text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">相談者詳細レポート</h1>
                    <div class="text-slate-500 font-bold uppercase tracking-widest text-sm md:text-base">
                        <p class="mb-2">Client ID: <span class="font-mono text-slate-800 text-xl">\${data.userId}</span></p>
                        <p>Issued: <span class="text-slate-800">\${now}</span></p>
                    </div>
                    <div class="mt-16 p-8 border border-slate-200 rounded-2xl max-w-lg mx-auto bg-white print:border-black print:shadow-none shadow-sm">
                        <p class="text-sm text-slate-600 leading-relaxed font-medium">
                            本レポートは、AIキャリアコンサルティングシステムによる対話記録と分析結果をまとめたものです。<br/>
                            支援専門家への引継ぎ資料としてご活用ください。
                        </p>
                    </div>
                </div>
            \`;

            // Filter histories
            const trajectoryHistory = (data.analysisHistory || []).filter(h => h.type === 'trajectory').sort((a, b) => b.timestamp - a.timestamp);
            const skillHistory = (data.analysisHistory || []).filter(h => h.type === 'skillMatching').sort((a, b) => b.timestamp - a.timestamp);

            // --- 2. Trajectory History Section ---
            if (trajectoryHistory.length > 0) {
                html += '<section class="space-y-8 animate-in slide-in-from-bottom-4 duration-700 print-break-before">';
                html += '<div class="section-header flex items-center gap-3 border-b border-slate-200 pb-4 mb-8"><div class="w-1.5 h-8 bg-sky-600 rounded-full no-print"></div><h2 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">軌跡分析レポート（詳細）</h2></div>';
                html += '<div class="relative space-y-12 pl-4">';
                html += '<div class="timeline-line no-print"></div>'; // Timeline line (hidden in print via CSS override if needed, but styled to look good)
                
                trajectoryHistory.forEach(entry => {
                    const date = new Date(entry.timestamp).toLocaleDateString('ja-JP', {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
                    const d = entry.data;
                    html += \`
                    <div class="relative z-10 pl-8 print:pl-0 print-avoid-break mb-12">
                        <div class="absolute left-0 top-1 w-8 h-8 bg-sky-100 rounded-full border-4 border-white flex items-center justify-center text-sky-600 shadow-sm font-bold text-xs no-print">●</div>
                        <div class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-slate-100 print:shadow-none print:border-black print:rounded-lg">
                            <div class="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-slate-100 pb-4 print:border-black">
                                <div>
                                    <span class="text-[10px] font-black text-sky-500 uppercase tracking-widest print:text-black">Analysis Date</span>
                                    <h3 class="text-2xl font-black text-slate-800">\${date}</h3>
                                </div>
                                <div class="mt-2 md:mt-0 flex gap-2">
                                    <span class="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-widest print:border print:border-black print:bg-white">\${d.triageLevel}</span>
                                    <span class="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-widest print:border print:border-black print:bg-white">GAP: \${d.ageStageGap}%</span>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:block print:space-y-6">
                                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 print:bg-white print:border-black print:p-4 print-avoid-break">
                                    <h4 class="text-sm font-bold text-sky-800 mb-3 flex items-center gap-2 print:text-black"><span class="w-1 h-4 bg-sky-500 rounded print:bg-black"></span>主要な臨床的指摘</h4>
                                    <ul class="space-y-2">
                                        \${(d.keyTakeaways || []).map(t => \`<li class="flex gap-2 text-sm text-slate-700 print:text-black"><span class="text-sky-400 print:text-black">•</span>\${t}</li>\`).join('')}
                                    </ul>
                                </div>
                                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 print:bg-white print:border-black print:p-4 print-avoid-break">
                                    <h4 class="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2 print:text-black"><span class="w-1 h-4 bg-indigo-500 rounded print:bg-black"></span>理論的根拠</h4>
                                    <p class="text-sm text-slate-700 print:text-black">\${d.theoryBasis}</p>
                                </div>
                            </div>

                            <div class="mb-8 print-avoid-break">
                                <h4 class="text-lg font-bold text-slate-800 mb-4">内的変容プロセス (Summary)</h4>
                                <div class="prose prose-slate max-w-none text-sm print:text-black">\${marked.parse(d.overallSummary || '')}</div>
                            </div>

                            \${d.expertAdvice ? \`<div class="mb-6 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-sm text-indigo-900 print:bg-white print:border-black print:text-black print-avoid-break"><span class="block text-[10px] font-black uppercase text-indigo-400 mb-2 print:text-black">Supervisor Advice</span>\${d.expertAdvice}</div>\` : ''}
                        </div>
                    </div>\`;
                });
                html += '</div></section>';
            }

            // --- 3. Skill Matching History Section ---
            if (skillHistory.length > 0) {
                html += '<section class="space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-200 print-break-before">';
                html += '<div class="section-header flex items-center gap-3 border-b border-slate-200 pb-4 mb-8"><div class="w-1.5 h-8 bg-emerald-600 rounded-full no-print"></div><h2 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">適職診断レポート（詳細）</h2></div>';
                html += '<div class="relative space-y-12 pl-4">';
                html += '<div class="timeline-line no-print"></div>';
                
                skillHistory.forEach(entry => {
                    const date = new Date(entry.timestamp).toLocaleDateString('ja-JP', {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
                    const d = entry.data;
                    html += \`
                    <div class="relative z-10 pl-8 print:pl-0 print-avoid-break mb-12">
                        <div class="absolute left-0 top-1 w-8 h-8 bg-emerald-100 rounded-full border-4 border-white flex items-center justify-center text-emerald-600 shadow-sm font-bold text-xs no-print">●</div>
                        <div class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-slate-100 print:shadow-none print:border-black print:rounded-lg">
                            <div class="flex justify-between items-center mb-8 border-b border-slate-100 pb-4 print:border-black">
                                <div>
                                    <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest print:text-black">Analysis Date</span>
                                    <h3 class="text-2xl font-black text-slate-800">\${date}</h3>
                                </div>
                            </div>
                            
                            <div class="mb-8 print-avoid-break">
                                <h4 class="text-lg font-bold text-slate-800 mb-4">キャリアプロファイル分析</h4>
                                <div class="prose prose-slate max-w-none text-sm mb-6 print:text-black">\${marked.parse(d.analysisSummary || '')}</div>
                            </div>

                            \${d.recommendedRoles && d.recommendedRoles.length > 0 ? \`
                                <h4 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span class="w-1 h-4 bg-emerald-500 rounded print:bg-black"></span>推奨ロールと適合根拠</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 print:block print:space-y-4">
                                    \${d.recommendedRoles.map(r => \`
                                    <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors print:bg-white print:border-black print:p-4 print-avoid-break">
                                        <div class="flex justify-between items-start mb-2">
                                            <span class="font-bold text-slate-800 text-lg">\${r.role}</span>
                                            <span class="text-emerald-600 font-black text-xl print:text-black">\${r.matchScore}%</span>
                                        </div>
                                        <p class="text-xs text-slate-600 leading-relaxed print:text-black">\${r.reason}</p>
                                    </div>\`).join('')}
                                </div>
                            \` : ''}

                            \${d.skillsToDevelop && d.skillsToDevelop.length > 0 ? \`
                                <h4 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span class="w-1 h-4 bg-amber-500 rounded print:bg-black"></span>市場価値向上のための学習項目</h4>
                                <div class="space-y-3 mb-8">
                                    \${d.skillsToDevelop.map(s => \`
                                    <div class="flex items-start gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 print:bg-white print:border-black print-avoid-break">
                                        <div class="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 print:border print:border-black print:bg-white print:text-black">UP</div>
                                        <div>
                                            <p class="font-bold text-slate-800 text-sm">\${s.skill}</p>
                                            <p class="text-xs text-slate-500 mt-1 print:text-black">\${s.reason}</p>
                                        </div>
                                    </div>\`).join('')}
                                </div>
                            \` : ''}
                        </div>
                    </div>\`;
                });
                html += '</div></section>';
            }

            // --- 4. Conversation Logs ---
            if (data.conversations && data.conversations.length > 0) {
                html += \`<section class="space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-300 print-break-before">
                    <div class="section-header flex items-center gap-3 border-b border-slate-200 pb-4 mb-8"><div class="w-1.5 h-8 bg-slate-400 rounded-full no-print"></div><h2 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">全セッション履歴 (\${data.conversations.length}件)</h2></div>
                    <div class="space-y-8">
                \`;
                data.conversations.forEach(conv => {
                    const date = new Date(conv.date).toLocaleString('ja-JP', {dateStyle:'full', timeStyle:'short'});
                    html += \`<div class="bg-slate-100/50 p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-inner print:bg-white print:shadow-none print:border-black print:rounded-lg print-avoid-break">
                        <div class="flex justify-between items-start mb-6 border-b border-slate-200 pb-4 print:border-black">
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-black">Session Timeline</p>
                                <h3 class="font-black text-xl text-slate-800">\${date}</h3>
                            </div>
                            <span class="px-3 py-1 bg-white text-slate-600 text-[10px] font-black rounded-full border border-slate-200 shadow-sm uppercase tracking-tighter print:border-black print:text-black">
                            Agent: \${conv.aiName}
                            </span>
                        </div>
                        <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 prose prose-slate max-w-none print:shadow-none print:border-0 print:p-0 print:text-black">
                            <h4 class="text-sm font-black text-sky-600 uppercase tracking-widest mb-4 print:text-black">Session Summary</h4>
                            \${marked.parse(parseUserSummary(conv.summary))}
                        </div>
                    </div>\`;
                });
                html += '</div></section>';
            } else {
               html += '<div class="text-center text-slate-400 py-10 font-bold print:hidden">会話履歴はありません。</div>';
            }

            if (trajectoryHistory.length === 0 && skillHistory.length === 0 && (!data.conversations || data.conversations.length === 0)) {
                 content.innerHTML = '<div class="text-center py-20"><h3 class="text-xl font-bold text-slate-400">データが存在しません</h3></div>';
            } else {
                 content.innerHTML = html;
            }
        }

        function parseUserSummary(raw) {
            try {
                const p = JSON.parse(raw);
                return p.user_summary || raw;
            } catch(e) { return raw; }
        }
    </script>
</body>
</html>
  `;
  return new Blob([htmlContent.trim()], { type: 'text/html' });
};
