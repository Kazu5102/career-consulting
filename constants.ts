
// constants.ts
// v4.70 - 2026-04-18 - API Usage tracking and feature toggle
// Single Source of Truth for Application Constants

export const APP_VERSION = "4.70";

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
