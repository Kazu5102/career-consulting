
// services/geminiService.ts - v4.00 - Resilience Enhancement
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, GroundingMetadata, UserProfile } from '../types';

const PROXY_API_ENDPOINT = '/api/gemini-proxy';
const ANALYSIS_TIMEOUT = 300000; // 5分（重い分析用）
const CHAT_TIMEOUT = 60000; // 60秒（チャット用）

async function fetchFromProxy(action: string, payload: any, isStreaming: boolean = false, timeout: number = 30000): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(PROXY_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
            signal: controller.signal,
        });
    
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.details || errorData.error || `Server Error: ${response.status}`;
            const error: any = new Error(errorMessage);
            error.code = errorData.code;
            throw error;
        }
        
        if (isStreaming) return response;
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('通信がタイムアウトしました。安定したネットワーク環境で再度お試しください。');
        }
        throw error;
    }
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
        const response = await fetchFromProxy('getStreamingChatResponse', { messages, aiType, aiName, profile }, true, CHAT_TIMEOUT);
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
                        } catch (e) {
                            // JSONパース失敗時は無視して継続
                        }
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
    const data = await fetchFromProxy('generateSummary', { chatHistory, aiType, aiName, profile }, false, CHAT_TIMEOUT);
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
        return await fetchFromProxy('generateSuggestions', { messages }, false, 15000);
    } catch (e) {
        return { suggestions: [] };
    }
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze }, false, CHAT_TIMEOUT);
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