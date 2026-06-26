// services/index.ts - v6.51 - 2026-06-26 - API疎通可能性に基づく自動サービス切り替えエンジンの導入（案1適用）
import * as realService from './geminiService';
import * as mockService from './mockGeminiService';
import { trackApiUsage } from './usageTrackingService';
import type { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, UserProfile } from '../types';
import { StreamUpdate } from './geminiService';

export const VERSION = "6.51";

// Mutable service reference to allow runtime fallback
let activeService = realService;
let isMockActive = false;
let initPromise: Promise<void> | null = null;

/**
 * Dynamically checks the API server availability to decide whether to use
 * the Real Gemini API or gracefully fallback to Mock Service.
 */
export const initializeService = async (): Promise<void> => {
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        try {
            console.log("[Service] Checking Gemini server connection...");
            const status = await realService.checkServerStatus();
            if (status && status.status === 'ok') {
                console.log("[Service] Real Gemini API server is online. Using REAL service.");
                activeService = realService;
                isMockActive = false;
            } else {
                console.warn("[Service] Real server returned invalid status. Falling back to MOCK service.");
                activeService = mockService;
                isMockActive = true;
            }
        } catch (e) {
            console.warn("[Service] Could not reach Real Gemini API server. Falling back to MOCK service.", e);
            activeService = mockService;
            isMockActive = true;
        }
    })();
    return initPromise;
};

// Start background initialization immediately
initializeService();

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

// Exported functions delegate to the currently active service (insured with connection checks)
export const checkServerStatus = async (): Promise<{status: string}> => {
    await initializeService();
    return activeService.checkServerStatus();
};

export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    await initializeService();
    const inputLength = messages.map(m => m.text).join('').length;
    trackApiUsage(messages.map(m => m.text).join(''), '');
    return activeService.getStreamingChatResponse(messages, aiType, aiName, profile);
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    await initializeService();
    trackApiUsage(chatHistory.map(m => m.text).join(''), '');
    return activeService.generateSummary(chatHistory, aiType, aiName, profile);
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    await initializeService();
    trackApiUsage(originalSummary + correctionRequest, '');
    return activeService.reviseSummary(originalSummary, correctionRequest);
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    await initializeService();
    trackApiUsage(summaries.map(s => s.summary).join(''), '');
    return activeService.analyzeConversations(summaries);
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    await initializeService();
    trackApiUsage(conversations.map(s => s.summary).join(''), '');
    return activeService.analyzeTrajectory(conversations, userId);
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    await initializeService();
    trackApiUsage(conversations.map(s => s.summary).join(''), '');
    return activeService.findHiddenPotential(conversations, userId);
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    await initializeService();
    trackApiUsage(textToAnalyze, '');
    return activeService.generateSummaryFromText(textToAnalyze);
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    await initializeService();
    trackApiUsage(conversations.map(s => s.summary).join(''), '');
    return activeService.performSkillMatching(conversations);
};

export const generateSuggestions = async (messages: ChatMessage[], currentDraft?: string): Promise<{ suggestions: string[], readinessScore: number }> => {
    await initializeService();
    trackApiUsage(messages.map(m => m.text).join('') + (currentDraft || ''), '');
    return activeService.generateSuggestions(messages, currentDraft);
};