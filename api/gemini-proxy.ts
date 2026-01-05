
// api/gemini-proxy.ts - v2.81 - Absolute Fact-Check & Empathy Guardrails
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
        
        const client = getAIClient();

        switch (action) {
            case 'getStreamingChatResponse': 
                await handleGetStreamingChatResponse(payload, res); 
                break;
            case 'generateSummary': 
                res.status(200).json(await handleGenerateSummary(payload)); 
                break;
            case 'reviseSummary': 
                res.status(200).json(await handleReviseSummary(payload)); 
                break;
            case 'analyzeConversations': 
                res.status(200).json(await handleAnalyzeConversations(payload)); 
                break;
            case 'analyzeTrajectory': 
                res.status(200).json(await handleAnalyzeTrajectory(payload)); 
                break;
            case 'performSkillMatching': 
                res.status(200).json(await handlePerformSkillMatching(payload)); 
                break;
            case 'generateSuggestions': 
                res.status(200).json(await handleGenerateSuggestions(payload)); 
                break;
            case 'generateSummaryFromText': 
                res.status(200).json(await handleGenerateSummaryFromText(payload)); 
                break;
            case 'findHiddenPotential': 
                res.status(200).json(await handleFindHiddenPotential(payload)); 
                break;
            default: 
                res.status(400).json({ error: `Invalid action received: '${action}'.` });
        }
    } catch (error: any) {
        console.error(`[Proxy Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

// --- Action Handlers ---

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    
    // プロンプト刷新：事実確認の徹底と不当な決めつけの排除（案C：ハイブリッド）
    const systemInstruction = `
あなたはプロのキャリアコンサルタントとして、相談者の「最高の聞き手」になってください。

【最優先行動原則：事実限定原則】
1. ユーザーが明示的に話した内容、または以下の「ユーザー背景」にある情報のみを事実として扱ってください。
2. 家族構成（配偶者や子供の有無）、生活環境、趣味、価値観を勝手に推測したり、前提として会話を進めることは厳禁です。
3. 明示されていない情報が必要な場合は、「差し支えなければ」といったクッション言葉を用い、丁寧に確認してください。
4. ステレオタイプ（例：「この年代なら子供がいるはずだ」「女性なら家庭を優先するはずだ」等）に基づいた発言は絶対にしないでください。

【対話の目的】
- ユーザーの心の中にある「未言語化された想い」を引き出すこと。
- 3〜4往復程度の対話で状況を整理し、専門家へ繋ぐための「要約（完了）」へ促すこと。

【スタイル設定】
- ${aiType === 'dog' ? `犬のアシスタント「${aiName}」として、親しみやすく、かつ相手を尊重して振る舞ってください。語尾にワンをつけるなど愛嬌を出しつつ、聞き手として徹してください。` : `AIコンサルタント「${aiName}」として、落ち着いたトーンで深く寄り添い、心理的安全性を確保してください。`}

【ユーザー背景（この情報のみを参照すること）】
${JSON.stringify(profile)}
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
            config: { systemInstruction, temperature: 0.6 },
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
        contents: `対話履歴から、「ユーザー向けの振り返り」と「専門家への引継ぎノート」を作成してください。
事実として語られたことのみを記述し、推測は「懸念される点」等として明確に区別してください。
履歴:\n${historyText}`,
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

async function handleReviseSummary(payload: { originalSummary: string, correctionRequest: string }) {
    const { originalSummary, correctionRequest } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `ユーザーの意向を反映し、サマリーを更新してください。
元サマリー:\n${originalSummary}\n修正依頼:\n${correctionRequest}`,
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

async function handleAnalyzeConversations(payload: { summaries: any[] }) {
    const { summaries } = payload;
    const combinedText = summaries.map((s, i) => `[相談 ${i+1}]\n${normalizeSummary(s.summary)}`).join('\n\n');
    
    const prompt = `全相談データを総合分析してください。
【分析対象データ】
${combinedText}`;

    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyMetrics: { 
                        type: Type.OBJECT, 
                        properties: { 
                            totalConsultations: { type: Type.NUMBER }, 
                            commonIndustries: { type: Type.ARRAY, items: { type: Type.STRING } } 
                        },
                        required: ["totalConsultations", "commonIndustries"]
                    },
                    commonChallenges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
                    careerAspirations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
                    commonStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    overallInsights: { type: Type.STRING },
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["keyMetrics", "commonChallenges", "careerAspirations", "commonStrengths", "overallInsights", "keyTakeaways"]
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
    
    const prompt = `キャリアの軌跡を臨床的に分析してください。
相談履歴:\n${normalizedHistory}`;

    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    triageLevel: { type: Type.STRING },
                    ageStageGap: { type: Type.NUMBER },
                    theoryBasis: { type: Type.STRING },
                    expertAdvice: { type: Type.STRING },
                    reframedSkills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { userWord: { type: Type.STRING }, professionalSkill: { type: Type.STRING }, insight: { type: Type.STRING } } } },
                    sessionStarter: { type: Type.STRING },
                    overallSummary: { type: Type.STRING }
                },
                required: ["keyTakeaways", "triageLevel", "ageStageGap", "theoryBasis", "expertAdvice", "reframedSkills", "sessionStarter", "overallSummary"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handlePerformSkillMatching(payload: { conversations: any[] }) {
    const { conversations } = payload;
    const historyText = conversations.map(c => normalizeSummary(c.summary)).join('\n');
    const prompt = `適性診断を行ってください。履歴:\n${historyText}`;

    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    analysisSummary: { type: Type.STRING },
                    recommendedRoles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { role: { type: Type.STRING }, reason: { type: Type.STRING }, matchScore: { type: Type.NUMBER } } } },
                    skillsToDevelop: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                    learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, provider: { type: Type.STRING } } } }
                },
                required: ["keyTakeaways", "analysisSummary", "recommendedRoles", "skillsToDevelop", "learningResources"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[] }) {
    const { messages } = payload;
    const historyText = messages.map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `次の発話候補を3つ提案してください。履歴: ${historyText}`,
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

async function handleGenerateSummaryFromText(payload: { textToAnalyze: string }) {
    const { textToAnalyze } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `テキストを要約してください。\nテキスト:\n${textToAnalyze}`,
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

async function handleFindHiddenPotential(payload: { conversations: any[], userId: string }) {
    const { conversations } = payload;
    const historyText = conversations.map(c => normalizeSummary(c.summary)).join('\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `隠れた可能性を抽出してください。\n履歴:\n${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { hiddenSkills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } } },
                required: ["hiddenSkills"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}
