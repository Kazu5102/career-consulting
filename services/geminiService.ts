
// services/geminiService.ts - v4.74 - Communication Lockdown: Removed all direct env var references from browser context
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, GroundingMetadata, UserProfile } from '../types';
import * as directMockService from './mockGeminiService';

const PROXY_API_ENDPOINT = '/api/gemini-proxy';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchFromProxy(action: string, payload: any, isStreaming: boolean = false, timeout: number = 20000, maxRetries: number = 2): Promise<any> {
    let attempt = 0;
    while (attempt < maxRetries) {
        attempt++;
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
                if (response.status === 429 || response.status >= 500) {
                    throw new Error(`RETRY_TARGET_${response.status}`);
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            if (isStreaming) return response;
            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            
            const isRetryTarget = error.message && error.message.includes('RETRY_TARGET_');
            const isAbort = error instanceof DOMException && error.name === 'AbortError';

            if (attempt < maxRetries && (isRetryTarget || isAbort)) {
                await delay(2000 * attempt);
                continue;
            }
            throw error;
        }
    }
}

// Helper to fetch stream and accumulate text until done
async function fetchStreamAndAccumulateJSON(action: string, payload: any): Promise<any> {
    const response = await fetchFromProxy(action, payload, true, 60000);
    
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') break;
                
                try {
                    const data = JSON.parse(dataStr);
                    if (data.error) throw new Error(data.error);
                    if (data.text) fullText += data.text;
                } catch (parseError: any) {
                    if (parseError.message && parseError.message.includes('RETRY_TARGET')) throw parseError;
                    continue; 
                }
            }
        }
    }
    
    try {
        // Extract JSON using broad match if needed
        const jsonContent = fullText.includes('{') ? fullText.substring(fullText.indexOf('{'), fullText.lastIndexOf('}') + 1) : fullText;
        return JSON.parse(jsonContent);
    } catch (e) {
        console.error("Accumulated text was not valid JSON:", fullText);
        throw new Error("AI応答の解析に失敗しました。");
    }
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

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) continue;
                        
                        const jsonStr = trimmed.slice(6);
                        if (jsonStr === '[DONE]') {
                            controller.close();
                            return;
                        }

                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.text) {
                                controller.enqueue({ text: parsed.text });
                            } else if (parsed.error) {
                                controller.enqueue({ error: { message: parsed.error } });
                            }
                        } catch (e) { /* ignore partials */ }
                    }
                } catch (e: any) {
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
                controller.enqueue({ error: { message: error.message } });
                controller.close();
            }
        });
    }
};

export const checkServerStatus = async (): Promise<{status: string}> => {
    try {
        const response = await fetch(PROXY_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'healthCheck', payload: {} }),
        });
        return response.json();
    } catch (error) { return { status: 'error' }; }
};

export interface StreamUpdate {
    text?: string;
    error?: { message: string; code?: string; };
}

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    const data = await fetchFromProxy('generateSummary', { chatHistory, aiType, aiName, profile });
    return data.text || "";
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    try {
        return await fetchStreamAndAccumulateJSON('analyzeTrajectory', { conversations, userId });
    } catch (e) {
        return await directMockService.analyzeTrajectory(conversations, userId);
    }
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    try {
        return await fetchStreamAndAccumulateJSON('performSkillMatching', { conversations });
    } catch (e) {
        return await directMockService.performSkillMatching(conversations);
    }
};

export const generateSuggestions = async (messages: ChatMessage[], currentDraft?: string): Promise<{ suggestions: string[] }> => {
    try {
        return await fetchFromProxy('generateSuggestions', { messages, currentDraft });
    } catch (e) {
        return { suggestions: [] };
    }
};
