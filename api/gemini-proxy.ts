
// api/gemini-proxy.ts - v5.77 - 2026-05-06 - True Resiliency: Multi-tier fallback (Pro -> Flash -> Lite) with recursive retry
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// 最新のインフラ状況（503エラー）への究極の対策: 階層型フォールバック
const ANALYSIS_MODEL = 'gemini-1.5-pro'; // 高度な分析（優先）
const CHAT_MODEL = 'gemini-1.5-flash';    // 対話・中級分析（高速）
const LITE_MODEL = 'gemini-1.5-flash';    // バックアップ（最安定）

// フォールバックチェーンの定義
const MODEL_CHAIN = [ANALYSIS_MODEL, CHAT_MODEL, LITE_MODEL];

// Vercel Serverless Function Configuration
export const config = {
  maxDuration: 120, 
};

enum MessageAuthor { USER = 'user', AI = 'ai' }
interface ChatMessage { author: MessageAuthor; text: string; }
type AIType = 'human' | 'dog';

interface UserProfile {
  stage?: string;
  age?: string;
  gender?: string;
  complaint?: string;
  lifeRoles?: string[];
  typingFluency?: { mean: number; stdDev: number };
}

interface StoredConversation {
  id: number;
  userId: string;
  messages: ChatMessage[];
  summary: string;
  date: string;
}

let ai: GoogleGenAI | null = null;
const getAIClient = () => {
    if (!ai) {
        const apiKey = 
            process.env.GOOGLE_GENAI_API_KEY || 
            process.env.GEMINI_API_KEY || 
            process.env.API_KEY || 
            process.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("[CRITICAL] API Key is missing.");
            throw new Error("APIキーが設定されていません。SettingsのSecretsセクションを確認してください。");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

// SSE streaming helper
async function streamGeminiResponse(res: VercelResponse, modelCall: (modelName: string) => Promise<any>, initialModel: string) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const tryModel = async (modelIdx: number): Promise<void> => {
        const modelName = MODEL_CHAIN[modelIdx] || initialModel;
        try {
            const response = await modelCall(modelName);
            if (!response) throw new Error("応答オブジェクトが空です。");

            for await (const chunk of response) {
                try {
                    const text = chunk.text;
                    if (text) {
                        res.write(`data: ${JSON.stringify({ text })}\n\n`);
                    }
                } catch (chunkError) {
                    console.warn("Chunk processing warning:", chunkError);
                }
            }
            res.write('data: [DONE]\n\n');
        } catch (error: any) {
            const isRetryable = error.message?.includes('503') || error.message?.includes('429') || error.message?.includes('UNAVAILABLE') || error.message?.includes('overloaded');
            if (isRetryable && modelIdx < MODEL_CHAIN.length - 1) {
                console.warn(`[Proxy Fallback] ${modelName} failed (${error.message}). Trying ${MODEL_CHAIN[modelIdx + 1]}...`);
                res.write(`data: ${JSON.stringify({ status: 'system_fallback', message: 'インフラ混雑のため、より安定したエンジンに切り替えています...' })}\n\n`);
                return tryModel(modelIdx + 1);
            }
            throw error;
        }
    };

    try {
        const startIdx = MODEL_CHAIN.indexOf(initialModel);
        await tryModel(startIdx === -1 ? 0 : startIdx);
    } catch (error: any) {
        console.error("Proxy Stream Error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
        res.end();
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
            case 'analyzeTrajectory':
                await handleAnalyzeTrajectoryStream(payload, res);
                break;
            case 'performSkillMatching':
                await handlePerformSkillMatchingStream(payload, res);
                break;
            case 'generateSummary': 
                res.status(200).json(await handleGenerateSummary(payload)); 
                break;
            case 'generateSuggestions': 
                res.status(200).json(await handleGenerateSuggestions(payload)); 
                break;
            default: 
                res.status(400).json({ error: `Invalid action: ${action}` });
        }
    } catch (error: any) {
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.end();
        }
    }
}

async function handleAnalyzeTrajectoryStream(payload: { conversations: StoredConversation[], userId: string }, res: VercelResponse) {
    const { conversations } = payload;
    const historyText = conversations.slice(-5).map(c => `[${c.date}]: ${c.summary}`).join('\n---\n');

    const prompt = `分析依頼: 以下のキャリア相談履歴を専門的に分析し、JSONで出力せよ。\n${historyText}`;

    await streamGeminiResponse(res, (modelName) => getAIClient().models.generateContentStream({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    overallSummary: { type: Type.STRING },
                    triageLevel: { type: Type.STRING },
                    ageStageGap: { type: Type.NUMBER },
                    theoryBasis: { type: Type.STRING },
                    expertAdvice: { type: Type.STRING },
                    sessionStarter: { type: Type.STRING },
                    keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    detectedStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areasForDevelopment: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                    }
                },
                required: ["keyTakeaways", "overallSummary"]
            }
        }
    }), ANALYSIS_MODEL);
}

async function handlePerformSkillMatchingStream(payload: { conversations: StoredConversation[] }, res: VercelResponse) {
    const { conversations } = payload;
    const historyText = conversations.slice(-5).map(c => c.summary).join('\n');
    const prompt = `適職診断依頼: 履歴から診断を行いJSONで出力せよ。\n${historyText}`;

    await streamGeminiResponse(res, (modelName) => getAIClient().models.generateContentStream({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    analysisSummary: { type: Type.STRING },
                    recommendedRoles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { role: { type: Type.STRING }, reason: { type: Type.STRING }, matchScore: { type: Type.NUMBER } } } },
                    skillsToDevelop: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                    learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING } } } }
                },
                required: ["keyTakeaways", "analysisSummary"]
            }
        }
    }), ANALYSIS_MODEL);
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    
    // 特許準拠：打鍵リズムによる心理的コンテキストの抽出
    let fluencyContext = "";
    if (profile.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 600) fluencyContext = "【心理的コンテキスト: 慎重/ためらい】ユーザーは入力に時間がかかっており、言葉を選んでいるか、迷いがある可能性があります。より受容的で辛抱強い態度で接してください。";
        if (stdDev > 200) fluencyContext = "【心理的コンテキスト: 感情的動揺/葛藤】打鍵が不規則であり、内面で強い葛藤や焦燥がある可能性があります。安心感を与える言葉がけを意識してください。";
    }

    const systemInstruction = `あなたは「${aiName}」という名前のプロのキャリアコンサルタントです。
タイプ: ${aiType === 'dog' ? '癒やし（犬のキャラクターとして語尾に「ワン」などをつける可愛らしい口調）' : '共感的プロフェッショナル'}
ユーザー情報: ${JSON.stringify(profile)}
${fluencyContext}
方針: 100%の共感と傾聴。決して説教せず、ユーザーが自ら気づきを得られるように優しく対話してください。ユーザーのわずかな変化（打鍵リズムの乱れなど）にも配慮し、沈黙や迷いを否定せず、共にあることを伝えてください。

【用語の徹底: 以下の表現は絶対に使用しないでください】
- 「サーブ」（代わりに「サポート」「お手伝い」を使用）
- 「ご自身の時代」（代わりに「ご自身の年代」「世代」を使用）

【対話の終止符についての重要な指示（キャリコン基準）】
1. 早急な解決を求めず、ユーザーの「自己探索（ナラティブ）」をじっくり支援してください。
2. 対話が10〜15往復（相談者が10回以上発言）程度行われ、十分に内省が深まったと感じられるまでは、まとめの提案を控えてください。
3. ユーザーが自分自身で答えを見つけられるよう、問いかけ（開かれた質問）を中心に進めてください。`;

    // 履歴の厳格な正規化
    let contents: any[] = [];
    const recentMessages = messages.slice(-8); // 履歴を絞って安定性を高める

    recentMessages.forEach((msg) => {
        const role = msg.author === MessageAuthor.USER ? 'user' : 'model';
        const last = contents[contents.length - 1];
        if (last && last.role === role) {
            last.parts[0].text += `\n${msg.text}`;
        } else {
            contents.push({ role, parts: [{ text: msg.text }] });
        }
    });

    // API制約: userから始まりuserで終わる
    if (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
    }
    if (contents.length > 0 && contents[contents.length - 1].role === 'model') {
        contents.pop();
    }
    
    // 空なら最小限のメッセージ
    if (contents.length === 0) {
        contents.push({ role: 'user', parts: [{ text: "こんにちは。相談に乗ってください。" }] });
    }

    await streamGeminiResponse(res, (modelName) => getAIClient().models.generateContentStream({
        model: modelName, 
        contents,
        config: {
            systemInstruction,
            temperature: 0.8,
            topP: 0.95
        }
    }), CHAT_MODEL);
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory, profile } = payload;
    const historyText = chatHistory.slice(-40).map(m => `${m.author}: ${m.text}`).join('\n');
    
    const prompt = `あなたは世界最高峰のキャリア心理学者およびシニア・キャリアコンサルタントとして、これまでの対話から「キャリア・リフレクション・レポート」を執筆してください。
単なる経過報告ではなく、相談者が「自分一人では到達できなかった深さ」まで自分を見つめ直せるような、構造的かつ情熱的な分析を提供してください。

【執筆の要件】
1. 【対話の核心】: 相談者が言葉にできなかった「願い」や「恐れ」を言語化し、この対話がどのような意味を持ったのかを400文字程度で深く考察してください。
2. 【構造的分析】: 以下の4つの観点で、対話中の具体的な発言を根拠に分析してください。
   - 【価値観・信念】: 根底にある譲れないこだわり、大切にしている世界観。
   - 【潜在的リソース】: 本人が当たり前だと思っているが、実は類まれな強みや資質。
   - 【内的葛藤の構図】: 変化を拒んでいる要因や、ジレンマの構造。
   - 【自己効力感の芽】: 対話の中で少しでも前向きになった瞬間や、希望の兆し。
3. 【次への問いかけ】: 答えを教えるのではなく、一晩かけて考えたくなるような、本質を突いた問いを1つ提示してください。
4. 【専門的提言】: 管理者（カウンセラー）が次のセッションでどこに焦点を当てるべきか、キャリア理論の観点から具体的に助言してください。

【制約事項】
- 返答は必ず指定されたJSON形式に厳格に従うこと。
- ユーザープロファイル（${JSON.stringify(profile)}）を分析の文脈に組み込むこと。
- 受容的、支持的でありつつも、専門家としての鋭い洞察を恐れないこと。

履歴:
${historyText}`;

    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: { 
                title: { type: Type.STRING },
                core_insight: { type: Type.STRING },
                analysis_points: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: {
                            category: { type: Type.STRING }, 
                            observation: { type: Type.STRING } 
                        }
                    } 
                },
                next_inquiry: { type: Type.STRING },
                professional_summary: { type: Type.STRING }
            },
            required: ["title", "core_insight", "analysis_points", "next_inquiry", "professional_summary"]
        }
    };

    const tryModel = async (modelIdx: number): Promise<any> => {
        const modelName = MODEL_CHAIN[modelIdx] || ANALYSIS_MODEL;
        try {
            return await getAIClient().models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config
            });
        } catch (e: any) {
            const isRetryable = e.message?.includes('503') || e.message?.includes('429') || e.message?.includes('UNAVAILABLE');
            if (isRetryable && modelIdx < MODEL_CHAIN.length - 1) {
                console.warn(`[Summary Fallback] ${modelName} failed. Trying ${MODEL_CHAIN[modelIdx + 1]}...`);
                return tryModel(modelIdx + 1);
            }
            throw e;
        }
    };

    let result;
    try {
        const startIdx = MODEL_CHAIN.indexOf(ANALYSIS_MODEL);
        result = await tryModel(startIdx === -1 ? 0 : startIdx);
    } catch (e: any) {
        console.error("[Summary Final Error] Analysis failed after fallbacks:", e.message);
        throw e;
    }

    // 文字列として直接返るため、JSONをパースして構造を維持したまま返す
    try {
        const parsed = JSON.parse(result.text || "{}");
        return { 
            text: JSON.stringify(parsed)
        };
    } catch {
        return { text: JSON.stringify({ 
            title: "ここまでの振り返り",
            core_insight: result.text || "内容の生成に失敗しました。",
            analysis_points: [],
            next_inquiry: "現在のお気持ちはいかがでしょうか？",
            professional_summary: "（分析エラー）"
        })};
    }
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[], currentDraft?: string }) {
    const { messages, currentDraft } = payload;
    const historyText = messages.slice(-6).map(m => `${m.author === MessageAuthor.USER ? 'クライアント' : 'AI'}: ${m.text}`).join('\n');
    const prompt = `あなたは相談者の視点で対話の続きを予測するアシスタントです。
対話履歴と相談者が現在入力中のテキストを元に、次に発言したい候補を3つと、対話の進捗度（0.0〜1.0）をJSON形式で出力してください。

【進捗度(readinessScore)の基準】
0.0-0.3: まだ挨拶や導入のみ。発散が必要。
0.4-0.6: 主要な悩みや状況が語られ始め、具体性が増してきた。
0.7-1.0: 悩み、背景、理想が概ね共有され、まとめや専門家への相談に適した状態。

【サジェスト生成のルール】
1. AIとしての回答（助言）は出力しない。
2. 相談者が発話する形式にする。
3. 入力中の内容がある場合は、その補完フレーズを優先する。

履歴:
${historyText}

入力中: ${currentDraft || '(空)'}`;

    const result = await getAIClient().models.generateContent({
        model: LITE_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    readinessScore: { type: Type.NUMBER }
                },
                required: ["suggestions", "readinessScore"]
            }
        }
    });

    try {
        const parsed = JSON.parse(result.text || '{"suggestions":[], "readinessScore": 0.0}');
        return parsed;
    } catch {
        return { suggestions: [], readinessScore: 0.0 };
    }
}
