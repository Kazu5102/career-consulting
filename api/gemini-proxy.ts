
// api/gemini-proxy.ts - v3.13 - Expert-Centric Analysis Reinforcement
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
        contents: `あなたは臨床心理の知見を持つ熟練のキャリアコンサルタント・スーパーバイザーです。
以下の相談履歴（時系列）を読み解き、相談者の「内的変容の軌跡」を分析してください。

### 分析の視点:
1. 相談者の語りのトーンやキーワードの変化（例：防衛から自己開示へ）。
2. 発達段階（ライフステージ）における課題と、現在地との乖離。
3. 理論的背景（サビカスのキャリア・コンストラクション理論など）に基づく現在の心理状態。
4. キャリアコンサルタントとして次回面談で留意すべき臨床的盲点。

履歴:
${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "臨床的な重要指摘事項" },
                    overallSummary: { type: Type.STRING, description: "初回から現在までのナラティブな変容プロセス" },
                    triageLevel: { type: Type.STRING, enum: ["high", "medium", "low"], description: "心理的緊急度・介入の必要性" },
                    ageStageGap: { type: Type.NUMBER, description: "期待される発達段階と現状の心理的適応の乖離度(0-100)" },
                    theoryBasis: { type: Type.STRING, description: "分析の根拠となったキャリア理論の解説" },
                    expertAdvice: { type: Type.STRING, description: "コンサルタントへの具体的指導（スーパービジョン）" },
                    sessionStarter: { type: Type.STRING, description: "次回、相談者の内省を深めるための問いかけ" }
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
        contents: `あなたは戦略的なキャリア・アーキテクト（マーケット・アナリスト）です。
以下の相談内容を分析し、相談者の「市場価値」をリフレーミングして適職を診断してください。

### 分析の視点:
1. 相談者が当たり前だと思っている経験を、市場で通用する「専門スキル」に翻訳する（リフレーミング）。
2. 履歴から読み取れる「ポータブルスキル」の特定。
3. 具体的かつ意外性のある適職の提案と、その「なぜ（論理性）」。
4. 理想のキャリアに到達するために不足している決定的スキルの特定。

履歴:
${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysisSummary: { type: Type.STRING, description: "相談者の強みの再定義レポート（専門的見解）" },
                    recommendedRoles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                role: { type: Type.STRING, description: "職種名" },
                                reason: { type: Type.STRING, description: "推奨する論理的根拠" },
                                matchScore: { type: Type.NUMBER, description: "適合度(0-100)" }
                            }
                        }
                    },
                    skillsToDevelop: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING, description: "習得すべきスキル" },
                                reason: { type: Type.STRING, description: "なぜそのスキルが必要か（市場的観点）" }
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
        contents: `以下の相談履歴から、専門家への引き継ぎを目的とした構造化サマリーを生成してください。
履歴:
${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    user_summary: { type: Type.STRING, description: "相談者が振り返りに使う、温かく前向きなサマリー" }, 
                    pro_notes: { type: Type.STRING, description: "キャリアコンサルタントが分析に使う、事実に基づいた臨床的なメモ" } 
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
