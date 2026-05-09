
// utils/exportPackage.ts - v1.0.0 - Self-Contained HTML Export
import { encryptData } from './cryptoUtils';

export async function generateSecureHtmlPackage(data: any, password: string): Promise<string> {
  const encryptedPayload = await encryptData(JSON.stringify(data), password);
  const timestamp = new Date().toLocaleString('ja-JP');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Career Consultation Secure Handoff</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center p-4">
    <div id="root" class="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 mt-10 overflow-hidden">
        <header class="bg-slate-900 text-white p-8 text-center">
            <h1 class="text-2xl font-black mb-2 uppercase tracking-tight">Career Handoff Package</h1>
            <p class="text-slate-400 text-sm font-bold">Secure Encrypted Data | Generated: ${timestamp}</p>
        </header>
        
        <div id="unlock-view" class="p-10 space-y-8">
            <div class="text-center">
                <div class="w-20 h-20 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-sky-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 class="text-xl font-bold text-slate-800">閲覧パスワードを入力してください</h2>
                <p class="text-slate-500 text-sm mt-2">このファイルは暗号化されており、管理者であってもユーザーが設定したパスワードがない限り閲覧できません。</p>
            </div>
            
            <div class="space-y-4">
                <input type="password" id="password-input" placeholder="パスワードを入力..." 
                    class="w-full p-4 bg-slate-100 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-500/20 text-center font-bold text-lg">
                <button id="unlock-btn" class="w-full py-4 bg-sky-600 text-white font-black rounded-2xl shadow-lg hover:bg-sky-700 transition-all active:scale-[0.98]">
                    データを復号して閲覧する
                </button>
            </div>
            <p id="error-msg" class="text-center text-rose-500 font-bold text-sm hidden">パスワードが正しくないか、ファイルが破損しています。</p>
        </div>

        <div id="content-view" class="hidden p-8 space-y-10 animate-in fade-in duration-700 overflow-y-auto max-h-[80vh]">
            <section>
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Conversation Summary</h3>
                <div id="summary-container" class="prose prose-slate max-w-none"></div>
            </section>
            
            <section>
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Chat History</h3>
                <div id="history-container" class="space-y-4"></div>
            </section>
        </div>

        <footer class="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Zero-Trust Patent Compliance | Career Consulting App</p>
        </footer>
    </div>

    <script>
        const encryptedData = "${encryptedPayload}";

        async function deriveKey(password, salt) {
            const encoder = new TextEncoder();
            const passwordKey = await window.crypto.subtle.importKey(
                'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
            );
            return window.crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
                passwordKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
            );
        }

        async function decryptData(encryptedBase64, password) {
            const combined = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const data = combined.slice(28);
            const key = await deriveKey(password, salt);
            const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
            return new TextDecoder().decode(decrypted);
        }

        document.getElementById('unlock-btn').addEventListener('click', async () => {
            const password = document.getElementById('password-input').value;
            const errorMsg = document.getElementById('error-msg');
            errorMsg.classList.add('hidden');

            try {
                const decryptedStr = await decryptData(encryptedData, password);
                const data = JSON.parse(decryptedStr);
                renderData(data);
                document.getElementById('unlock-view').classList.add('hidden');
                document.getElementById('content-view').classList.remove('hidden');
            } catch (e) {
                console.error(e);
                errorMsg.classList.remove('hidden');
            }
        });

        function renderData(data) {
            const summaryCont = document.getElementById('summary-container');
            const historyCont = document.getElementById('history-container');
            
            // Render Summary
            const summaryObj = typeof data.summary === 'string' ? JSON.parse(data.summary) : data.summary;
            summaryCont.innerHTML = \`<div class="bg-amber-50 p-6 rounded-2xl border border-amber-200">\${summaryObj.user_summary || data.summary}</div>\`;
            
            // Render History
            data.chatHistory.forEach(msg => {
                const div = document.createElement('div');
                div.className = \`p-4 rounded-2xl \${msg.author === 'user' ? 'bg-sky-50 ml-10' : 'bg-slate-100 mr-10'}\`;
                div.innerHTML = \`<span class="text-[9px] font-black uppercase opacity-40 block mb-1">\${msg.author}</span><p class="text-sm">\${msg.text}</p>\`;
                historyCont.appendChild(div);
            });
        }
    </script>
</body>
</html>`;
}
