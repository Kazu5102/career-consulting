// services/index.ts - v4.70 - Hook usage tracking
import * as realService from './geminiService';
import * as mockService from './mockGeminiService';
import { trackApiUsage } from './usageTrackingService';
import type { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, UserProfile } from '../types';
import { StreamUpdate } from './geminiService';

// Environment detection
const env = (import.meta as any).env || {};
const isProduction = env.PROD === true;

// Mutable service reference to allow runtime fallback
let activeService = isProduction ? realService : mockService;
let isMockActive = !isProduction;

console.log(`[Service Initialized] Defaulting to ${isProduction ? 'REAL' : 'MOCK'} service.`);

/**
 * Forces the application to use the Mock Service.
 * Useful when the backend is unreachable or for demo purposes.
 */
export const useMockService = () => {
    console.warn("⚠️ Switching to Mock Service (Fallback Mode)");
    activeService = mockService;
    isMockActive = true;
};

/**
 * Checks if the application is currently running in Mock Mode.
 */
export const isMockMode = (): boolean => {
    return isMockActive;
};

// Exported functions delegate to the currently active service
export const checkServerStatus = (): Promise<{status: string}> => activeService.checkServerStatus();

export const getStreamingChatResponse = (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    // 概算の入力テキスト量をトラッキング
    const inputLength = messages.map(m => m.text).join('').length;
    trackApiUsage(messages.map(m => m.text).join(''), '');
    return activeService.getStreamingChatResponse(messages, aiType, aiName, profile);
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    trackApiUsage(chatHistory.map(m => m.text).join(''), '');
    return activeService.generateSummary(chatHistory, aiType, aiName, profile);
};

export const reviseSummary = (originalSummary: string, correctionRequest: string): Promise<string> => {
    trackApiUsage(originalSummary + correctionRequest, '');
    return activeService.reviseSummary(originalSummary, correctionRequest);
};

export const analyzeConversations = (summaries: StoredConversation[]): Promise<AnalysisData> => {
    trackApiUsage(summaries.map(s => s.summary).join(''), '');
    return activeService.analyzeConversations(summaries);
};

export const analyzeTrajectory = (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    trackApiUsage(conversations.map(s => s.summary).join(''), '');
    return activeService.analyzeTrajectory(conversations, userId);
};

export const findHiddenPotential = (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    trackApiUsage(conversations.map(s => s.summary).join(''), '');
    return activeService.findHiddenPotential(conversations, userId);
};

export const generateSummaryFromText = (textToAnalyze: string): Promise<string> => {
    trackApiUsage(textToAnalyze, '');
    return activeService.generateSummaryFromText(textToAnalyze);
};

export const performSkillMatching = (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    trackApiUsage(conversations.map(s => s.summary).join(''), '');
    return activeService.performSkillMatching(conversations);
};

export const generateSuggestions = (messages: ChatMessage[], currentDraft?: string): Promise<{ suggestions: string[], readinessScore: number }> => {
    trackApiUsage(messages.map(m => m.text).join('') + (currentDraft || ''), '');
    return activeService.generateSuggestions(messages, currentDraft);
};