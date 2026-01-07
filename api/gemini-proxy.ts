
// api/gemini-proxy.ts - v3.11 - Analysis Handlers Implementation
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

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
        if (!process.env.API_KEY) throw new Error("API_KEY not set in environment variables.");
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
                res.status(200).json(await handleAnalyzeTrajectory(payload));
                break;
            case 'performSkillMatching':
                res.status(200).json(await handlePerformSkillMatching(payload));
                break;
            default: 
                res.status(400).json({ error: `Invalid action received: '${action}'.` });
        }
    } catch (error: any) {
        console.error(`[Proxy Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

async function handleAnalyzeTrajectory(payload: { conversations: StoredConversation[], userId: string }) {
    const { conversations } = payload;
    const historyText = conversations.map(c => `[${c.date}] Summary: ${c.summary}`).join('\n---\n');
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `あなたは熟練のスーパーバイザーです。以下の相談履歴（要約）から相談者の変容の軌跡を臨床的に分析してください。
履歴:
${historyText}`,
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
    });
    return robustParseJSON(result.text || "{}");
}

async function handlePerformSkillMatching(payload: { conversations: StoredConversation[] }) {
    const { conversations } = payload;
    const historyText = conversations.map(c => c.summary).join('\n');
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `相談者の強みを再定義し、市場価値と適職を診断してください。
履歴:
${historyText}`,
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
                    skillsToDevelop: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            }
                        }
                    }
                },
                required: ["analysisSummary", "recommendedRoles", "skillsToDevelop"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    
    const roleDefinition = aiType === 'human' 
        ? {
            role: "Professional Career Consultant",
            tone: "冷静、誠実、論理的、かつ温かいプロの敬語",
            mindset: "相談者の自己効力感を高め、キャリア・コンストラクション理論に基づき人生のテーマを共に探求する。過度な励ましより、深い理解と問いかけを重視する。"
          }
        : {
            role: "Compassionate Support Partner (Dog)",
            tone: "親しみやすい、元気、無条件の肯定的関心（語尾に『ワン』）",
            mindset: "心理的安全性（ラポール）の形成を最優先し、相談者の感情に寄り添う。難しい分析よりも『今のあなたのままで素晴らしい』というメッセージを届ける。"
          };

    const systemInstruction = `
あなたは「Career Consulting」システムの専属エージェント、名前は「${aiName}」です。
以下の構造化された指示に従い、相談者の内省を深くサポートしてください。

### 1. あなたの属性
- 役割: ${roleDefinition.role}
- トーン: ${roleDefinition.tone}
- 思考プロセス: ${roleDefinition.mindset}

### 2. 相談者プロファイル
- 年齢/性別: ${profile.age || '未設定'} / ${profile.gender || '未設定'}
- キャリアステージ: ${profile.stage || '未設定'}
- 主要な主訴: ${profile.complaint || '未設定'}

### 3. コンサルティング・プロトコル
1. 成人向けサービスです。相談者本人のキャリアと実存に焦点を当ててください。
2. ナラティブ・アプローチを用い、「開かれた質問」を効果的に挟んでください。

### 4. 出力形式（厳守）
回答の冒頭に、必ず現在の文脈に最適な感情タグを1つ付与してください。
タグの種類: [HAPPY], [CURIOUS], [THINKING], [REASSURE]
`.trim();

    const contents = messages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    try {
        const stream = await getAIClient().models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents,
            config: { systemInstruction, temperature: 0.75 },
        });
        for await (const chunk of stream) {
            if (chunk.text) res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
        }
    } catch (e: any) {
        res.write(`data: ${JSON.stringify({ type: 'error', content: e.message })}\n\n`);
    } finally {
        res.write('data: [DONE]\n\n');
        res.end();
    }
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory, profile } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `以下の相談履歴からサマリーを生成してください。
履歴:
${historyText}`,
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
    return { text: result.text || "{}" };
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[] }) {
    const { messages } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `キャリア相談の文脈において、相談者が次に発話しやすい候補を3つ日本語で提案してください。
履歴: ${messages.map(m => `${m.author}: ${m.text}`).join('\n')}`,
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
