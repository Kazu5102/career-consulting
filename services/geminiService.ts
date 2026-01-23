
// services/geminiService.ts - v4.11 - Resilience Core (Simple & Robust)
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, UserProfile } from '../types';

const PROXY_API_ENDPOINT = '/api/gemini-proxy';
const CHAT_TIMEOUT = 40000; 
const ANALYSIS_TIMEOUT = 60000;

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
            throw new Error(errorData.error || `サーバー通信エラー (${response.status})`);
        }
        
        if (isStreaming) return response;
        return response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('通信がタイムアウトしました。電波環境の良い場所で再度お試しください。');
        }
        throw error;
    }
}

export const checkServerStatus = async () => fetchFromProxy('healthCheck', {}, false, 15000);

export interface StreamUpdate {
    text?: string;
    error?: { message: string; };
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
                const { done, value } = await reader.read();
                if (done) { controller.close(); return; }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim().startsWith('data: ')) continue;
                    const jsonStr = line.trim().slice(6);
                    if (jsonStr === '[DONE]') { controller.close(); return; }
                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.type === 'text') controller.enqueue({ text: parsed.content });
                        else if (parsed.type === 'error') controller.enqueue({ error: { message: parsed.content } });
                    } catch (e) {}
                }
            },
            cancel() { reader.cancel(); }
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

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile) => {
    const data = await fetchFromProxy('generateSummary', { chatHistory, aiType, aiName, profile }, false, CHAT_TIMEOUT);
    return data.text;
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => 
    fetchFromProxy('analyzeTrajectory', { conversations, userId }, false, ANALYSIS_TIMEOUT);

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => 
    fetchFromProxy('performSkillMatching', { conversations }, false, ANALYSIS_TIMEOUT);

export const generateSuggestions = async (messages: ChatMessage[]) => 
    fetchFromProxy('generateSuggestions', { messages }, false, 20000).catch(() => ({ suggestions: [] }));

export const generateSummaryFromText = async (textToAnalyze: string) => {
    const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze }, false, CHAT_TIMEOUT);
    return data.text;
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string) => {
    const data = await fetchFromProxy('reviseSummary', { originalSummary, correctionRequest }, false, CHAT_TIMEOUT);
    return data.text;
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => 
    fetchFromProxy('analyzeConversations', { summaries }, false, ANALYSIS_TIMEOUT);

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => 
    fetchFromProxy('findHiddenPotential', { conversations, userId }, false, ANALYSIS_TIMEOUT);
