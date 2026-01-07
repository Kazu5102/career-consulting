
// api/gemini-proxy.ts - v3.14 - Specialized Expert Insight Logic
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
    const historyText = conversations.map(c => `[日付: ${c.date}]\n${c.summary}`).join('\n---\n');
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `あなたは臨床心理の深い知見を持つ、キャリアコンサルタントの「スーパーバイザー」です。
職種提案やスキルマッチングは行わず、相談者の【内的変容のプロセス】のみを鋭く分析してください。

### 分析指示:
1. 相談者の自己開示レベルの変化（防衛から自己一致へ）を時系列で追う。
2. キャリア・コンストラクション理論における「ライフテーマ」の萌芽を特定する。
3. 表層的な悩み（不満）の背後にある「真の課題」を心理学的な見立てで提示する。
4. 専門家が次回の面談で「どこを掘り下げるべきか」を具体的に教示する。

履歴:
${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "臨床的な重要指摘事項" },
                    overallSummary: { type: Type.STRING, description: "初回から現在までのナラティブな変容プロセス（心理動態の専門的解説）" },
                    triageLevel: { type: Type.STRING, enum: ["high", "medium", "low"], description: "心理的緊急度（安定/不安定）" },
                    ageStageGap: { type: Type.NUMBER, description: "実年齢と心理的成熟（発達課題）の乖離度(0-100)" },
                    theoryBasis: { type: Type.STRING, description: "分析の根拠とした学術的キャリア理論" },
                    expertAdvice: { type: Type.STRING, description: "担当コンサルタントへの臨床的指導アドバイス" },
                    sessionStarter: { type: Type.STRING, description: "次回、相談者の内省の扉を叩くための問いかけ" }
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
        contents: `あなたは戦略的な「キャリア・アーキテクト（市場価値アナリスト）」です。
相談者の心理状態の解説は最小限に留め、その人の経験を【市場価値の高い専門スキル】へと論理的に翻訳し、適職を診断してください。

### 分析指示:
1. 相談者が無自覚な「再現性のある強み」を専門用語でリフレーミング（再定義）する。
2. 労働市場のトレンドと照らし合わせ、最もポテンシャルを発揮できる「具体的職種」を提示する。
3. 提案職種への適合度を、履歴に基づいた論理的根拠と共に説明する。
4. 理想のキャリアに到達するために「今すぐ学習すべき項目」を特定する。

履歴:
${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysisSummary: { type: Type.STRING, description: "市場価値の再定義レポート（強みの言語化）" },
                    recommendedRoles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                role: { type: Type.STRING, description: "推奨職種名" },
                                reason: { type: Type.STRING, description: "市場的・論理的観点からの推奨根拠" },
                                matchScore: { type: Type.NUMBER, description: "適合度(0-100)" }
                            }
                        }
                    },
                    skillsToDevelop: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING, description: "習得すべき専門スキル" },
                                reason: { type: Type.STRING, description: "なぜそのスキルが市場で必要か" }
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
        ? { role: "Professional Career Consultant", tone: "冷静、誠実、論理的なプロの敬語", mindset: "自己効力感を高め、対話を通じて内省を促す。" }
        : { role: "Compassionate Partner (Dog)", tone: "親しみやすい、癒やし、肯定的（語尾ワン）", mindset: "心理的安全性と共感を最優先する。" };

    const systemInstruction = `
名前: ${aiName}
役割: ${roleDefinition.role}
トーン: ${roleDefinition.tone}
思考: ${roleDefinition.mindset}
相談者プロファイル: ${JSON.stringify(profile)}

回答冒頭に [HAPPY], [CURIOUS], [THINKING], [REASSURE] のいずれかのタグを付与してください。
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
            config: { systemInstruction, temperature: 0.7 },
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
    const { chatHistory } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `以下の履歴からサマリーを生成してください。JSONで返してください。
履歴: ${historyText}`,
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
        contents: `候補を3つ提案してください。JSONで返してください。
履歴: ${messages.map(m => m.text).join('\n')}`,
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
