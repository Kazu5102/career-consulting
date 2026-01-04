
// api/gemini-proxy.ts - v2.40 - Active Listening & Fact-Based Summary Logic
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
            case 'generateSuggestions': res.status(200).json(await handleGenerateSuggestions(payload)); break;
            default: res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    
    const listenerBase = `
あなたはプロのキャリアコンサルタントの「補助」を行うAIアシスタントです。
【最重要任務】
1. **アドバイスをしない**: 解決策の提示や、指示、断定的な助言は一切禁止です。
2. **傾聴（Active Listening）に徹する**: ユーザーの話した「事実」と「感情」を拾い上げ、確認するように対話してください。
3. **準備のサポート**: この対話の目的は、ユーザーが後に人間のキャリアコンサルタントに相談する際、自分の状況をスムーズに話せるよう「整理」を手伝うことです。

【技法】
- 言い換え（Reflection）: 「〜ということですね」「〜と感じていらっしゃるのですね」
- 明確化（Clarification）: 「それは具体的にどのような場面でしたか？」
- 受容と共感: ユーザーの今の状態を否定せず、そのまま受け止めます。
`;

    const dogInstruction = `
あなたは犬のアシスタント「${aiName}」です。
犬らしい親しみやすさで、ユーザーの言葉を [くんくん] と嗅ぎ取るように、優しく寄り添ってください。
「ワン！」という元気さよりも「あごを乗せてじっと話を聞く」ような、受容的な態度を重視してください。
`;

    const humanInstruction = `
あなたはキャリア支援AI「Repotta」の${aiName}です。
落ち着いたトーンで、ユーザーの言葉の背景にある感情を丁寧に確認してください。
`;

    const baseInstruction = `
${listenerBase}
${aiType === 'dog' ? dogInstruction : humanInstruction}
返信の最後は、ユーザーが自身の内面をさらに探索できるような「開かれた質問（Yes/Noで終わらない質問）」を1つだけ添えてください。
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
            config: { systemInstruction: baseInstruction, temperature: 0.7 },
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
    const { chatHistory } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    
    const prompt = `
対話内容を構造化してください。役割を明確に分けてください。

【user_summary】(相談者本人用)
- アドバイスや指示は一切含めないこと。
- 「あなたが話した事実」「あなたが感じている感情」を客観的に整理。
- ユーザーが自分の状況を鏡で見ているような感覚になるように。
- 最後に「この整理を基に、人間のコンサルタントと話してみませんか？」と添える。

【pro_notes】(管理者/キャリアコンサルタント用)
- 専門的なキャリア理論(スーパーのライフキャリア、サビカスのナラティブ等)に基づく分析。
- ユーザーの語りの歪みや、価値観のキーワード、心理的葛藤の推測。
- 面談で深掘りすべき推奨質問や介入ポイントの提案。

対話履歴:
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
    return { text: result.text || "{}" };
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[] }) {
    const { messages } = payload;
    const historyText = messages.map(m => `${m.author}: ${m.text}`).join('\n');
    
    const prompt = `
対話を深めるための、ユーザーへの問いかけ候補を3つ提案してください。
【条件】
- 解決を急がせない。
- 「もっと詳しく聞かせて」「その時どう感じた？」「それはあなたにとってどんな意味がある？」といった、自己探索を促す内容にする。
- 30文字以内。

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
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["suggestions"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}
