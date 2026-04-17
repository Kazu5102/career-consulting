
// constants.ts
// v4.61 - 2026-04-17 - API loop fix and fallback restoration
// Single Source of Truth for Application Constants

export const APP_VERSION = "4.61";

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
