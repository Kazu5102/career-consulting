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
    <title>暗号化された相談レポート</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: sans-serif; }
        .prose h1, .prose h2, .prose h3, .prose h4 { font-weight: bold; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }
        #content { display: none; }
        #password-form { max-width: 400px; margin: 5rem auto; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    </style>
</head>
<body class="bg-slate-100 text-slate-800">
    <div id="password-form" class="bg-white">
        <h1 class="text-2xl font-bold text-center mb-4">レポート閲覧</h1>
        <p class="text-sm text-slate-600 text-center mb-6">このレポートは暗号化されています。閲覧するにはパスワードを入力してください。</p>
        <form onsubmit="decryptAndShow(event)">
            <input type="password" id="password" placeholder="パスワード" required class="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
            <button type="submit" id="submit-btn" class="w-full mt-4 px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700">閲覧する</button>
            <p id="error" class="text-red-500 text-sm mt-2 h-4 text-center"></p>
        </form>
    </div>

    <main id="content" class="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white my-8 rounded-xl shadow-lg">
        <header class="pb-4 border-b border-slate-200 mb-6">
            <h1 class="text-3xl font-bold">相談者レポート</h1>
            <p class="text-slate-500">相談者ID: <span id="user-id" class="font-mono"></span></p>
        </header>
        <div id="report-body" class="space-y-12"></div>
    </main>
    
    <script>
        const encryptedData = '${encryptedData}';
        
        async function decryptData(encryptedString, password) {
            try {
                const [ivHex, saltHex, dataHex] = encryptedString.split(':');
                const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const data = new Uint8Array(dataHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const keyMaterial = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
                const key = await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
                const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
                return new TextDecoder().decode(decrypted);
            } catch (error) {
                console.error('Decryption failed:', error);
                return null;
            }
        }

        async function decryptAndShow(event) {
            event.preventDefault();
            const passwordInput = document.getElementById('password');
            const errorEl = document.getElementById('error');
            const submitBtn = document.getElementById('submit-btn');
            
            submitBtn.disabled = true;
            submitBtn.textContent = '復号中...';
            errorEl.textContent = '';
            
            const decrypted = await decryptData(encryptedData, passwordInput.value);
            
            if (decrypted) {
                const reportData = JSON.parse(decrypted);
                renderReport(reportData);
                document.getElementById('password-form').style.display = 'none';
                document.getElementById('content').style.display = 'block';
            } else {
                errorEl.textContent = 'パスワードが違うか、データが破損しています。';
                submitBtn.disabled = false;
                submitBtn.textContent = '閲覧する';
            }
        }

        function renderReport(data) {
            document.getElementById('user-id').textContent = data.userId;
            const reportBody = document.getElementById('report-body');
            let html = '';

            // Render Analysis Sections
            if (data.analysisCache) {
                html += '<div><h2 class="text-2xl font-bold border-b pb-2 mb-4">分析レポート</h2><div class="space-y-6">';
                if (data.analysisCache.trajectory) {
                    html += '<h3 class="text-xl font-bold text-sky-700 mt-4">相談の軌跡</h3>';
                    html += '<div class="prose max-w-none">' + markdownToHtml(data.analysisCache.trajectory.overallSummary) + '</div>';
                }
                if (data.analysisCache.skillMatching) {
                    html += '<h3 class="text-xl font-bold text-sky-700 mt-4">適性診断</h3>';
                    html += '<div class="prose max-w-none">' + markdownToHtml(data.analysisCache.skillMatching.analysisSummary) + '</div>';
                }
                if (data.analysisCache.hiddenPotential) {
                     html += '<h3 class="text-xl font-bold text-amber-700 mt-4">隠れた可能性</h3>';
                     html += '<div class="prose max-w-none">' + data.analysisCache.hiddenPotential.hiddenSkills.map(s => \`<h4>\${s.skill}</h4><p>\${s.reason}</p>\`).join('') + '</div>';
                }
                html += '</div></div>';
            }

            // Render Conversations
            html += \`<div>
                <h2 class="text-2xl font-bold border-b pb-2 mb-4">対話履歴 (\${data.conversations.length}件)</h2>
                <div class="space-y-6 mt-4">
            \`;
            data.conversations.forEach(conv => {
                const date = new Date(conv.date).toLocaleString('ja-JP');
                html += \`<div class="p-4 border rounded-lg bg-slate-50">
                    <h3 class="font-bold text-lg">相談日時: \${date}</h3>
                    <p class="text-sm text-slate-600">担当AI: \${conv.aiName}</p>
                    <div class="mt-4 pt-4 border-t prose max-w-none">
                        <h4>相談サマリー</h4>
                        \${markdownToHtml(conv.summary)}
                    </div>
                </div>\`;
            });
            html += '</div></div>';

            reportBody.innerHTML = html;
        }

        function markdownToHtml(md) {
            if (!md) return '';
            return md
                .replace(/^### (.*$)/gim, '<h4 class="text-lg font-bold mt-4 mb-2">$1</h4>')
                .replace(/^## (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 border-b pb-2">$1</h3>')
                .replace(/\* \*(.*?)\* \*/gim, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                .replace(/^- (.*$)/gim, (match, content) => \`<li class="ml-4 list-disc">\${content.trim()}</li>\`)
                .replace(/\\n/g, '<br>');
        }
    </script>
</body>
</html>
  `;
  return new Blob([htmlContent.trim()], { type: 'text/html' });
};