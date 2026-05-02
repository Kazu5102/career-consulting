
// api/gemini-proxy.ts - v5.43 - 2026-05-02 - Precision Stabilization: Fixed streaming property access and context slicing
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// プロフェッショナル設定：精度重視と安定重視のハイブリッド
const PRECISION_MODEL = 'gemini-3-flash-preview';
const LITE_MODEL = 'gemini-1.5-flash';

// Vercel Serverless Function Configuration
export const config = {
  maxDuration: 60, 
};

enum MessageAuthor { USER = 'user', AI = 'ai' }
interface ChatMessage { author: MessageAuthor; text: string; }
type AIType = 'human' | 'dog';

interface UserProfile {
  stage?: string;
  age?: string;
  gender?: string;
  complaint?: string;
  lifeRoles?: string[];
}

interface StoredConversation {
  id: number;
  userId: string;
  messages: ChatMessage[];
  summary: string;
  date: string;
}

let ai: GoogleGenAI | null = null;
const getAIClient = () => {
    if (!ai) {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment variables.");
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

function robustParseJSON(text: string) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { return JSON.parse(jsonMatch[0]); } catch (e2) { throw new Error("Structured JSON extraction failed"); }
        }
        throw e;
    }
}

// Helper to stream JSON chunks with automatic 429 fallback
async function streamGeminiResponse(res: VercelResponse, modelCall: (modelName: string) => Promise<any>, initialModel: string) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.write(': start\n\n');

    try {
        let stream;
        try {
            stream = await modelCall(initialModel);
        } catch (error: any) {
            // クォータ不足(429)の場合、回数制限に余裕のあるStableモデルでリトライ
            if (error.message?.includes('429') && initialModel !== LITE_MODEL) {
                console.warn(`[Quota Alert] Fallback to ${LITE_MODEL} for stability`);
                res.write(`data: ${JSON.stringify({ status: 'quota_fallback', message: 'Stable mode activated' })}\n\n`);
                stream = await modelCall(LITE_MODEL);
            } else {
                throw error;
            }
        }

        for await (const chunk of stream) {
            const text = chunk.text; // SDK spec update: use property access
            if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
    } catch (error: any) {
        console.error("Streaming Error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
        res.end();
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }
    
    try {
        const { action, payload } = req.body;
        if (action === 'healthCheck') { res.status(200).json({ status: 'ok' }); return; }
        
        switch (action) {
            case 'getStreamingChatResponse': 
                await handleGetStreamingChatResponse(payload, res); 
                break;
            case 'generateSummary': 
                res.status(200).json(await handleGenerateSummary(payload)); 
                break;
            case 'generateSuggestions': 
                res.status(200).json(await handleGenerateSuggestions(payload)); 
                break;
            case 'analyzeTrajectory':
                await handleAnalyzeTrajectoryStream(payload, res);
                break;
            case 'performSkillMatching':
                await handlePerformSkillMatchingStream(payload, res);
                break;
            default: 
                res.status(400).json({ error: `Invalid action received: '${action}'.` });
        }
    } catch (error: any) {
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.end();
        }
    }
}

async function handleAnalyzeTrajectoryStream(payload: { conversations: StoredConversation[], userId: string }, res: VercelResponse) {
    const { conversations } = payload;
    // 精度維持のため最新5件まで拡張（Plan A+）
    const targetConversations = conversations.slice(-5);
    const historyText = targetConversations.map(c => `[${c.date}]: ${c.summary}`).join('\n---\n');
    const isSingleSession = targetConversations.length === 1;

    const prompt = `あなたはキャリアコンサルタントの「スーパーバイザー」です。内的変容プロセスを鋭く分析してください。JSON形式で出力。
前提: ${isSingleSession ? '1件のみの履歴から微細な揺れ動きを分析' : '時系列での内的変容を分析'}
履歴:
${historyText}`;

    await streamGeminiResponse(res, (model) => getAIClient().models.generateContentStream({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    overallSummary: { type: Type.STRING },
                    triageLevel: { type: Type.STRING, enum: ["high", "medium", "low"] },
                    ageStageGap: { type: Type.NUMBER },
                    theoryBasis: { type: Type.STRING },
                    expertAdvice: { type: Type.STRING },
                    sessionStarter: { type: Type.STRING }
                },
                required: ["keyTakeaways", "overallSummary", "triageLevel", "ageStageGap", "theoryBasis", "expertAdvice", "sessionStarter"]
            }
        }
    }), PRECISION_MODEL);
}

async function handlePerformSkillMatchingStream(payload: { conversations: StoredConversation[] }, res: VercelResponse) {
    const { conversations } = payload;
    // 最新5件に拡張
    const targetConversations = conversations.slice(-5);
    const historyText = targetConversations.map(c => c.summary).join('\n');
    const prompt = `キャリアパス・コーディネーターとして現実的な適職をJSONで提案してください。
履歴:
${historyText}`;

    await streamGeminiResponse(res, (model) => getAIClient().models.generateContentStream({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysisSummary: { type: Type.STRING },
                    recommendedRoles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                role: { type: Type.STRING },
                                reason: { type: Type.STRING },
                                matchScore: { type: Type.NUMBER }
                            }
                        }
                    },
                    skillsToDevelop: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                    learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, provider: { type: Type.STRING } } } }
                },
                required: ["analysisSummary", "recommendedRoles", "skillsToDevelop", "learningResources"]
            }
        }
    }), PRECISION_MODEL);
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    // 最新10件に拡張し、文脈の安定性を向上
    const recentMessages = messages.slice(-10);
    const systemInstruction = `名前: ${aiName}, 種別: ${aiType}, プロファイル: ${JSON.stringify(profile)}. 共感・傾聴を最優先。内省を促す。`;
    
    const contents = recentMessages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    await streamGeminiResponse(res, (model) => getAIClient().models.generateContentStream({
        model, 
        contents,
        config: { systemInstruction, temperature: 0.7 },
    }), PRECISION_MODEL);
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory } = payload;
    // サマリー用は全履歴でも良いが念の為直近20件
    const historyText = chatHistory.slice(-20).map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: LITE_MODEL,
        contents: `対話履歴から要約と専門家向けメモをJSONで生成してください。履歴:\n${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { user_summary: { type: Type.STRING }, pro_notes: { type: Type.STRING } },
                required: ["user_summary", "pro_notes"]
            }
        }
    });
    return { text: result.text || "{}" };
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[], currentDraft?: string }) {
    const { messages, currentDraft } = payload;
    // 最新4件に絞り込み
    const prompt = `次の一言フレーズを3つ予測。JSON { suggestions: string[] } で返却。履歴:\n${messages.slice(-4).map(m => m.text).join('\n')}\n入力中: ${currentDraft || ''}`;
    const result = await getAIClient().models.generateContent({
        model: LITE_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ["suggestions"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

