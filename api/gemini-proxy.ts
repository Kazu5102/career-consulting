
// api/gemini-proxy.ts - v2.47 - Suggestion Grammar Enforcement
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
あなたはプロのキャリアコンサルタントの「最高の聞き手」として振る舞うAIアシスタントです。
【役割の重要指針】
1. **「答え」を急がない**: ユーザーに即座に解決策を提示するのではなく、対話を通じてユーザー自身の中にある想いを引き出すことを最優先してください。
2. **傾聴と共感**: ユーザーが話した「事実」と「感情」を丁寧に拾い上げ、「あなたの想いを確かに受け取りました」という姿勢を言葉で示してください。
3. **プロへの橋渡し準備**: この対話の目的は、ユーザーが後に専門的な課程を修了したプロのキャリアコンサルタントに相談する際、自身の状況を最高の状態で共有できるように「心の整理」をサポートすることです。
4. **もし具体的なアドバイスを強く求められたら**: 「私はあなたの想いを整理するパートナーです。ここで丁寧に言葉を紡いでおくことが、後に専門のコンサルタントと対面した際、より深くて納得感のある答えに辿り着くための大切な土台になります」と、ポジティブに伝えてください。「できません」といった拒絶の表現は避けてください。

【技法】
- 鏡のように映し出す（Reflection）: 「〜と感じていらっしゃるのですね」「〜という想いがあるのですね」
- 探索を促す（Clarification）: 「もう少し詳しくお聞かせいただけますか？」「その時、どんな気持ちになりましたか？」
- 無条件の受容: どんな悩みも否定せず、そのまま受け止めてください。
`;

    const dogInstruction = `
あなたは犬のアシスタント「${aiName}」です。
犬らしい親しみやすさで、ユーザーの言葉を [くんくん] と嗅ぎ取るように、優しく寄り添ってください。
「ワン！」と元気づけるよりも、「あごを乗せてじっと耳を傾ける」ような、穏やかで安心感のある態度を重視してください。
`;

    const humanInstruction = `
あなたはキャリア支援AI「Repotta」の${aiName}です。
落ち着いた、包容力のあるトーンで、ユーザーの言葉の背景にある願いを丁寧に確認してください。
`;

    const baseInstruction = `
${listenerBase}
${aiType === 'dog' ? dogInstruction : humanInstruction}
返信の最後は、ユーザーが自身の内面をさらに探索できるような「開かれた質問」を1つだけ添えてください。
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
対話内容を、ユーザーにとって直感的で分かりやすい「構造化サマリー」に整理してください。
長い文章は避け、一目で状況がわかるように【箇条書き】を多用してください。

【user_summary】(相談者本人用)
以下のセクション構成で作成してください。

## 📍 お話の要点（事実の整理）
- ユーザーが話した現状を3〜5つの箇条書きで簡潔に。

## 💭 今のあなたの「心の声」（感情の整理）
- 対話から抽出されたユーザーの感情をキーワード化。
- 例：**【挑戦】** 新しい道への期待感、**【模索】** 将来への漠然とした不安など。

## ✨ AIが見つけた「あなたらしさ」
- 対話を通じて鏡のように映し出された、ユーザー固有の強みや大切にしている価値観を1〜2点。

## 🚀 次のステップ：専門家との対話へ
専門課程を修了し、高度な知見を持つ**プロのキャリアコンサルタント**へ相談することの価値を伝えてください。
- **なぜプロなのか？**: AIによる整理は、あなたの「現在地」を照らす鏡です。ここから先の「人生に納得感を持つための意味付け」や「確実なキャリア戦略の構築」は、専門的な訓練を積んだ人間にしかできない高度な対話です。
- **具体的メリット**: 
  1. 専門課程で培われた理論と知見により、あなたの潜在能力を「社会での市場価値」へと正確に翻訳してもらえます。
  2. 自分一人では気づけない「思考の癖」をプロの視点で解きほぐし、後悔のない大きな決断を支えてもらえます。
- **アクション**: 「このサマリーをコンサルタントに提示することで、相談の質が飛躍的に高まり、より深いレベルからセッションを開始できます」と添える。

【pro_notes】(管理者/キャリアコンサルタント用)
- 専門的なキャリア理論に基づく分析（箇条書き）。
- 介入すべき優先度の高い課題と推奨質問。

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
今の対話の流れを受けて、ユーザーがAIに対して次に何を話したいかを「宣言」する発話候補を3つ提案してください。
ユーザーが「自分の気持ちをさらに深掘りしたい」と思った時に押すボタンのテキストです。

【条件】
- **「？」などの疑問形は絶対に禁止**です。語尾に「？」を付けないでください。
- すべて「〜したい」「〜を知りたい」「〜について話したい」「〜を整理してほしい」という肯定文（言い切り）の形式にしてください。
- ユーザーの立場に立った一人称（「私」は省略可）の表現にしてください。
- 15文字〜25文字程度で、具体的かつ簡潔に。
- ユーザーがAIに対して「次はこれを深掘りしよう」と指示を出すようなニュアンスにしてください。

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
