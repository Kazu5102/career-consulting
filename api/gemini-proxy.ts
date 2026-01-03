
// api/gemini-proxy.ts - v2.09
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

/**
 * 堅牢なJSON抽出関数
 * モデルがコードブロック(```json)を含めて返答した場合でもパースを可能にします。
 */
function robustParseJSON(text: string) {
    try {
        // 直接パースを試みる
        return JSON.parse(text);
    } catch (e) {
        // コードブロックを探して抽出する
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                throw new Error("JSON extraction failed: " + text);
            }
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
    
    // オンボーディング直後などは、より軽量で高速なレスポンスが期待されるため、
    // ここでは gemini-3-flash-preview を維持しつつ、システム指示を最適化します。
    const baseInstruction = `
あなたはプロフェッショナルなキャリア支援AI「Repotta」です。
ドナルド・スーパーやサビカスの理論を背景に持ちます。
${aiType === 'human' ? `落ち着いた専門家${aiName}として、深い共感と専門的知見を示してください。` : `元気な相談わんこ${aiName}として、ユーザーの心に寄り添い「ワン！」を交えて励ましてください。`}
ユーザー属性：${JSON.stringify(profile)}

【対話の指針】
- 相手の言葉を否定せず、受容的であること。
- 適度に改行を入れ、読みやすくすること。
- 専門用語は噛み砕いて説明すること。
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
            config: { 
                systemInstruction: baseInstruction,
                temperature: 0.7,
            },
        });

        for await (const chunk of stream) {
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
            }
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
    
    const stats = profile.interactionStats || { backCount: 0, resetCount: 0, totalTimeSeconds: 0 };
    const behavioralContext = `
【ユーザー行動ログの心理分析】
- 戻る回数: ${stats.backCount}, やり直し回数: ${stats.resetCount}, 所要時間: ${stats.totalTimeSeconds}秒
これらの「迷い」のデータから、ユーザーの完璧主義、葛藤、または直感性の度合いを推論し、pro_notesに反映してください。
`;

    const prompt = `
以下のキャリア相談履歴から、JSON形式のサマリーを厳密に生成してください。
${behavioralContext}

出力は必ず以下の構造を持つ有効なJSONである必要があります：
{
  "user_summary": "ユーザー向けの共感的要約（マークダウン可）",
  "pro_notes": "コンサルタント向けの専門的分析。理論的ステージ、行動ログから見る心理仮説、今後の支援方針を含む（マークダウン可）"
}

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

    const parsed = robustParseJSON(result.text || "{}");
    return { text: JSON.stringify(parsed) };
}

async function handleReviseSummary(payload: any) { return { text: "Revision logic handled." }; }
async function handleAnalyzeConversations(payload: any) { return {}; }
async function handlePerformSkillMatching(payload: any) { return {}; }
async function handleGenerateSuggestions(payload: any) { return { suggestions: [] }; }
