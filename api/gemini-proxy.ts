
// api/gemini-proxy.ts - v4.62 - Phased Analysis Support
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// Vercel Serverless Function Configuration
export const config = {
  maxDuration: 60, // Maximum allowed duration
};

enum MessageAuthor { USER = 'user', AI = 'ai' }
interface ChatMessage { 
    author: MessageAuthor; 
    text: string; 
    image?: { data: string; mimeType: string };
}
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
        if (!process.env.API_KEY) throw new Error("API_KEY not set in environment variables.");
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

// Helper to stream JSON chunks back to client to keep connection alive
async function streamGeminiResponse(res: VercelResponse, modelCall: () => Promise<any>) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.write(': start\n\n');

    try {
        const stream = await modelCall();
        for await (const chunk of stream) {
            const text = chunk.text;
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
        console.error(`[Proxy Error] ${error.message}`);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.end();
        }
    }
}

async function handleAnalyzeTrajectoryStream(payload: { conversations: StoredConversation[], userId: string, phase?: string }, res: VercelResponse) {
    const { conversations, phase = 'basic' } = payload;
    const historyText = conversations.map(c => `[日付: ${c.date}]\n${c.summary}`).join('\n---\n');
    
    let prompt = "";
    let schema: any = {};

    // Phased Execution Strategy to prevent timeouts
    switch (phase) {
        case 'basic':
            prompt = `あなたはキャリアコンサルタントのスーパーバイザーです。相談履歴から【全体像】と【緊急度】を分析してください。
出力項目:
- overallSummary: 内的変容プロセスのサマリー (300文字程度)
- triageLevel: 介入の緊急度 (high/medium/low)
- ageStageGap: 心理的発達段階と実年齢の乖離度 (0-100%)
履歴:
${historyText}`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    overallSummary: { type: Type.STRING },
                    triageLevel: { type: Type.STRING, enum: ["high", "medium", "low"] },
                    ageStageGap: { type: Type.NUMBER }
                },
                required: ["overallSummary", "triageLevel", "ageStageGap"]
            };
            break;

        case 'insight':
            prompt = `あなたはキャリアコンサルタントのスーパーバイザーです。相談履歴から【主要な気づき】と【次回セッションへの導入】を分析してください。
出力項目:
- keyTakeaways: 臨床的な主要な指摘事項 (3〜5点)
- sessionStarter: 次回セッションで使える具体的な問いかけ (1文)
履歴:
${historyText}`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sessionStarter: { type: Type.STRING }
                },
                required: ["keyTakeaways", "sessionStarter"]
            };
            break;

        case 'clinical':
            prompt = `あなたはキャリアコンサルタントのスーパーバイザーです。相談履歴から【理論的背景】と【専門家への助言】を分析してください。
出力項目:
- theoryBasis: 適用可能なキャリア理論とその根拠
- expertAdvice: 担当コンサルタントへのスーパービジョン・アドバイス
履歴:
${historyText}`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    theoryBasis: { type: Type.STRING },
                    expertAdvice: { type: Type.STRING }
                },
                required: ["theoryBasis", "expertAdvice"]
            };
            break;
            
        default:
            throw new Error("Invalid phase for trajectory analysis");
    }

    await streamGeminiResponse(res, () => getAIClient().models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    }));
}

async function handlePerformSkillMatchingStream(payload: { conversations: StoredConversation[], phase?: string }, res: VercelResponse) {
    const { conversations, phase = 'profile' } = payload;
    const historyText = conversations.map(c => c.summary).join('\n');
    
    let prompt = "";
    let schema: any = {};

    switch (phase) {
        case 'profile':
            prompt = `相談者の履歴から、キャリアプロファイルと強みを分析してください。
出力項目:
- analysisSummary: キャリアプロファイルの分析サマリー
履歴:
${historyText}`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    analysisSummary: { type: Type.STRING }
                },
                required: ["analysisSummary"]
            };
            break;

        case 'roles':
            prompt = `相談者の経験と強みに基づき、現実的な「地続きの適職」を最大3つ提案してください。
出力項目:
- recommendedRoles: 推奨職種リスト (職種名、理由、適合スコア)
履歴:
${historyText}`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    recommendedRoles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { role: { type: Type.STRING }, reason: { type: Type.STRING }, matchScore: { type: Type.NUMBER } } } }
                },
                required: ["recommendedRoles"]
            };
            break;

        case 'growth':
            prompt = `相談者の市場価値を高めるために必要なスキルと学習リソースを提案してください。
出力項目:
- skillsToDevelop: 伸ばすべきスキル (最大3つ)
- learningResources: 具体的な学習リソース (最大3つ)
履歴:
${historyText}`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    skillsToDevelop: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                    learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, provider: { type: Type.STRING } } } }
                },
                required: ["skillsToDevelop", "learningResources"]
            };
            break;

        default:
            throw new Error("Invalid phase for skill matching");
    }

    await streamGeminiResponse(res, () => getAIClient().models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    }));
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    const roleDefinition = aiType === 'human' 
        ? { role: "Professional Career Consultant", tone: "冷静、誠実、論理的なプロの敬語" }
        : { role: "Compassionate Partner (Dog)", tone: "親しみやすい、癒やし、肯定的（語尾ワン）" };

    const systemInstruction = `
名前: ${aiName}
役割: ${roleDefinition.role}
トーン: ${roleDefinition.tone}
相談者プロファイル: ${JSON.stringify(profile)}
回答冒頭に [HAPPY], [CURIOUS], [THINKING], [REASSURE] のいずれかのタグを付与してください。
`.trim();

    // Map messages to Gemini Content structure (handles image data)
    const contents = messages.map(msg => {
        const parts: any[] = [{ text: msg.text }];
        if (msg.image && msg.image.data) {
            parts.push({
                inlineData: {
                    mimeType: msg.image.mimeType,
                    data: msg.image.data
                }
            });
        }
        return {
            role: msg.author === MessageAuthor.USER ? 'user' : 'model',
            parts: parts,
        };
    });

    await streamGeminiResponse(res, () => getAIClient().models.generateContentStream({
        model: 'gemini-3-flash-preview', 
        contents,
        config: { 
            systemInstruction, 
            temperature: 0.7,
            thinkingConfig: { thinkingBudget: 0 } 
        },
    }));
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `履歴からサマリーを生成してください。JSONで返してください。\n履歴: ${historyText}`,
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
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `文脈からユーザーの返答を予測してください。\n履歴: ${messages.slice(-3).map(m => m.text).join('\n')}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } } }
        }
    });
    return JSON.parse(result.text || "{\"suggestions\":[]}");
}
