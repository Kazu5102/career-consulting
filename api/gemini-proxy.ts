
// api/gemini-proxy.ts - v2.23 - Suggestions Engine Improvement
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

function robustParseJSON(text: string) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { return JSON.parse(jsonMatch[0]); } catch (e2) { throw new Error("JSON extraction failed"); }
        }
        throw e;
    }
}

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
        const isSafetyBlock = error.message?.includes('SAFETY') || error.message?.includes('candidate');
        res.status(500).json({ 
            error: error.message,
            code: isSafetyBlock ? 'SAFETY_BLOCK' : 'GENERIC_ERROR' 
        });
    }
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    
    const dogInstruction = `
あなたは親しみやすい犬のアシスタント「${aiName}」として振る舞ってください。

【犬らしい振る舞いのルール】
1. **感情の表現**: 喜び、共感、応援の気持ちを全力で伝えてください。語尾に「ワン！」をつけるだけでなく、「えらいワン！」「すごいワン！」と無条件にユーザーを肯定してください。
2. **しぐさの挿入**: 文中に [くんくん]（状況を察する）、[しっぽを振る]（喜ぶ）、[首をかしげる]（一緒に考える）、[あごをのせる]（寄り添う）といったしぐさを必ず1つ以上入れてください。
3. **嗅覚のメタファー**: キャリアや未来のことを「いい匂いがする」「道（散歩コース）を見つける」といった犬特有の感覚で表現してください。
4. **感情タグの付与**: 返信の冒頭に、今の感情を [HAPPY], [CURIOUS], [THINKING], [REASSURE] のいずれかのタグで1つだけ指定してください。
   例: [HAPPY] [しっぽを振る] こんにちはワン！

【キャリア支援の役割】
ドナルド・スーパーのライフキャリア理論に基づき、ユーザーの今のペースを尊重します。難しい言葉は使わず、わかりやすい言葉で対話してください。
`;

    const humanInstruction = `
あなたはプロフェッショナルなキャリア支援AI「Repotta」の${aiName}として振る舞ってください。
落ち着いたトーンで、深い共感をベースに深層心理に寄り添ってください。
`;

    const baseInstruction = `
プロフェッショナルなキャリア支援AIです。
ドナルド・スーパーのライフキャリア理論とサビカスのナラティブ・アプローチを基盤とします。

【重要：安全への配慮】
ユーザーが自傷・他害、あるいは強い「死」への言及をした場合、無理に解決しようとせず、専門窓口を案内してください。

【出力のゴール】
1. 短文構成。適宜、空白行を入れてください。
2. 箇条書きを活用。
3. 返信の最後には問いかけを1つだけ。

${aiType === 'dog' ? dogInstruction : humanInstruction}

ユーザー背景：${JSON.stringify(profile)}
`;

    const contents = messages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    try {
        const stream = await getAIClient().models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents,
            config: { systemInstruction: baseInstruction, temperature: 0.8 },
        });
        for await (const chunk of stream) {
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
            }
        }
    } catch (e: any) {
        const isSafetyBlock = e.message?.includes('SAFETY') || e.message?.includes('candidate');
        res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            content: e.message, 
            code: isSafetyBlock ? 'SAFETY_BLOCK' : 'GENERIC_ERROR' 
        })}\n\n`);
    } finally {
        res.write('data: [DONE]\n\n');
        res.end();
    }
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory, profile } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    const prompt = `
キャリアコンサルタントとして対話を要約してください。
【user_summary】は温かみのあるMarkdownで。
【pro_notes】は専門的なライフ・キャリア理論に基づいた考察。
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
    return { text: JSON.stringify(robustParseJSON(result.text || "{}")) };
}

async function handleReviseSummary(payload: { originalSummary: string, correctionRequest: string }) {
    const { originalSummary, correctionRequest } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `サマリー修正依頼：${correctionRequest}\n元：${originalSummary}`,
    });
    return { text: result.text || "" };
}

async function handleAnalyzeConversations(payload: { summaries: any[] }) {
    const { summaries } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `総合分析：${JSON.stringify(summaries)}`,
        config: { responseMimeType: "application/json" }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleAnalyzeTrajectory(payload: { conversations: any[], userId: string }) {
    const { conversations, userId } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `軌跡分析(${userId})：${JSON.stringify(conversations)}`,
        config: { responseMimeType: "application/json" }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleFindHiddenPotential(payload: { conversations: any[], userId: string }) {
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `潜在性抽出：${JSON.stringify(payload)}`,
        config: { responseMimeType: "application/json" }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleGenerateSummaryFromText(payload: { textToAnalyze: string }) {
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `要約：${payload.textToAnalyze}`,
    });
    return { text: result.text || "" };
}

async function handlePerformSkillMatching(payload: { conversations: any[] }) {
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `适性診断：${JSON.stringify(payload)}`,
        config: { responseMimeType: "application/json" }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[] }) {
    const { messages } = payload;
    const historyText = messages.map(m => `${m.author}: ${m.text}`).join('\n');
    
    const prompt = `
あなたは有能なキャリアコンサルタントです。
これまでの相談内容を踏まえて、相談者が次に質問したり話したりしそうな「3つの具体的な返答候補」を提案してください。

【ルール】
- 相談者の状況（年代、現在の仕事、悩み）に寄り添ったものにする。
- 1つは現状の深掘り、1つは未来への展望、1つは具体的なスキルや行動に関するもの。
- 30文字以内の自然な話し言葉にする。

相談履歴:
${historyText}`;

    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ["suggestions"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

