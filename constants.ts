
// constants.ts
// v6.35 - 2026-05-30 - モックチャットシミュレータの知能再生及びゴミコード完全駆除
export const APP_VERSION = "6.35";

/**
 * AI Service Configuration
 * 最新のAI Studioガイドラインに基づき、性能・安定性のバランスが取れたモデルを採用
 */
export const AI_CONFIG = {
    // 対話用: 高速かつ高精度 (Gemini 3.5 Flash)
    CHAT_MODEL: 'gemini-3.5-flash',
    // 分析用: 高度な推論 (Gemini 3.1 Pro Preview)
    ANALYSIS_MODEL: 'gemini-3.1-pro-preview',
    // 補助・要約用: 低遅延・低コスト (Gemini 3.1 Flash Lite)
    LITE_MODEL: 'gemini-3.1-flash-lite',
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
