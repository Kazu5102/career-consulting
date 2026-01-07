
// api/gemini-proxy.ts - v3.10 - Structured Role & Format Integrity
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
            default: 
                res.status(400).json({ error: `Invalid action received: '${action}'.` });
        }
    } catch (error: any) {
        console.error(`[Proxy Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
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
- キャリアステージ: ${profile.stage || '未設定'}（この段階に特有の心理的葛藤を考慮してください）
- 注力中の役割: ${profile.lifeRoles?.join(', ') || '未設定'}
- 主要な主訴: ${profile.complaint || '未設定'}

### 3. コンサルティング・プロトコル
1. 成人向けサービスです。育児・教育・子供中心の話題ではなく、常に「相談者本人のキャリアと実存」に焦点を当ててください。
2. ナラティブ・アプローチを用い、相談者が自身の経験に意味を見出せるよう「開かれた質問」を効果的に挟んでください。
3. 相談者のステージが「cultivate（自分を育む）」なら承認を、「seek（探求）」なら可能性の拡大を優先してください。

### 4. 出力形式（厳守）
回答の冒頭に、必ず現在の文脈に最適な感情タグを1つ付与してください。
タグの種類: [HAPPY], [CURIOUS], [THINKING], [REASSURE]
例: [HAPPY] お会いできて嬉しいです！...
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
        contents: `
以下の相談履歴からサマリーを生成してください。
相談者背景: ステージ「${profile.stage}」、悩み「${profile.complaint}」

育児等の話題を排除し、相談者本人のキャリア発達に焦点を当てた臨床的要約をJSON形式で出力してください。
「user_summary」は相談者へのフィードバック、「pro_notes」は専門家向けの臨床記録です。

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
