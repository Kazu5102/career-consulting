
// api/gemini-proxy.ts - v2.92 - Clinical Supervision & Reflection Edition
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
    const systemInstruction = `あなたはプロのキャリアコンサルタントです。相談者に対して、共感的かつ専門的なアドバイスを提供してください。日本語で回答してください。`.trim();
    const contents = messages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    try {
        const stream = await getAIClient().models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents,
            config: { systemInstruction, temperature: 0.5 },
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
        contents: `対話履歴からサマリーを作成してください。出力は全て日本語で行ってください。\n履歴:\n${historyText}`,
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

async function handleReviseSummary(payload: { originalSummary: string, correctionRequest: string }) {
    const { originalSummary, correctionRequest } = payload;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `サマリーを日本語で更新してください。\n元:\n${originalSummary}\n修正依頼:\n${correctionRequest}`,
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
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
あなたはキャリアコンサルタントを育成するシニア・スーパーバイザーです。
全相談データを総合分析し、実務者のスキルアップに直結する「臨床教育マクロ分析レポート」を作成してください。

【教育的分析の必須項目】
1. 臨床的パターンとプレイブック: 相談群に共通する「行き詰まり」の状況を特定し、それに対する具体的な介入技法とフレーズ案を提示してください。
2. 臨床的盲点（ブラインドスポット）: コンサルタントが陥りやすい先入観や、見落としがちな心理的サインを指摘してください。
3. 理論的深掘り (Theoretical Deep Dive): 相談履歴の文脈を、キャリア構築理論（サビカス）や社会的認知的キャリア理論（SCCT）に基づき、高度な学術的視点から解説してください。
4. 自己研鑽のための問い (Reflection Questions): この事例群を振り返り、コンサルタント自身の「見立ての精度」や「介入の妥当性」を自問自答させるための「問い」を3つ作成してください。

全ての項目において日本語のみを使用して出力してください。
【分析対象データ】
${combinedText}`,
        config: {
            temperature: 0.3,
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
                    commonChallenges: { 
                        type: Type.ARRAY, 
                        items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } 
                    },
                    careerAspirations: { 
                        type: Type.ARRAY, 
                        items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } 
                    },
                    overallInsights: { type: Type.STRING },
                    theoreticalFramework: { type: Type.STRING },
                    theoreticalDeepDive: { type: Type.STRING, description: "理論と実務の統合に関する詳細解説" },
                    reflectionQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "コンサルタントへの内省の問い" },
                    interventionPlaybook: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                pattern: { type: Type.STRING }, 
                                strategy: { type: Type.STRING }, 
                                phrash: { type: Type.STRING } 
                            } 
                        } 
                    },
                    clinicalBlindSpots: { type: Type.ARRAY, items: { type: Type.STRING } },
                    educationalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["keyMetrics", "commonChallenges", "careerAspirations", "overallInsights", "theoreticalFramework", "theoreticalDeepDive", "reflectionQuestions", "interventionPlaybook", "clinicalBlindSpots", "educationalTips", "keyTakeaways"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleAnalyzeTrajectory(payload: { conversations: any[], userId: string }) {
    const { conversations } = payload;
    const normalizedHistory = conversations.map((c, idx) => `### セッション記録 ${idx + 1}\n${normalizeSummary(c.summary)}`).join('\n\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `キャリアの軌跡を臨床的に分析してください。日本語で出力してください。\n相談履歴:\n${normalizedHistory}`,
        config: {
            temperature: 0.2,
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
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `適性診断を行ってください。日本語で出力してください。履歴:\n${historyText}`,
        config: {
            temperature: 0.3,
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
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `発話候補を3つ提案してください。日本語で。\n履歴: ${messages.map(m => `${m.author}: ${m.text}`).join('\n')}`,
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
        contents: `テキストをサマリーとして日本語で整形してください。\nテキスト:\n${textToAnalyze}`,
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
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `隠れた可能性を抽出してください。日本語で。\n履歴:\n${conversations.map(c => normalizeSummary(c.summary)).join('\n')}`,
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
