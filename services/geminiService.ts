
// services/geminiService.ts - v2.11 - Robust Stream Handling
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, GroundingMetadata, UserProfile } from '../types';

const PROXY_API_ENDPOINT = '/api/gemini-proxy';
const ANALYSIS_TIMEOUT = 300000;

async function fetchFromProxy(action: string, payload: any, isStreaming: boolean = false, timeout: number = 20000): Promise<any> {
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
            const errorMessage = errorData.details || errorData.error || `サーバーエラー: ${response.status}`;
            throw new Error(errorMessage);
        }
        
        if (isStreaming) return response;
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('タイムアウトしました。');
        }
        throw error;
    }
}

export const checkServerStatus = async (): Promise<{status: string}> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(PROXY_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'healthCheck', payload: {} }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

export interface StreamUpdate {
    text?: string;
    groundingMetadata?: GroundingMetadata;
}

export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    try {
        const response = await fetchFromProxy('getStreamingChatResponse', { messages, aiType, aiName, profile }, true, 60000);
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
                        // CRITICAL: Immediately close if [DONE] is received to prevent hanging
                        if (jsonStr === '[DONE]') {
                            controller.close();
                            await reader.cancel();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.type === 'text') {
                                controller.enqueue({ text: parsed.content });
                            } else if (parsed.type === 'grounding') {
                                controller.enqueue({ groundingMetadata: parsed.content });
                            }
                        } catch (e) {
                            console.warn("JSON Parse Error", jsonStr);
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
    } catch (error) {
        throw error;
    }
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    const data = await fetchFromProxy('generateSummary', { chatHistory, aiType, aiName, profile }, false, 60000);
    return data.text;
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    const data = await fetchFromProxy('reviseSummary', { originalSummary, correctionRequest });
    return data.text;
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    return await fetchFromProxy('analyzeConversations', { summaries }, false, ANALYSIS_TIMEOUT);
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    return await fetchFromProxy('analyzeTrajectory', { conversations, userId }, false, ANALYSIS_TIMEOUT);
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    return await fetchFromProxy('findHiddenPotential', { conversations, userId }, false, ANALYSIS_TIMEOUT);
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze });
    return data.text;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    return await fetchFromProxy('performSkillMatching', { conversations }, false, ANALYSIS_TIMEOUT);
};

export const generateSuggestions = async (messages: ChatMessage[]): Promise<{ suggestions: string[] }> => {
    try {
        return await fetchFromProxy('generateSuggestions', { messages });
    } catch (e) {
        return { suggestions: [] };
    }
};
