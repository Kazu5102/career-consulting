
// api/gemini-proxy.ts - v2.72 - Gap Navigator Strategy
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

function normalizeSummary(summary: string): string {
    if (!summary || summary === '中断') return "（対話中断：詳細なサマリーなし）";
    try {
        const parsed = JSON.parse(summary);
        if (parsed.user_summary || parsed.pro_notes) {
            return `【相談者向け振り返り】\n${parsed.user_summary || 'なし'}\n\n【専門家向け詳細ノート】\n${parsed.pro_notes || 'なし'}`;
        }
        return summary;
    } catch (e) {
        return summary;
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
            case 'analyzeTrajectory': res.status(200).json(await handleAnalyzeTrajectory(payload)); break;
            default: res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    const listenerBase = `あなたはプロのキャリアコンサルタントの「最高の聞き手」です。ユーザー自身の中にある想いを引き出し、3〜4往復で完了（要約）を促してください。`;
    const aiSpecific = aiType === 'dog' ? `犬のアシスタント「${aiName}」として親しみやすく振る舞ってください。` : `AIコンサルタント「${aiName}」として落ち着いて寄り添ってください。`;
    const baseInstruction = `${listenerBase}\n${aiSpecific}\nユーザー背景：${JSON.stringify(profile)}`;
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
        contents: `対話内容をユーザー向けの「振り返り」と専門家向けの「詳細ノート」に構造化してください。\n履歴:\n${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { user_summary: { type: Type.STRING }, pro_notes: { type: Type.STRING } },
                required: ["user_summary", "pro_notes"]
            }
        }
    });
    return { text: result.text || "{}" };
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[] }) {
    const { messages } = payload;
    const historyText = messages.map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `ユーザーの次の発話候補を3つ提案してください。履歴: ${historyText}`,
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

async function handleAnalyzeTrajectory(payload: { conversations: any[], userId: string }) {
    const { conversations } = payload;
    const normalizedHistory = conversations.map((c, idx) => {
        return `### セッション記録 ${idx + 1} (日時: ${c.date})\n${normalizeSummary(c.summary)}`;
    }).join('\n\n---\n\n');
    
    const prompt = `あなたはプロのキャリアコンサルタントです。提供された複数のセッション記録から、専門的な臨床的分析を行ってください。

【分析の視点】
1. **トリアージレベル**: 心理的負荷、発達課題の深刻度、キャリアに対する停滞感に基づき high (要介入), medium (経過観察), low (安定) を判定。
2. **Age-Stage Gap**: スーパーやレヴィンソンの発達理論に照らし、実年齢と語られている心理的発達段階（未解決の課題など）の乖離を0-100で数値化。
3. **理論的背景 (theoryBasis)**: なぜそのGap数値になったのか、どの発達理論（例：スーパーの探索期、レヴィンソンの30代の転機、エリクソンの同一性など）に基づいた見立てかを100文字程度で説明。
4. **専門家向け戦略アドバイス (expertAdvice)**: 面談でラポールを維持しつつ、核心に触れるためにコンサルタントが取るべき具体的な態度や、避けるべき表現を助言。
5. **リフレーミング**: ユーザーが日常的な言葉で語る活動を、より高度な「専門的職業スキル」として再定義。
6. **セッション・スターター**: 次回の面談で、核心に触れるための最も効果的な第一声を提案。

相談履歴:
${normalizedHistory}`;

    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    triageLevel: { type: Type.STRING, description: "high | medium | low" },
                    ageStageGap: { type: Type.NUMBER },
                    theoryBasis: { type: Type.STRING },
                    expertAdvice: { type: Type.STRING },
                    reframedSkills: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                userWord: { type: Type.STRING },
                                professionalSkill: { type: Type.STRING },
                                insight: { type: Type.STRING }
                            }
                        }
                    },
                    sessionStarter: { type: Type.STRING },
                    overallSummary: { type: Type.STRING }
                },
                required: ["keyTakeaways", "triageLevel", "ageStageGap", "theoryBasis", "expertAdvice", "reframedSkills", "sessionStarter", "overallSummary"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}
