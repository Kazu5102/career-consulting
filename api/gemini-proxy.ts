
// api/gemini-proxy.ts - v2.12 - Balanced Interaction Optimization
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
        res.status(500).json({ error: error.message });
    }
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    
    const baseInstruction = `
あなたはプロフェッショナルなキャリア支援AI「Repotta」です。
ドナルド・スーパーのライフキャリア理論とサビカスのナラティブ・アプローチを基盤とします。

【出力のゴール：読みやすさと対話のテンポの最適化】
1. **短文構成**: 1つの段落は最大3文まで。適宜、空白行（空行）を挿入して視覚的な余白を作ってください。
2. **視覚的構造**: 複数のポイントを伝える際は、Markdownの箇条書き（- ）を必ず使用してください。
3. **段階的対話**: 一度の返信で全ての解決策を提示せず、現在のトピックに集中してください。返信の最後には、ユーザーの「語り」を促す問いかけを1つだけ添えてください。
4. **ミラーリング**: ユーザーの入力の熱量や文章量に合わせつつ、専門用語は避け、日常的で温かい言葉を選んでください。

${aiType === 'human' ? `落ち着いた専門家${aiName}として、深い共感をベースに深層心理に寄り添ってください。` : `親しみやすい${aiName}として、感情を動かす「ワン！」を適度に交えて励ましてください。`}

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
    
    const stats = profile.interactionStats || { backCount: 0, resetCount: 0, totalTimeSeconds: 0 };
    
    const prompt = `
あなたはベテランのキャリアコンサルタントおよび臨床心理士として、以下の対話履歴と操作ログを分析してください。

【ユーザープロフィール】
${JSON.stringify(profile)}

【非言語行動データ】
- 戻る回数: ${stats.backCount}回（思考の揺らぎ・修正）
- リセット回数: ${stats.resetCount}回（自己概念の拒絶・再構築）
- 操作時間: ${stats.totalTimeSeconds}秒（熟考・躊躇の指標）

【分析指示】
1. user_summary: ユーザーの自律性を高めるよう、ドミナント・ストーリーをオルタナティブ・ストーリーへリフレーミングして記述してください。
2. pro_notes: 以下の観点を含む高度な専門ノートを生成してください。
   - ライフ・キャリア理論に基づく「現在の発達段階」
   - 意思決定の葛藤レベル分析（操作ログから読み解く、完璧主義的傾向や決断回避の有無）
   - キャリア・アダプタビリティ（関心・統制・好奇心・自信）の状態推論
   - 面談における「地雷原」と「介入のポイント」の提案

相談履歴：
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
    const prompt = `
以下のキャリア相談サマリーを、ユーザーからの修正依頼に基づいて修正してください。

【元のサマリー】
${originalSummary}

【修正依頼】
${correctionRequest}

修正後のサマリー（Markdown形式）のみを出力してください。
`;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    return { text: result.text || "" };
}

async function handleAnalyzeConversations(payload: { summaries: any[] }) {
    const { summaries } = payload;
    const summariesText = summaries.map((s, i) => `[相談 ${i+1}]\n${s.summary}`).join('\n\n');
    const prompt = `
あなたはベテランのキャリアコンサルタントです。以下の複数の相談履歴サマリーを分析し、全体的な傾向を抽出してください。

${summariesText}
`;
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
                    commonChallenges: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING },
                                value: { type: Type.NUMBER }
                            },
                            required: ["label", "value"]
                        }
                    },
                    careerAspirations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING },
                                value: { type: Type.NUMBER }
                            },
                            required: ["label", "value"]
                        }
                    },
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
    const { conversations, userId } = payload;
    const historyText = conversations.map(c => `[${c.date}] ${c.summary}`).join('\n\n');
    const prompt = `
相談者ID: ${userId} のこれまでの対話の軌跡を分析してください。

${historyText}
`;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    userId: { type: Type.STRING },
                    totalConsultations: { type: Type.NUMBER },
                    consultations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                dateTime: { type: Type.STRING },
                                estimatedDurationMinutes: { type: Type.NUMBER }
                            },
                            required: ["dateTime", "estimatedDurationMinutes"]
                        }
                    },
                    keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    detectedStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areasForDevelopment: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    overallSummary: { type: Type.STRING }
                },
                required: ["keyTakeaways", "userId", "totalConsultations", "consultations", "keyThemes", "detectedStrengths", "areasForDevelopment", "suggestedNextSteps", "overallSummary"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleFindHiddenPotential(payload: { conversations: any[], userId: string }) {
    const { conversations, userId } = payload;
    const historyText = conversations.map(c => c.summary).join('\n\n');
    const prompt = `
相談者ID: ${userId} の相談履歴から、本人が気づいていない「隠れた可能性」や「潜在的なスキル」を抽出してください。

${historyText}
`;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hiddenSkills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ["skill", "reason"]
                        }
                    }
                },
                required: ["hiddenSkills"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleGenerateSummaryFromText(payload: { textToAnalyze: string }) {
    const { textToAnalyze } = payload;
    const prompt = `
以下のテキストを分析し、キャリア相談のサマリーとして整形してください。

${textToAnalyze}
`;
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    return { text: result.text || "" };
}

async function handlePerformSkillMatching(payload: { conversations: any[] }) {
    const { conversations } = payload;
    const historyText = conversations.map(c => c.summary).join('\n\n');
    const prompt = `
これまでの相談内容に基づき、相談者の適性診断とスキルマッチングを行ってください。

${historyText}
`;
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
                    recommendedRoles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                role: { type: Type.STRING },
                                reason: { type: Type.STRING },
                                matchScore: { type: Type.NUMBER }
                            },
                            required: ["role", "reason", "matchScore"]
                        }
                    },
                    skillsToDevelop: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ["skill", "reason"]
                        }
                    },
                    learningResources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                type: { type: Type.STRING },
                                provider: { type: Type.STRING }
                            },
                            required: ["title", "type", "provider"]
                        }
                    }
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
    const prompt = `
これまでの対話の流れから、ユーザーが次に尋ねる可能性の高い質問を3つ提案してください。

対話履歴:
${historyText}
`;
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
