
// services/geminiService.ts - v4.72 - Robust Streaming Support for Analysis
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, GroundingMetadata, UserProfile } from '../types';
import * as directMockService from './mockGeminiService';

const PROXY_API_ENDPOINT = '/api/gemini-proxy';
const ANALYSIS_TIMEOUT = 300000; // 5 minutes

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchFromProxy(action: string, payload: any, isStreaming: boolean = false, timeout: number = 20000, maxRetries: number = 3): Promise<any> {
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
                // スパイク制限(429)やサーバー過負荷(5xx)の場合はリトライ対象エラーを投げる
                if (response.status === 429 || response.status >= 500) {
                    throw new Error(`RETRY_TARGET_${response.status}`);
                }
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || `サーバーエラー: ${response.status}`;
                const error: any = new Error(errorMessage);
                error.code = errorData.code;
                throw error;
            }
            
            if (isStreaming) return response;
            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            
            const isRetryTarget = error.message && error.message.includes('RETRY_TARGET_');
            const isAbort = error instanceof DOMException && error.name === 'AbortError';

            // タイムアウトまたはリトライ対象(429等)で、かつ最大試行回数に達していない場合はバックオフしてリトライ
            if (attempt < maxRetries && (isRetryTarget || isAbort)) {
                // 指数的バックオフ (約2秒、4秒...) + ゆらぎ(Jitter)
                const backoffMs = (Math.pow(2, attempt) * 1000) + (Math.random() * 1000);
                console.warn(`[API] バックグラウンドで自動リトライを実行します (試行 ${attempt}/${maxRetries-1}). 待機: ${Math.round(backoffMs)}ms. 理由: ${isAbort ? 'Timeout' : error.message}`);
                await delay(backoffMs);
                continue; // ループの先頭に戻ってリトライ
            }

            if (isAbort) {
                throw new Error('タイムアウトしました。');
            }
            
            if (isRetryTarget) {
                const code = error.message.split('_')[2];
                const finalError: any = new Error(`現在アクセスが集中しています (${code})`);
                finalError.code = parseInt(code);
                throw finalError;
            }

            throw error;
        }
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
                
                let data;
                try {
                    data = JSON.parse(dataStr);
                } catch (parseError) {
                    continue; // Ignore partial chunks in JSON.parse
                }
                
                if (data.error) {
                     const errorMsg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                     throw new Error(errorMsg); // Propagate actual error up to the top level
                }
                if (data.text) {
                     fullText += data.text;
                }
            }
        }
    }
    
    try {
        return JSON.parse(fullText);
    } catch (e) {
        // Fallback: try to extract JSON if markdown fencing was included
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            }
        }
        console.error("Original fullText:", fullText);
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
    try {
        return await fetchStreamAndAccumulateJSON('analyzeTrajectory', { conversations, userId });
    } catch (e) {
        console.warn('API error in analyzeTrajectory, falling back to mock.', e);
        return await directMockService.analyzeTrajectory(conversations, userId);
    }
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    return await fetchFromProxy('findHiddenPotential', { conversations, userId }, false, ANALYSIS_TIMEOUT);
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze });
    return data.text;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    try {
        return await fetchStreamAndAccumulateJSON('performSkillMatching', { conversations });
    } catch (e) {
        console.warn('API error in performSkillMatching, falling back to mock.', e);
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
