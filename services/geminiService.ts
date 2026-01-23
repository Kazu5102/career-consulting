
// services/geminiService.ts - v4.03 - Auto-Retry Resilience Engine
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, GroundingMetadata, UserProfile } from '../types';

const PROXY_API_ENDPOINT = '/api/gemini-proxy';
const ANALYSIS_TIMEOUT = 55000; 
const CHAT_TIMEOUT = 30000; 

/**
 * Truncates chat history to keep payloads small and prevent timeouts
 */
const pruneHistory = (messages: ChatMessage[], limit: number = 20): ChatMessage[] => {
    if (messages.length <= limit) return messages;
    return [
        ...messages.slice(0, 2),
        { author: messages[0].author === 'user' ? 'ai' : 'user' as any, text: "...(中略)..." },
        ...messages.slice(-(limit - 3))
    ];
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch with Exponential Backoff Retry logic
 */
async function fetchFromProxy(action: string, payload: any, isStreaming: boolean = false, timeout: number = 30000): Promise<any> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Exponential backoff with jitter
            if (attempt > 0) {
                const backoffDelay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
                console.log(`[Stability Protocol 4.03] Retry attempt ${attempt}/${maxRetries} after ${Math.floor(backoffDelay)}ms...`);
                await sleep(backoffDelay);
            }

            const response = await fetch(PROXY_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
                signal: controller.signal,
            });
    
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const statusCode = response.status;
                
                // Parse nested error objects common in Gemini API responses
                let errorMessage = '不明なサーバーエラー';
                if (typeof errorData.error === 'object' && errorData.error !== null) {
                    errorMessage = errorData.error.message || JSON.stringify(errorData.error);
                } else {
                    errorMessage = errorData.details || errorData.error || `Server Error: ${statusCode}`;
                }

                const error: any = new Error(errorMessage);
                error.status = statusCode;
                error.code = errorData.code || (typeof errorData.error === 'object' ? errorData.error.code : null);
                
                // Retry conditions: 503 (Overloaded), 429 (Rate Limit), or specific "overloaded" message
                const isOverloaded = statusCode === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE');
                const isRateLimited = statusCode === 429 || errorMessage.includes('quota');
                
                if (attempt < maxRetries && (isOverloaded || isRateLimited)) {
                    console.warn(`[Stability Protocol] Recoverable error detected (${statusCode}). Retrying...`);
                    continue;
                }
                throw error;
            }
            
            if (isStreaming) return response;
            return response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            lastError = error;
            
            // Retry on timeouts
            if (error instanceof DOMException && error.name === 'AbortError') {
                if (attempt < maxRetries) {
                    console.warn(`[Stability Protocol] Request timed out. Retrying...`);
                    continue;
                }
                throw new Error('通信がタイムアウトしました。安定したネットワーク環境で再度お試しください。');
            }
            
            // Generic network errors
            if (attempt < maxRetries && (!error.status || error.status >= 500)) {
                continue;
            }

            if (attempt === maxRetries) throw error;
        }
    }
    throw lastError;
}

export const checkServerStatus = async (): Promise<{status: string}> => {
    try {
        const response = await fetchFromProxy('healthCheck', {}, false, 10000);
        return response;
    } catch (error) {
        throw error;
    }
};

export interface StreamUpdate {
    text?: string;
    groundingMetadata?: GroundingMetadata;
    error?: {
        message: string;
        code?: string;
    };
}

export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    try {
        const pruned = pruneHistory(messages, 30); 
        const response = await fetchFromProxy('getStreamingChatResponse', { messages: pruned, aiType, aiName, profile }, true, CHAT_TIMEOUT);
        const rawStream = response.body;
        if (!rawStream) return null;

        const reader = rawStream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        return new ReadableStream({
            async pull(controller) {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        controller.close();
                        return;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) continue;
                        
                        const jsonStr = trimmed.slice(6);
                        if (jsonStr === '[DONE]') {
                            controller.close();
                            await reader.cancel();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.type === 'text') {
                                controller.enqueue({ text: parsed.content });
                            } else if (parsed.type === 'error') {
                                controller.enqueue({ error: { message: parsed.content, code: parsed.code } });
                            }
                        } catch (e) { }
                    }
                } catch (e) {
                    controller.error(e);
                }
            },
            cancel() {
                reader.cancel();
            }
        });
    } catch (error: any) {
        return new ReadableStream({
            start(controller) {
                controller.enqueue({ error: { message: error.message, code: error.code } });
                controller.close();
            }
        });
    }
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    const prunedHistory = pruneHistory(chatHistory, 25);
    const data = await fetchFromProxy('generateSummary', { chatHistory: prunedHistory, aiType, aiName, profile }, false, CHAT_TIMEOUT);
    return data.text;
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    return await fetchFromProxy('analyzeTrajectory', { conversations, userId }, false, ANALYSIS_TIMEOUT);
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    return await fetchFromProxy('performSkillMatching', { conversations }, false, ANALYSIS_TIMEOUT);
};

export const generateSuggestions = async (messages: ChatMessage[]): Promise<{ suggestions: string[] }> => {
    try {
        const pruned = pruneHistory(messages, 15);
        return await fetchFromProxy('generateSuggestions', { messages: pruned }, false, 15000);
    } catch (e) {
        return { suggestions: [] };
    }
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    const limitedText = textToAnalyze.slice(0, 10000);
    const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze: limitedText }, false, CHAT_TIMEOUT);
    return data.text;
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    const data = await fetchFromProxy('reviseSummary', { originalSummary, correctionRequest }, false, CHAT_TIMEOUT);
    return data.text;
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    return await fetchFromProxy('analyzeConversations', { summaries }, false, ANALYSIS_TIMEOUT);
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    return await fetchFromProxy('findHiddenPotential', { conversations, userId }, false, ANALYSIS_TIMEOUT);
};
