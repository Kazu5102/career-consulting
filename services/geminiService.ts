
// services/geminiService.ts - v4.43 - Robust Streaming Support for Analysis
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, GroundingMetadata, UserProfile } from '../types';

const PROXY_API_ENDPOINT = '/api/gemini-proxy';
const ANALYSIS_TIMEOUT = 300000; // 5 minutes

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
            const error: any = new Error(errorMessage);
            error.code = errorData.code;
            throw error;
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

// Helper to fetch stream and accumulate text until done, then parse as JSON.
async function fetchStreamAndAccumulateJSON(action: string, payload: any): Promise<any> {
    // Longer timeout for streaming initial connection
    const response = await fetchFromProxy(action, payload, true, 60000);
    
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE format: data: {...}
        const lines = chunk.split('\n\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') break;
                try {
                    const data = JSON.parse(dataStr);
                    if (data.text) fullText += data.text;
                    if (data.error) throw new Error(data.error);
                } catch (e) {
                    // ignore incomplete JSON chunks in SSE data, though we expect valid JSON per line usually
                    if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                       // Only log legitimate errors, not parsing of partials if that were to happen
                    }
                }
            }
        }
    }
    
    try {
        return JSON.parse(fullText);
    } catch (e) {
        // Fallback: try to extract JSON if markdown fencing was included
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error("AIからの応答を解析できませんでした (Invalid JSON)");
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
    error?: {
        message: string;
        code?: string;
    };
}

export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    try {
        const response = await fetchFromProxy('getStreamingChatResponse', { messages, aiType, aiName, profile }, true, 180000);
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
                            if (parsed.type === 'text' || parsed.text) {
                                controller.enqueue({ text: parsed.text || parsed.content }); // Compat with both formats
                            } else if (parsed.type === 'grounding') {
                                controller.enqueue({ groundingMetadata: parsed.content });
                            } else if (parsed.type === 'error' || parsed.error) {
                                const msg = parsed.error?.message || parsed.content || parsed.error;
                                controller.enqueue({ error: { message: msg, code: parsed.code } });
                            }
                        } catch (e) {
                            // Ignore
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
    // Use streaming accumulator
    return await fetchStreamAndAccumulateJSON('analyzeTrajectory', { conversations, userId });
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    return await fetchFromProxy('findHiddenPotential', { conversations, userId }, false, ANALYSIS_TIMEOUT);
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze });
    return data.text;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    // Use streaming accumulator
    return await fetchStreamAndAccumulateJSON('performSkillMatching', { conversations });
};

export const generateSuggestions = async (messages: ChatMessage[], currentDraft?: string): Promise<{ suggestions: string[] }> => {
    try {
        return await fetchFromProxy('generateSuggestions', { messages, currentDraft });
    } catch (e) {
        return { suggestions: [] };
    }
};
