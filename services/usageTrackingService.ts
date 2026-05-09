// services/usageTrackingService.ts - v4.70
import { FEATURES } from '../constants';

const STORAGE_KEY = 'gemini_usage_tracking_data';

export interface UsageData {
  totalApiCalls: number;
  totalEstimatedTokens: number;
  lastUpdated: number;
}

// 日本語の文字数からGemini APIのトークン数への概算係数 (1文字 ≒ 1.2トークン程度と見積もる)
const TOKEN_MULTIPLIER = 1.2;

const getDefaultData = (): UsageData => ({
  totalApiCalls: 0,
  totalEstimatedTokens: 0,
  lastUpdated: Date.now(),
});

export const getUsageData = (): UsageData => {
  if (!FEATURES.ENABLE_USAGE_TRACKING) return getDefaultData();
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getDefaultData();
  } catch {
    return getDefaultData();
  }
};

export const clearUsageData = (): void => {
  if (!FEATURES.ENABLE_USAGE_TRACKING) return;
  localStorage.removeItem(STORAGE_KEY);
};

export const trackApiUsage = (textSent: string = '', textReceived: string = ''): void => {
  // 機能フラグがfalse（本番環境等）の場合は、処理を完全にスキップして負荷をゼロにする
  if (!FEATURES.ENABLE_USAGE_TRACKING) return;

  try {
    const data = getUsageData();
    data.totalApiCalls += 1;
    
    // 文字数から概算トークンを計算
    const charCount = (textSent.length || 0) + (textReceived.length || 0);
    const estimatedTokens = Math.ceil(charCount * TOKEN_MULTIPLIER);
    data.totalEstimatedTokens += estimatedTokens;
    data.lastUpdated = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to track usage data", e);
  }
};
