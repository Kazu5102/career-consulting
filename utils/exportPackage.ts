
// utils/exportPackage.ts - v6.04 - 2026-05-28 - Secure HTML Backup and Multi-Session Portable Reader (Plan B)
import { encryptData } from './cryptoUtils';

export const VERSION = "6.04";

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

    <!-- Hidden Backup Payload for App Import/Recovery -->
    <div id="encrypted-backup-payload" style="display:none">${encryptedPayload}</div>

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

export async function generateSecureBackupHtmlPackage(data: any, password: string): Promise<string> {
  const encryptedPayload = await encryptData(JSON.stringify(data), password);
  const timestamp = new Date().toLocaleString('ja-JP');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>自己完結型セキュア暗号化バックアップポート</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans+JP:wght@400;700;900&display=swap');
        body { font-family: 'Inter', 'Noto Sans JP', sans-serif; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col items-center justify-start p-4">
    <div id="root" class="w-full max-w-3xl bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 my-10 overflow-hidden">
        <header class="bg-gradient-to-r from-sky-900 to-indigo-950 p-8 text-center border-b border-slate-700">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-black tracking-wide uppercase mb-3">
                🔒 特許コンセプト準拠ゼロトラスト
            </div>
            <h1 class="text-2xl font-black mb-1 tracking-tight text-white">セキュア履歴バックアップパッケージ</h1>
            <p class="text-slate-400 text-xs">暗号化方式: AES-GCM 256bit | 生成日時: ${timestamp}</p>
        </header>
        
        <!-- パスワード解除画面 -->
        <div id="unlock-view" class="p-10 space-y-8 max-w-md mx-auto">
            <div class="text-center">
                <div class="w-20 h-20 bg-sky-950/50 text-sky-400 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-sky-900/50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 class="text-xl font-bold text-white">バックアップ復号キー入力</h2>
                <p class="text-slate-400 text-xs mt-2 leading-relaxed">
                    このファイルは強力に暗号化されています。エクスポート時にご自身で指定したパスワードを入力してください。
                </p>
            </div>
            
            <div class="space-y-4">
                <input type="password" id="password-input" placeholder="暗号化パスワードを入力..." 
                    class="w-full p-4 bg-slate-900 text-white rounded-2xl border border-slate-700 focus:outline-none focus:ring-4 focus:ring-sky-500/20 text-center font-bold text-lg">
                <button id="unlock-btn" class="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                    安全に復号して閲覧する
                </button>
            </div>
            <p id="error-msg" class="text-center text-rose-400 font-bold text-sm hidden">⚠️ パスワードが一致しないか、データ破損により復号キーの導出に失敗しました。</p>
            
            <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 text-slate-400 text-[11px] leading-relaxed space-y-1.5">
                <span class="font-extrabold text-slate-300 block">💡 アプリへの復元の手順</span>
                <p>このHTMLファイル自体をアプリケーションの「データ復元」メニューにドラッグ、またはファイル選択してアップロードすることで、セッションデータを完全にアプリ内に復旧できます。</p>
            </div>
        </div>

        <!-- 復号成功後のメイン閲覧画面 -->
        <div id="content-view" class="hidden p-8 space-y-8">
            <!-- ユーザープロフィール -->
            <div class="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-905/30 bg-slate-900 rounded-2xl border border-slate-700 gap-4">
                <div>
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest block">USER PROFILE</span>
                    <h2 class="text-2xl font-black text-white" id="user-nickname">-</h2>
                    <p class="text-slate-400 text-xs mt-1" id="user-meta-info">-</p>
                </div>
                <div class="text-right">
                    <span class="text-[10px] font-black text-slate-400 block">セッション数</span>
                    <span class="text-3xl font-black text-sky-400" id="session-count">0</span>
                </div>
            </div>

            <!-- セッション選択（左側リスト、右側詳細などの2カラム、またはリストアコーディオン） -->
            <div>
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">保存されている対話履歴</h3>
                <div id="sessions-container" class="space-y-4">
                    <!-- JavaScriptで動的生成 -->
                </div>
            </div>
        </div>

        <footer class="p-6 bg-slate-900 border-t border-slate-700 text-center">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Zero-Trust Patent Compliance | Private Encrypted Portable Storage</p>
        </footer>
    </div>

    <!-- Hidden Backup Payload for App Import/Recovery -->
    <div id="encrypted-backup-payload" style="display:none">${encryptedPayload}</div>

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

        function renderData(storedData) {
            // storedData structure: { version, data: StoredConversation[], userInfo: UserInfo, analysisHistory: any[] }
            const nickname = storedData.userInfo?.nickname || "不明なユーザー";
            const userId = storedData.userInfo?.id || "N/A";
            const conversations = storedData.data || [];
            
            document.getElementById('user-nickname').innerText = nickname;
            document.getElementById('user-meta-info').innerText = "ユーザーID: " + userId + " | バージョン: " + (storedData.version || "N/A");
            document.getElementById('session-count').innerText = conversations.length;

            const sessionsContainer = document.getElementById('sessions-container');
            sessionsContainer.innerHTML = '';

            if (conversations.length === 0) {
                sessionsContainer.innerHTML = \`<div class="text-center py-10 text-slate-500 text-sm">セッション履歴がありません。</div>\`;
                return;
            }

            conversations.forEach((conv, index) => {
                const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleString('ja-JP') : "不明な日時";
                const wrapper = document.createElement('div');
                wrapper.className = "bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden";
                
                // Card Header
                const header = document.createElement('button');
                header.className = "w-full text-left p-5 flex items-center justify-between hover:bg-slate-700/50 transition-colors focus:outline-none";
                header.innerHTML = \`
                    <div class="pr-4">
                        <span class="text-[9px] font-black text-sky-400 bg-sky-900/50 px-2.5 py-1 rounded-full uppercase tracking-widest">\${conv.model || "AI"}</span>
                        <h4 class="text-base font-bold text-white mt-2 leading-snug">\${conv.title || "無題の対話セッション"}</h4>
                        <p class="text-xs text-slate-400 mt-1">更新日時: \${dateStr}</p>
                    </div>
                    <div class="text-slate-400 text-xl font-bold flex items-center shrink-0">
                        <svg id="icon-\${index}" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                \`;

                // Details Panel
                const panel = document.createElement('div');
                panel.className = "hidden p-6 border-t border-slate-700/50 bg-slate-900/40 space-y-8";
                
                // Parse summary if it exists
                let summaryHtml = "";
                if (conv.summary) {
                    try {
                        const sumObj = typeof conv.summary === 'string' ? JSON.parse(conv.summary) : conv.summary;
                        const userSum = sumObj.user_summary || sumObj.summary || conv.summary;
                        summaryHtml = \`
                            <div class="p-5 bg-amber-950/20 border border-amber-900/40 text-amber-200 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                                <span class="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">📋 相談セッション要約・アドバイス</span>
                                \${userSum}
                            </div>
                        \`;
                    } catch(e) {
                        summaryHtml = \`
                            <div class="p-5 bg-amber-950/20 border border-amber-900/40 text-amber-200 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                                <span class="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">📋 相談セッション要約・アドバイス</span>
                                \${conv.summary}
                            </div>
                        \`;
                    }
                }

                // Messages Render
                let messagesHtml = "";
                if (conv.messages && Array.isArray(conv.messages)) {
                    conv.messages.forEach(msg => {
                        const isUser = msg.author === 'user' || msg.sender === 'user';
                        const authorLabel = isUser ? "相談者" : "AIアドバイザー";
                        const bgClass = isUser ? "bg-sky-950/30 border border-sky-900/30 text-sky-200 ml-8" : "bg-slate-900/80 border border-slate-800 text-slate-200 mr-8";
                        
                        messagesHtml += \`
                            <div class="p-4 rounded-2xl space-y-1 \${bgClass}">
                                <div class="flex items-center justify-between text-[10px] font-black tracking-wide uppercase opacity-55">
                                    <span>\${authorLabel}</span>
                                    <span>\${msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('ja-JP') : ''}</span>
                                </div>
                                <div class="text-sm leading-relaxed whitespace-pre-wrap">\${msg.text || msg.content || ""}</div>
                            </div>
                        \`;
                    });
                }

                panel.innerHTML = \`
                    \${summaryHtml}
                    <div class="space-y-4">
                        <span class="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">💬 チャットログ（全 \${conv.messages?.length || 0} 件）</span>
                        <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            \${messagesHtml}
                        </div>
                    </div>
                \`;

                header.addEventListener('click', () => {
                    const icon = document.getElementById(\`icon-\${index}\`);
                    if (panel.classList.contains('hidden')) {
                        panel.classList.remove('hidden');
                        icon.style.transform = 'rotate(180deg)';
                    } else {
                        panel.classList.add('hidden');
                        icon.style.transform = 'rotate(0deg)';
                    }
                });

                wrapper.appendChild(header);
                wrapper.appendChild(panel);
                sessionsContainer.appendChild(wrapper);
            });
        }
    </script>
</body>
</html>`;
}

