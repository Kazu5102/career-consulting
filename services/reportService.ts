
// services/reportService.ts - v3.80 - High-Fidelity Encrypted HTML Report
import { encryptData } from './cryptoService';
import { StoredConversation, UserAnalysisCache } from '../types';

interface ReportData {
  userId: string;
  conversations: StoredConversation[];
  analysisCache: UserAnalysisCache | null | undefined;
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

    <main id="content" class="max-w-5xl mx-auto p-4 md:p-12 animate-in fade-in duration-700">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-200 mb-12">
            <div>
                <span class="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">Consultation Record</span>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight">相談者レポート</h1>
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
        
        /**
         * Robust hex to byte conversion
         */
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

                const keyMaterial = await window.crypto.subtle.importKey(
                    'raw', 
                    new TextEncoder().encode(password), 
                    { name: 'PBKDF2' }, 
                    false, 
                    ['deriveKey']
                );

                const key = await window.crypto.subtle.deriveKey(
                    { name: 'PBKDF2', salt, iterations: 100, hash: 'SHA-256' }, 
                    keyMaterial, 
                    { name: 'AES-GCM', length: 256 }, 
                    true, 
                    ['decrypt']
                );

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

            // 1. Analysis Section
            if (data.analysisCache) {
                html += '<section class="space-y-8 animate-in slide-in-from-bottom-4 duration-700">';
                html += '<div class="flex items-center gap-3"><div class="w-1.5 h-8 bg-sky-600 rounded-full"></div><h2 class="text-3xl font-black text-slate-900 tracking-tight">AI 総合解析レポート</h2></div>';
                
                if (data.analysisCache.trajectory) {
                    html += \`<div class="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <h3 class="text-xl font-black text-sky-700 mb-6 flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                           相談の軌跡・内的変容分析
                        </h3>
                        <div class="prose prose-slate max-w-none">\${marked.parse(data.analysisCache.trajectory.overallSummary || '')}</div>
                    </div>\`;
                }
                
                if (data.analysisCache.skillMatching) {
                    html += \`<div class="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <h3 class="text-xl font-black text-emerald-700 mb-6 flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                           適職診断・市場価値レポート
                        </h3>
                        <div class="prose prose-slate max-w-none">\${marked.parse(data.analysisCache.skillMatching.analysisSummary || '')}</div>
                    </div>\`;
                }
                html += '</section>';
            }

            // 2. Conversation Logs
            html += \`<section class="space-y-8">
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

            reportBody.innerHTML = html;
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
