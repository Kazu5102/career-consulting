// utils/downloadUtils.ts - v5.91 - 2026-05-17 - Unified Download Utility (Protocol 3.0)
/**
 * セキュアかつブラウザごとの非同期ダウンロードブロックを回避する共通関数
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // DOMに追加してクリックを発火（Safari等でのブロッキング対策）
  document.body.appendChild(a);
  a.click();
  
  // 直後に消さず、非同期タスクとしてDOMから削除・メモリ解放する
  setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }, 150);
}

/**
 * タイムゾーンのズレを考慮したローカル日付文字列 (YYYY-MM-DD) を取得
 */
export function getLocalIsoDateString(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}
