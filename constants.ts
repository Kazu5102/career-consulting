
// constants.ts
// v5.77 - 2026-05-06 - True Resiliency: Multi-tier fallback (Pro -> Flash -> Lite)
export const APP_VERSION = "5.77";

/**
 * AI Service Configuration
 * v5.77: 高度な分析に gemini-1.5-pro を再導入。
 * ただし503エラー発生時は即座に Flash へ切り替えるレジリエンス機構を搭載。
 */
export const AI_CONFIG = {
    // 対話用: 高速かつ高精度
    CHAT_MODEL: 'gemini-1.5-flash',
    // 分析用: 高度な推論（失敗時は自動フォールバック）
    ANALYSIS_MODEL: 'gemini-1.5-pro',
    // 補助・要約用
    LITE_MODEL: 'gemini-1.5-flash',
    // ストリーミング接続のタイムアウト（ミリ秒）
    STREAM_TIMEOUT: 60000,
};

// Feature Toggles (機能の有効/無効の切り替えスイッチ。本番環境への移行時に使用)
export const FEATURES = {
  // trueの場合：API消費の記録を行い、管理者画面にシミュレーターを表示します。
  // falseの場合：完全に隠蔽され、トラッキングの負荷も無効化されます（本番リリース用推奨）。
  ENABLE_USAGE_TRACKING: true,
};

// Storage Keys
export const STORAGE_KEYS = {
    CONSENT: `legal_consent_v${APP_VERSION}`,
    SURVEY_ENABLED: 'survey_enabled_v1',
    ADMIN_PASSWORD: 'adminPassword_v1',
    DEV_LOG: 'devLog_v1',
    USERS: 'careerConsultingUsers_v1',
    CONSULTATIONS: 'careerConsultations',
    ANALYSIS_HISTORY: 'careerAnalysisHistory_v1'
};
