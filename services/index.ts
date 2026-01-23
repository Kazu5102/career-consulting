
// services/index.ts - v3.99 - Dynamic Service Switching with Fallback & State Check
import * as realService from './geminiService';
import * as mockService from './mockGeminiService';
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

export const getStreamingChatResponse = (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => activeService.getStreamingChatResponse(messages, aiType, aiName, profile);

export const generateSummary = (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => activeService.generateSummary(chatHistory, aiType, aiName, profile);

export const reviseSummary = (originalSummary: string, correctionRequest: string): Promise<string> => activeService.reviseSummary(originalSummary, correctionRequest);

export const analyzeConversations = (summaries: StoredConversation[]): Promise<AnalysisData> => activeService.analyzeConversations(summaries);

export const analyzeTrajectory = (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => activeService.analyzeTrajectory(conversations, userId);

export const findHiddenPotential = (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => activeService.findHiddenPotential(conversations, userId);

export const generateSummaryFromText = (textToAnalyze: string): Promise<string> => activeService.generateSummaryFromText(textToAnalyze);

export const performSkillMatching = (conversations: StoredConversation[]): Promise<SkillMatchingResult> => activeService.performSkillMatching(conversations);

export const generateSuggestions = (messages: ChatMessage[]): Promise<{ suggestions: string[] }> => activeService.generateSuggestions(messages);
