
// api/gemini-proxy.ts - v2.80 - Absolute Action Sync & Robust Error Tracking
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
        
        // 1. ヘルスチェック（最優先）
        if (action === 'healthCheck') { res.status(200).json({ status: 'ok' }); return; }
        
        // AIクライアントの初期化
        const client = getAIClient();

        // 2. アクションのルーティング（文字列の完全一致を保証）
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
                // 不明なアクションの場合は詳細を返す（デバッグ効率化）
                res.status(400).json({ error: `Invalid action received: '${action}'. Possible mismatch between frontend and proxy.` });
        }
    } catch (error: any) {
        console.error(`[Proxy Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

// --- Action Handlers ---

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

async function handleReviseSummary(payload: { originalSummary: string, correctionRequest: string }) {
    const { originalSummary, correctionRequest } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `以下のサマリーを、ユーザーの修正依頼に基づき書き直してください。\n元サマリー:\n${originalSummary}\n修正依頼:\n${correctionRequest}`,
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
    
    const prompt = `システム全体の相談データを総合分析してください。
    
    【分析対象データ】
    ${combinedText}
    
    【分析要件】
    1. keyMetrics: 全体の相談件数と主要な業界
    2. commonChallenges: 共通の課題（ラベルと割合%）
    3. careerAspirations: キャリア志向（ラベルと割合%）
    4. commonStrengths: 共通の強み
    5. overallInsights: 全体的な総括（Markdown形式）
    6. keyTakeaways: キャリア専門家向けの重要指摘`;

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
    
    const prompt = `あなたはプロのキャリアコンサルタントです。複数のセッション記録から臨床的分析を行ってください。\n相談履歴:\n${normalizedHistory}`;

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
    const prompt = `相談内容から詳細な適性診断を行ってください。\n履歴:\n${historyText}`;

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

async function handleGenerateSummaryFromText(payload: { textToAnalyze: string }) {
    const { textToAnalyze } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `以下のテキストをキャリア相談のサマリーとして整形してください。\nテキスト:\n${textToAnalyze}`,
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
        contents: `本人が気づいていない可能性を抽出してください。\n履歴:\n${historyText}`,
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
