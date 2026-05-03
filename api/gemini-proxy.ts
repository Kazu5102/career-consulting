
// api/gemini-proxy.ts - v5.51 - 2026-05-03 - Final API Integration: Prioritizing registered GOOGLE_GENAI_API_KEY
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// 最新のスキルガイドラインに基づくモデル選定
const CHAT_MODEL = 'gemini-3-flash-preview';
const ANALYSIS_MODEL = 'gemini-3.1-pro-preview';
const LITE_MODEL = 'gemini-3.1-flash-lite-preview';

// Vercel Serverless Function Configuration
export const config = {
  maxDuration: 120, 
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
        // [RESILIENCE] AI Studioのあらゆる設定パターンを網羅
        const apiKey = 
            process.env.GOOGLE_GENAI_API_KEY || 
            process.env.GEMINI_API_KEY || 
            process.env.API_KEY || 
            process.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("[CRITICAL] API Key is missing.");
            throw new Error("APIキーが設定されていません。画面左下の歯車アイコン(Settings)をクリックし、'Secrets' セクションに 'GEMINI_API_KEY' という名前でAPIキーを登録してください。");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

// SSE streaming helper
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
            // クォータ不足(429)時のフォールバック
            if (error.message?.includes('429') && initialModel !== LITE_MODEL) {
                console.warn(`[Quota Alert] Fallback to ${LITE_MODEL}`);
                res.write(`data: ${JSON.stringify({ status: 'quota_fallback' })}\n\n`);
                stream = await modelCall(LITE_MODEL);
            } else {
                throw error;
            }
        }

        for await (const chunk of stream) {
            try {
                // SDK v1.19.0: .text はプロパティ。メソッドではない。
                const text = chunk.text || "";
                if (typeof text === 'string' && text.length > 0) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
            } catch (chunkError) {
                // チャンクパース失敗時はスキップ
                console.error("Stream Chunk Error:", chunkError);
            }
        }
        res.write('data: [DONE]\n\n');
    } catch (error: any) {
        console.error("Proxy Stream Error:", error);
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
            case 'analyzeTrajectory':
                await handleAnalyzeTrajectoryStream(payload, res);
                break;
            case 'performSkillMatching':
                await handlePerformSkillMatchingStream(payload, res);
                break;
            case 'generateSummary': 
                res.status(200).json(await handleGenerateSummary(payload)); 
                break;
            case 'generateSuggestions': 
                res.status(200).json(await handleGenerateSuggestions(payload)); 
                break;
            default: 
                res.status(400).json({ error: `Invalid action: ${action}` });
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
    const targetConversations = conversations.slice(-5);
    const historyText = targetConversations.map(c => `[${c.date}]: ${c.summary}`).join('\n---\n');

    const prompt = `あなたはキャリア理論（サビカス、シュロスバーグ等）に精通したスーパーバイザーです。
以下の対話履歴を元に、クライアントの内的変容と理論的背景をJSONで詳細に分析してください。
履歴:
${historyText}`;

    await streamGeminiResponse(res, (modelName) => getAIClient().models.generateContentStream({
        model: modelName,
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
                    sessionStarter: { type: Type.STRING },
                    keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    detectedStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areasForDevelopment: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    reframedSkills: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: {
                                userWord: { type: Type.STRING },
                                professionalSkill: { type: Type.STRING },
                                insight: { type: Type.STRING }
                            },
                            required: ["userWord", "professionalSkill", "insight"]
                        } 
                    }
                },
                required: ["keyTakeaways", "overallSummary", "triageLevel", "ageStageGap", "theoryBasis", "expertAdvice", "sessionStarter", "keyThemes", "detectedStrengths", "areasForDevelopment", "suggestedNextSteps", "reframedSkills"]
            }
        }
    }), ANALYSIS_MODEL);
}

async function handlePerformSkillMatchingStream(payload: { conversations: StoredConversation[] }, res: VercelResponse) {
    const { conversations } = payload;
    const targetConversations = conversations.slice(-5);
    const historyText = targetConversations.map(c => c.summary).join('\n');
    const prompt = `履歴から適職診断を行いJSONで出力してください。
履歴:
${historyText}`;

    await streamGeminiResponse(res, (modelName) => getAIClient().models.generateContentStream({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                required: ["keyTakeaways", "analysisSummary", "recommendedRoles", "skillsToDevelop", "learningResources"]
            }
        }
    }), ANALYSIS_MODEL);
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    const recentMessages = messages.slice(-12);
    const systemInstruction = `あなたは「${aiName}」というキャリアコンサルタントです。
種別: ${aiType === 'dog' ? '犬の癒やし担当' : '共感的カウンセラー'}
ユーザー情報: ${JSON.stringify(profile)}
方針: 100%の共感と傾聴。決して説教せず、ユーザーが自ら答えを出せるよう優しく問いかけてください。`;
    
    const contents = recentMessages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    await streamGeminiResponse(res, (modelName) => getAIClient().models.generateContentStream({
        model: modelName, 
        contents,
        config: { systemInstruction, temperature: 0.8, topP: 0.95 },
    }), CHAT_MODEL);
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory } = payload;
    const historyText = chatHistory.slice(-20).map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: LITE_MODEL,
        contents: `対話要約をJSONで生成せよ。履歴:\n${historyText}`,
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
    const prompt = `次の返答案3つをJSON { suggestions: [string] } で出せ。履歴:\n${messages.slice(-4).map(m => m.text).join('\n')}\n入力中: ${currentDraft || ''}`;
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
    try {
        return JSON.parse(result.text || '{"suggestions":[]}');
    } catch {
        return { suggestions: [] };
    }
}

