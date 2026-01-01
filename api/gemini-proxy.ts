
// ===================================================================================
//  This is a serverless function that acts as a secure proxy to the Gemini API.
//  It is specifically adapted for Vercel's Node.js runtime environment.
// ===================================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse, Content, Type, Tool } from "@google/genai";

// --- START: Inlined Type Definitions ---
enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

type AIType = 'human' | 'dog';

interface StoredConversation {
  id: number;
  userId: string;
  aiName: string;
  aiType: AIType;
  aiAvatar: string;
  messages: ChatMessage[];
  summary: string;
  date: string;
}

interface ChartDataPoint { label: string; value: number; }

interface AnalysisData {
  keyMetrics: { totalConsultations: number; commonIndustries: string[]; };
  commonChallenges: ChartDataPoint[];
  careerAspirations: ChartDataPoint[];
  commonStrengths: string[];
  overallInsights: string;
  keyTakeaways: string[];
}

interface TrajectoryAnalysisData {
    keyTakeaways: string[];
    userId: string;
    totalConsultations: number;
    consultations: { dateTime: string; estimatedDurationMinutes: number; }[];
    keyThemes: string[];
    detectedStrengths: string[];
    areasForDevelopment: string[];
    suggestedNextSteps: string[];
    overallSummary: string;
}

interface SkillMatchingResult {
  keyTakeaways: string[];
  analysisSummary: string;
  recommendedRoles: { role: string; reason: string; matchScore: number; }[];
  skillsToDevelop: { skill: string; reason: string; }[];
  learningResources: { title: string; type: string; provider: string; }[];
}
// --- END: Inlined Type Definitions ---

let ai: GoogleGenAI | null = null;
const getAIClient = () => {
    if (!ai) {
        if (!process.env.API_KEY) throw new Error("API_KEY not set");
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }
    try {
        const { action, payload } = req.body;
        if (action === 'healthCheck') { res.status(200).json({ status: 'ok' }); return; }
        getAIClient();
        switch (action) {
            case 'getStreamingChatResponse': await handleGetStreamingChatResponse(payload, res); break;
            case 'generateSummary': res.status(200).json(await handleGenerateSummary(payload)); break;
            case 'reviseSummary': res.status(200).json(await handleReviseSummary(payload)); break;
            case 'analyzeConversations': res.status(200).json(await handleAnalyzeConversations(payload)); break;
            case 'analyzeTrajectory': res.status(200).json(await handleAnalyzeTrajectory(payload)); break;
            case 'findHiddenPotential': res.status(200).json(await handleFindHiddenPotential(payload)); break;
            case 'generateSummaryFromText': res.status(200).json(await handleGenerateSummaryFromText(payload)); break;
            case 'performSkillMatching': res.status(200).json(await handlePerformSkillMatching(payload)); break;
            case 'generateSuggestions': res.status(200).json(await handleGenerateSuggestions(payload)); break;
            default: res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

// --- Implementation Handlers ---

async function handleGetStreamingChatResponse(payload: any, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    const contents = messages.map((msg: any) => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    const stream = await getAIClient().models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: { 
            systemInstruction: aiType === 'human' ? `AIキャリアコンサルタント${aiName}です。` : `相談わんこ${aiName}だワン！`,
            tools: [{ googleSearch: {} }] 
        },
    });

    for await (const chunk of stream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], aiType: AIType, aiName: string }) {
    const { chatHistory } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    
    const prompt = `以下のキャリア相談の対話履歴から、2つの視点で要約をJSON形式で生成してください。
    
    1. ユーザー向け (user_summary): 
       - 相談者本人が自分を振り返るための内容。
       - 励ましを含み、気づきや強みを強調する。
       - マークダウン形式で記述。
    
    2. プロ向け (pro_notes): 
       - 次に担当するキャリアコンサルタントへの引継ぎ情報。
       - 構造化され、事実、主訴、見立て、介入のポイントを明確にする。
       - マークダウン形式で記述。

    対話履歴：
    ${historyText}`;
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    user_summary: { type: Type.STRING },
                    pro_notes: { type: Type.STRING }
                },
                required: ["user_summary", "pro_notes"]
            }
        }
    });
    // Return as string for consistent handling in legacy code, but frontend will parse if needed
    return { text: result.text };
}

async function handleReviseSummary(payload: { originalSummary: string, correctionRequest: string }) {
    const { originalSummary, correctionRequest } = payload;
    const prompt = `以下のキャリア相談サマリー(JSON)を、ユーザーの要望に合わせて修正し、再度同じJSON形式で出力してください。
    【元のサマリー】\n${originalSummary}\n
    【修正要望】\n${correctionRequest}`;
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });
    return { text: result.text };
}

async function handleAnalyzeConversations(payload: { summaries: StoredConversation[] }) {
    const { summaries } = payload;
    const prompt = `以下の複数の相談サマリーを分析し、共通の傾向を抽出してください。\n${summaries.map(s => s.summary).join('\n---\n')}`;
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    keyMetrics: { type: Type.OBJECT, properties: { totalConsultations: { type: Type.NUMBER }, commonIndustries: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                    commonChallenges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
                    careerAspirations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
                    commonStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    overallInsights: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(result.text || '{}');
}

async function handleAnalyzeTrajectory(payload: { conversations: StoredConversation[], userId: string }) {
    const { conversations, userId } = payload;
    const prompt = `ユーザーID: ${userId} の相談履歴の変遷を分析してください。\n${conversations.map(c => c.summary).join('\n---\n')}`;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    totalConsultations: { type: Type.NUMBER },
                    keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    detectedStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    overallSummary: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(result.text || '{}');
}

async function handleFindHiddenPotential(payload: { conversations: StoredConversation[] }) {
    const { conversations } = payload;
    const prompt = `以下の相談履歴から、本人が気づいていない潜在的なスキルを抽出してください。\n${conversations.map(c => c.summary).join('\n---\n')}`;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hiddenSkills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } }
                }
            }
        }
    });
    return JSON.parse(result.text || '{}');
}

async function handleGenerateSummaryFromText(payload: { textToAnalyze: string }) {
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `以下のテキストをキャリア相談サマリー(JSON形式: user_summary, pro_notes)として要約してください：\n${payload.textToAnalyze}`,
        config: { responseMimeType: "application/json" }
    });
    return { text: result.text };
}

async function handlePerformSkillMatching(payload: { conversations: StoredConversation[] }) {
    const { conversations } = payload;
    const prompt = `以下の相談履歴に基づき、適性診断を行ってください。\n${conversations.map(c => c.summary).join('\n---\n')}`;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    analysisSummary: { type: Type.STRING },
                    recommendedRoles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { role: { type: Type.STRING }, reason: { type: Type.STRING }, matchScore: { type: Type.NUMBER } } } },
                    skillsToDevelop: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                    learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, provider: { type: Type.STRING } } } }
                }
            }
        }
    });
    return JSON.parse(result.text || '{}');
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[] }) {
    const history = payload.messages.map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `以下の対話の続きとして、ユーザーが聞きそうな質問を3つ提案してください。JSON形式で出力してください。\n${history}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });
    return JSON.parse(result.text || '{"suggestions":[]}');
}
