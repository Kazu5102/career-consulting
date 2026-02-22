
// services/reportService.ts - v4.42 - Full Detail Report
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
        .prose h1, .prose h2, .prose h3 { font-weight: 900; tracking: -0.025em; color: #1e293b; }
        .prose p { line-height: 1.8; color: #475569; }
        .prose strong { color: #0f172a; }
        .timeline-line { position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e2e8f0; z-index: 0; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">
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
            <p class="mt-8 text-[10px] text-slate-300 text-center uppercase font-black tracking-[0.2em]">Protocol 2.0 Security Verified</p>
        </div>
    </div>

    <main id="content" class="max-w-6xl mx-auto p-4 md:p-12 animate-in fade-in duration-700">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-200 mb-12">
            <div>
                <span class="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">Consultation Record</span>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight">相談者詳細レポート</h1>
                <p class="text-slate-400 mt-2 font-bold uppercase tracking-tighter text-sm">Client ID: <span id="user-id" class="font-mono text-slate-600"></span></p>
            </div>
            <div class="text-right">
                <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Report Generated At</p>
                <p id="generated-date" class="font-bold text-slate-500"></p>
            </div>
        </header>

        <div id="report-body" class="space-y-16"></div>
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
            document.getElementById('user-id').textContent = data.userId;
            document.getElementById('generated-date').textContent = new Date().toLocaleDateString('ja-JP', {year:'numeric', month:'long', day:'numeric'});
            const reportBody = document.getElementById('report-body');
            let html = '';

            // Filter histories
            const trajectoryHistory = (data.analysisHistory || []).filter(h => h.type === 'trajectory').sort((a, b) => b.timestamp - a.timestamp);
            const skillHistory = (data.analysisHistory || []).filter(h => h.type === 'skillMatching').sort((a, b) => b.timestamp - a.timestamp);

            // 1. Trajectory History Section
            if (trajectoryHistory.length > 0) {
                html += '<section class="space-y-8 animate-in slide-in-from-bottom-4 duration-700">';
                html += '<div class="flex items-center gap-3"><div class="w-1.5 h-8 bg-sky-600 rounded-full"></div><h2 class="text-3xl font-black text-slate-900 tracking-tight">軌跡分析レポート（詳細）</h2></div>';
                html += '<div class="relative space-y-16 pl-4">';
                html += '<div class="timeline-line"></div>'; // Timeline line
                
                trajectoryHistory.forEach(entry => {
                    const date = new Date(entry.timestamp).toLocaleDateString('ja-JP', {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
                    const d = entry.data;
                    html += \`
                    <div class="relative z-10 pl-8">
                        <div class="absolute left-0 top-1 w-8 h-8 bg-sky-100 rounded-full border-4 border-white flex items-center justify-center text-sky-600 shadow-sm font-bold text-xs">●</div>
                        <div class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-slate-100">
                            <div class="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-slate-100 pb-4">
                                <div>
                                    <span class="text-[10px] font-black text-sky-500 uppercase tracking-widest">Analysis Date</span>
                                    <h3 class="text-2xl font-black text-slate-800">\${date}</h3>
                                </div>
                                <div class="mt-2 md:mt-0 flex gap-2">
                                    <span class="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-widest">\${d.triageLevel}</span>
                                    <span class="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-widest">GAP: \${d.ageStageGap}%</span>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h4 class="text-sm font-bold text-sky-800 mb-3 flex items-center gap-2"><span class="w-1 h-4 bg-sky-500 rounded"></span>主要な臨床的指摘</h4>
                                    <ul class="space-y-2">
                                        \${(d.keyTakeaways || []).map(t => \`<li class="flex gap-2 text-sm text-slate-700"><span class="text-sky-400">•</span>\${t}</li>\`).join('')}
                                    </ul>
                                </div>
                                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h4 class="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2"><span class="w-1 h-4 bg-indigo-500 rounded"></span>理論的根拠</h4>
                                    <p class="text-sm text-slate-700">\${d.theoryBasis}</p>
                                </div>
                            </div>

                            <div class="mb-8">
                                <h4 class="text-lg font-bold text-slate-800 mb-4">内的変容プロセス (Summary)</h4>
                                <div class="prose prose-slate max-w-none text-sm">\${marked.parse(d.overallSummary || '')}</div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h5 class="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Detected Strengths</h5>
                                    <div class="flex flex-wrap gap-2">
                                        \${(d.detectedStrengths || []).map(s => \`<span class="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">\${s}</span>\`).join('')}
                                    </div>
                                </div>
                                <div>
                                    <h5 class="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">Areas for Development</h5>
                                    <div class="flex flex-wrap gap-2">
                                        \${(d.areasForDevelopment || []).map(s => \`<span class="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full">\${s}</span>\`).join('')}
                                    </div>
                                </div>
                            </div>

                            \${d.expertAdvice ? \`<div class="mb-6 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-sm text-indigo-900"><span class="block text-[10px] font-black uppercase text-indigo-400 mb-2">Supervisor Advice</span>\${d.expertAdvice}</div>\` : ''}
                            
                            \${d.reframedSkills && d.reframedSkills.length > 0 ? \`
                                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <table class="w-full text-sm text-left">
                                        <thead class="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th class="px-4 py-3">相談者の言葉</th><th class="px-4 py-3">専門的リフレーム</th><th class="px-4 py-3">インサイト</th></tr></thead>
                                        <tbody class="divide-y divide-slate-100">
                                            \${d.reframedSkills.map(r => \`<tr class="hover:bg-slate-50/50"><td class="px-4 py-3 font-medium text-slate-700">\${r.userWord}</td><td class="px-4 py-3 font-bold text-sky-700">\${r.professionalSkill}</td><td class="px-4 py-3 text-slate-500 text-xs">\${r.insight}</td></tr>\`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            \` : ''}
                        </div>
                    </div>\`;
                });
                html += '</div></section>';
            }

            // 2. Skill Matching History Section
            if (skillHistory.length > 0) {
                html += '<section class="space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">';
                html += '<div class="flex items-center gap-3"><div class="w-1.5 h-8 bg-emerald-600 rounded-full"></div><h2 class="text-3xl font-black text-slate-900 tracking-tight">適職診断レポート（詳細）</h2></div>';
                html += '<div class="relative space-y-16 pl-4">';
                html += '<div class="timeline-line"></div>';
                
                skillHistory.forEach(entry => {
                    const date = new Date(entry.timestamp).toLocaleDateString('ja-JP', {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
                    const d = entry.data;
                    html += \`
                    <div class="relative z-10 pl-8">
                        <div class="absolute left-0 top-1 w-8 h-8 bg-emerald-100 rounded-full border-4 border-white flex items-center justify-center text-emerald-600 shadow-sm font-bold text-xs">●</div>
                        <div class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-slate-100">
                            <div class="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                                <div>
                                    <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Analysis Date</span>
                                    <h3 class="text-2xl font-black text-slate-800">\${date}</h3>
                                </div>
                            </div>
                            
                            <div class="mb-8">
                                <h4 class="text-lg font-bold text-slate-800 mb-4">キャリアプロファイル分析</h4>
                                <div class="prose prose-slate max-w-none text-sm mb-6">\${marked.parse(d.analysisSummary || '')}</div>
                            </div>

                            \${d.recommendedRoles && d.recommendedRoles.length > 0 ? \`
                                <h4 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span class="w-1 h-4 bg-emerald-500 rounded"></span>推奨ロールと適合根拠</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    \${d.recommendedRoles.map(r => \`
                                    <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                        <div class="flex justify-between items-start mb-2">
                                            <span class="font-bold text-slate-800 text-lg">\${r.role}</span>
                                            <span class="text-emerald-600 font-black text-xl">\${r.matchScore}%</span>
                                        </div>
                                        <p class="text-xs text-slate-600 leading-relaxed">\${r.reason}</p>
                                    </div>\`).join('')}
                                </div>
                            \` : ''}

                            \${d.skillsToDevelop && d.skillsToDevelop.length > 0 ? \`
                                <h4 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span class="w-1 h-4 bg-amber-500 rounded"></span>市場価値向上のための学習項目</h4>
                                <div class="space-y-3 mb-8">
                                    \${d.skillsToDevelop.map(s => \`
                                    <div class="flex items-start gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                        <div class="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">UP</div>
                                        <div>
                                            <p class="font-bold text-slate-800 text-sm">\${s.skill}</p>
                                            <p class="text-xs text-slate-500 mt-1">\${s.reason}</p>
                                        </div>
                                    </div>\`).join('')}
                                </div>
                            \` : ''}

                            \${d.learningResources && d.learningResources.length > 0 ? \`
                                <h4 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><span class="w-1 h-4 bg-violet-500 rounded"></span>推奨学習リソース</h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    \${d.learningResources.map(r => \`<div class="p-3 bg-white border border-slate-200 rounded-xl"><p class="font-bold text-slate-800 text-xs mb-1">\${r.title}</p><div class="flex justify-between text-[10px] text-slate-400"><span class="font-bold">\${r.provider}</span><span>\${r.type}</span></div></div>\`).join('')}
                                </div>
                            \` : ''}
                        </div>
                    </div>\`;
                });
                html += '</div></section>';
            }

            // 3. Conversation Logs (Existing Logic)
            if (data.conversations && data.conversations.length > 0) {
                html += \`<section class="space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                    <div class="flex items-center gap-3"><div class="w-1.5 h-8 bg-slate-400 rounded-full"></div><h2 class="text-3xl font-black text-slate-900 tracking-tight">全セッション履歴 (\${data.conversations.length}件)</h2></div>
                    <div class="space-y-6">
                \`;
                data.conversations.forEach(conv => {
                    const date = new Date(conv.date).toLocaleString('ja-JP', {dateStyle:'full', timeStyle:'short'});
                    html += \`<div class="bg-slate-100/50 p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-inner">
                        <div class="flex justify-between items-start mb-6">
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Timeline</p>
                                <h3 class="font-black text-xl text-slate-800">\${date}</h3>
                            </div>
                            <span class="px-3 py-1 bg-white text-slate-600 text-[10px] font-black rounded-full border border-slate-200 shadow-sm uppercase tracking-tighter">
                            Agent: \${conv.aiName}
                            </span>
                        </div>
                        <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 prose prose-slate max-w-none">
                            <h4 class="text-sm font-black text-sky-600 uppercase tracking-widest mb-4">Session Summary</h4>
                            \${marked.parse(parseUserSummary(conv.summary))}
                        </div>
                    </div>\`;
                });
                html += '</div></section>';
            } else {
               html += '<div class="text-center text-slate-400 py-10 font-bold">会話履歴はありません。</div>';
            }

            if (trajectoryHistory.length === 0 && skillHistory.length === 0 && (!data.conversations || data.conversations.length === 0)) {
                 reportBody.innerHTML = '<div class="text-center py-20"><h3 class="text-xl font-bold text-slate-400">データが存在しません</h3></div>';
            } else {
                 reportBody.innerHTML = html;
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
