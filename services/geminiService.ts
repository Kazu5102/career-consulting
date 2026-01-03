
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, GroundingMetadata, UserProfile } from '../types';

const PROXY_API_ENDPOINT = '/api/gemini-proxy'; // The serverless function endpoint
const ANALYSIS_TIMEOUT = 300000; // 5 minutes for long-running tasks

// Helper function to handle fetch requests and errors
async function fetchFromProxy(action: string, payload: any, isStreaming: boolean = false, timeout: number = 20000): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout); // Use dynamic timeout

    try {
        const response = await fetch(PROXY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
            signal: controller.signal, // Link the abort controller
        });
    
        clearTimeout(timeoutId); // Clear the timeout if the request completes in time

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Gracefully handle non-json error responses
            const errorMessage = errorData.details || errorData.error || `サーバーがステータス ${response.status} で応答しました。`;
            throw new Error(`${errorMessage}`);
        }
        
        // For streaming, we return the whole response to access the body elsewhere
        if (isStreaming) {
            return response;
        }
        
        // For non-streaming, we parse the JSON here
        return response.json();

    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('サーバーからの応答がタイムアウトしました。しばらくしてからもう一度お試しください。');
        }
        // Re-throw other network errors or errors from the !response.ok block
        throw error;
    }
}

export const checkServerStatus = async (): Promise<{status: string}> => {
    // Use a shorter timeout for the health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    try {
        const response = await fetch(PROXY_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'healthCheck', payload: {} }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};


export interface StreamUpdate {
    text?: string;
    groundingMetadata?: GroundingMetadata;
}

// FIX: Updated getStreamingChatResponse to accept UserProfile.
export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    try {
        // Pass isStreaming = true to get the raw response object
        const response = await fetchFromProxy('getStreamingChatResponse', { messages, aiType, aiName, profile }, true);
        
        // This check is crucial. If the response is not OK, we must not attempt to read the body.
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             const errorMessage = errorData.details || `サーバーエラー (ステータス: ${response.status})`;
             throw new Error(errorMessage);
        }

        const rawStream = response.body;
        if (!rawStream) return null;

        // Transform the raw byte stream (SSE) into a stream of parsed update objects
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
                    // Keep the last part in buffer if it doesn't end with \n\n (it's incomplete)
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) continue;
                        
                        const jsonStr = trimmed.slice(6);
                        if (jsonStr === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.type === 'text') {
                                controller.enqueue({ text: parsed.content });
                            } else if (parsed.type === 'grounding') {
                                controller.enqueue({ groundingMetadata: parsed.content });
                            }
                        } catch (e) {
                            console.warn("Failed to parse SSE data:", jsonStr, e);
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
        console.error("Streaming chat proxy error:", error);
        throw new Error(`サーバーとの通信に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// FIX: Updated generateSummary to accept UserProfile.
export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    try {
        const data = await fetchFromProxy('generateSummary', { chatHistory, aiType, aiName, profile });
        return data.text;
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error(`サマリー生成APIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    try {
        const data = await fetchFromProxy('reviseSummary', { originalSummary, correctionRequest });
        return data.text;
    } catch (error) {
        console.error("Error revising summary:", error);
        throw new Error(`サマリー修正APIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    try {
        return await fetchFromProxy('analyzeConversations', { summaries }, false, ANALYSIS_TIMEOUT);
    } catch (error) {
        console.error("Error generating analysis:", error);
        throw new Error(`総合分析APIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    try {
        return await fetchFromProxy('analyzeTrajectory', { conversations, userId }, false, ANALYSIS_TIMEOUT);
    } catch (error) {
        console.error("Error generating trajectory analysis:", error);
        throw new Error(`相談軌跡の分析APIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    try {
        return await fetchFromProxy('findHiddenPotential', { conversations, userId }, false, ANALYSIS_TIMEOUT);
    } catch (error) {
        console.error("Error finding hidden potential:", error);
        throw new Error(`隠れた可能性の分析APIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    try {
        const data = await fetchFromProxy('generateSummaryFromText', { textToAnalyze });
        return data.text;
    } catch (error) {
        console.error("Error generating summary from text:", error);
        throw new Error(`テキストからのサマリー生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    try {
        return await fetchFromProxy('performSkillMatching', { conversations }, false, ANALYSIS_TIMEOUT);
    } catch (error) {
        console.error("Error generating skill matching analysis:", error);
        throw new Error(`スキルマッチングAPIの呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const generateSuggestions = async (messages: ChatMessage[]): Promise<{ suggestions: string[] }> => {
    try {
        return await fetchFromProxy('generateSuggestions', { messages });
    } catch (error) {
        console.error("Error generating suggestions:", error);
        throw new Error(`質問候補の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
};
