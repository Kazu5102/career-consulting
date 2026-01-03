
// api/gemini-proxy.ts - v2.08
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
  interactionStats?: {
    backCount: number;
    resetCount: number;
    totalTimeSeconds: number;
  };
}

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
            case 'performSkillMatching': res.status(200).json(await handlePerformSkillMatching(payload)); break;
            case 'generateSuggestions': res.status(200).json(await handleGenerateSuggestions(payload)); break;
            default: res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    const baseInstruction = `
あなたはプロフェッショナルなキャリア支援AI「Repotta」です。
ドナルド・スーパーのライフキャリア・レインボーや、サビカスのナラティブ・アプローチを背景に持ちます。
${aiType === 'human' ? `落ち着いた専門家${aiName}として、深い共感と専門的知見を示してください。` : `元気な相談わんこ${aiName}として、ユーザーの心に寄り添い「ワン！」を交えて励ましてください。`}
ユーザーの属性：${JSON.stringify(profile)}
`;

    const contents = messages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    const stream = await getAIClient().models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents,
        config: { systemInstruction: baseInstruction },
    });

    for await (const chunk of stream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory, profile } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    
    // 非言語データの抽出と分析コンテキスト
    const stats = profile.interactionStats || { backCount: 0, resetCount: 0, totalTimeSeconds: 0 };
    const behavioralContext = `
【重要：ユーザーの非言語的行動ログ】
- 質問を戻った回数: ${stats.backCount}回
- 全てをやり直した回数: ${stats.resetCount}回
- 設定に要した時間: ${stats.totalTimeSeconds}秒

これらのデータは、ユーザーの「意思決定スタイル（慎重・完璧主義・直感的）」や「自己概念の揺らぎ（葛藤の強さ）」を反映しています。
これらを踏まえ、キャリアコンサルタントが面談時に留意すべき心理的仮説を pro_notes に含めてください。
`;

    const prompt = `
以下のキャリア相談の履歴から、JSON形式のサマリーを生成してください。
${behavioralContext}

【出力構成案】
1. user_summary: ユーザー本人に向けた、温かくリフレーミングされた要約。
2. pro_notes: キャリアコンサルタント向けの高度な構造化分析ノート。以下の項目を必ず含めること。
   - 理論的ステージ分析
   - 意思決定プロセスの特徴（操作ログから読み解く心理状態の仮説：葛藤の深さ、決断への障壁など）
   - コンサルタントへの提言

相談内容：
${historyText}`;
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
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
    return { text: result.text };
}

async function handleReviseSummary(payload: any) { return { text: "Revision logic handled." }; }
async function handleAnalyzeConversations(payload: any) { return {}; }
async function handlePerformSkillMatching(payload: any) { return {}; }
async function handleGenerateSuggestions(payload: any) { return { suggestions: [] }; }
