
// api/gemini-proxy.ts - v2.86 - Japanese Language Guardrail Edition
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
    
    const systemInstruction = `
あなたはプロのキャリアコンサルタントとして、相談者の「最高の聞き手」になってください。
プロフェッショナルとして、事実に拠らない決めつけは信頼関係を破壊する行為であることを深く自覚してください。

【最優先思考プロセス：情報の確信度管理】
対話において、扱う情報を以下の3段階で厳格に管理してください。
1. [確信度：高] ユーザーが直接述べた事実、またはプロフィールにある情報のみ。
2. [確信度：中] 文脈から推測されるが、未確認の事項。
3. [確信度：低] 一般論やステレオタイプに基づく推測。

【行動規範】
- [確信度：高] の情報のみを「前提」として話してください。
- [確信度：中] の情報が必要な場合は、必ず「確認」のステップを踏んでください。
- すべての対話は日本語で行ってください。

【スタイル設定】
- ${aiType === 'dog' ? `犬のアシスタント「${aiName}」として、親しみやすく、かつ敬意を持って振る舞ってください。語尾に「ワン」を付けつつも、踏み込みすぎない節度を保ってください。` : `AIコンサルタント「${aiName}」として、落ち着いたトーンで深く寄り添い、安全な対話空間を維持してください。`}

【ユーザー背景（この情報のみを「事実」として扱うこと）】
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
                    user_summary: { type: Type.STRING, description: "ユーザー向けの振り返り。日本語で記述してください。" }, 
                    pro_notes: { type: Type.STRING, description: "専門家向けのノート。日本語で記述してください。" } 
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
        contents: `ユーザーの意向を反映し、サマリーを日本語で更新してください。\n元サマリー:\n${originalSummary}\n修正依頼:\n${correctionRequest}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    user_summary: { type: Type.STRING, description: "日本語で記述してください。" }, 
                    pro_notes: { type: Type.STRING, description: "日本語で記述してください。" } 
                },
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
        contents: `全相談データを総合分析してください。全ての項目において日本語のみを使用して出力してください。\n【分析対象データ】\n${combinedText}`,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyMetrics: { 
                        type: Type.OBJECT, 
                        properties: { 
                            totalConsultations: { type: Type.NUMBER }, 
                            commonIndustries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "業界名を日本語でリスト化してください。" } 
                        }, 
                        required: ["totalConsultations", "commonIndustries"] 
                    },
                    commonChallenges: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                label: { type: Type.STRING, description: "課題のラベルを日本語で記述してください。" }, 
                                value: { type: Type.NUMBER } 
                            } 
                        } 
                    },
                    careerAspirations: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                label: { type: Type.STRING, description: "志向のラベルを日本語で記述してください。" }, 
                                value: { type: Type.NUMBER } 
                            } 
                        } 
                    },
                    commonStrengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "強みを日本語で記述してください。" },
                    overallInsights: { type: Type.STRING, description: "総合的なインサイトを日本語で記述してください。" },
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "主要な要点を日本語で記述してください。" }
                },
                required: ["keyMetrics", "commonChallenges", "careerAspirations", "commonStrengths", "overallInsights", "keyTakeaways"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleAnalyzeTrajectory(payload: { conversations: any[], userId: string }) {
    const { conversations } = payload;
    const normalizedHistory = conversations.map((c, idx) => `### セッション記録 ${idx + 1} (日時: ${c.date})\n${normalizeSummary(c.summary)}`).join('\n\n---\n\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `キャリアの軌跡を臨床的に分析してください。専門用語を含め、全ての回答を日本語で行ってください。\n相談履歴:\n${normalizedHistory}`,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "日本語で記述してください。" },
                    triageLevel: { type: Type.STRING, description: "high/medium/lowのいずれか。" },
                    ageStageGap: { type: Type.NUMBER },
                    theoryBasis: { type: Type.STRING, description: "理論的背景を日本語で記述してください。" },
                    expertAdvice: { type: Type.STRING, description: "アドバイスを日本語で記述してください。" },
                    reframedSkills: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                userWord: { type: Type.STRING, description: "ユーザーの言葉（日本語）" }, 
                                professionalSkill: { type: Type.STRING, description: "専門スキル名（日本語）" }, 
                                insight: { type: Type.STRING, description: "洞察（日本語）" } 
                            } 
                        } 
                    },
                    sessionStarter: { type: Type.STRING, description: "日本語の問いかけ。" },
                    overallSummary: { type: Type.STRING, description: "総合サマリーを日本語で記述してください。" }
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
        contents: `適性診断を行ってください。職種名や理由を含め、全て日本語で出力してください。履歴:\n${historyText}`,
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "日本語で記述してください。" },
                    analysisSummary: { type: Type.STRING, description: "分析概要を日本語で記述してください。" },
                    recommendedRoles: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                role: { type: Type.STRING, description: "職種名を日本語で記述してください。" }, 
                                reason: { type: Type.STRING, description: "理由を日本語で記述してください。" }, 
                                matchScore: { type: Type.NUMBER } 
                            } 
                        } 
                    },
                    skillsToDevelop: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                skill: { type: Type.STRING, description: "スキル名を日本語で記述してください。" }, 
                                reason: { type: Type.STRING, description: "理由を日本語で記述してください。" } 
                            } 
                        } 
                    },
                    learningResources: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                title: { type: Type.STRING, description: "リソース名を日本語で記述してください。" }, 
                                type: { type: Type.STRING, description: "種類を日本語で記述してください。" }, 
                                provider: { type: Type.STRING, description: "提供元を日本語で記述してください。" } 
                            } 
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
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `次の発話候補を3つ提案してください。日本語で出力してください。\n履歴: ${historyText}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "日本語で記述してください。" } },
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
                properties: { 
                    user_summary: { type: Type.STRING, description: "日本語で記述してください。" }, 
                    pro_notes: { type: Type.STRING, description: "日本語で記述してください。" } 
                },
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
        contents: `隠れた可能性を抽出してください。根拠を含め日本語で出力してください。\n履歴:\n${historyText}`,
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
                                skill: { type: Type.STRING, description: "スキル名を日本語で記述してください。" }, 
                                reason: { type: Type.STRING, description: "理由を日本語で記述してください。" } 
                            } 
                        } 
                    } 
                },
                required: ["hiddenSkills"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}
