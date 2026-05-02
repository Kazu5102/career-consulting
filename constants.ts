
// constants.ts
// v5.41 - 2026-05-02 - Plan A: Optimized precision strategy with strict history slicing and prompt slimming
// Single Source of Truth for Application Constants

export const APP_VERSION = "5.41";

/**
 * AI Service Configuration
 * 精度重視のPrecisionモデルと、安定・クォータ重視のLiteモデルのハイブリッド運用
 */
export const AI_CONFIG = {
    // 心理分析・チャット用（高精度）
    PRECISION_MODEL: 'gemini-3-flash-preview',
    // 要約・サジェスト・フォールバック用（高速・低負荷）
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
