// api/gemini-proxy.ts - v6.47 - 2026-06-28 - mockGeminiServiceにcheckServerStatusを追加し、アプリ全体のバージョンを6.47に統一
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// 最新のスキルガイドラインに基づくモデル選定
const CHAT_MODEL = 'gemini-3.5-flash';
const ANALYSIS_MODEL = 'gemini-3.1-pro-preview';
const LITE_MODEL = 'gemini-3.1-flash-lite';

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
        ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return ai;
};

// Retry helper for non-streaming requests
async function fetchGeminiWithRetry(modelCall: (modelName: string) => Promise<any>, initialModel: string, fallbackModel?: string) {
    let currentModel = initialModel;
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                const waitTimeArgs = Math.pow(2, attempt) * 500 + Math.random() * 500;
                await new Promise(r => setTimeout(r, waitTimeArgs));
            }
            return await modelCall(currentModel);
        } catch (error: any) {
             const isTransientError = error.status === 503 || error.status === 429 || 
                 error.message?.includes('429') || error.message?.includes('503') || 
                 error.message?.includes('UNAVAILABLE') || error.message?.includes('fetch failed') ||
                 error.message?.includes('not found') || error.status === 404;
             
             console.error(`[Generate Error] Attempt ${attempt+1} failed for model ${currentModel}:`, error.message || error);
             
             if (!isTransientError || attempt === MAX_RETRIES - 1) {
                 if (currentModel === ANALYSIS_MODEL) {
                     currentModel = CHAT_MODEL;
                     console.warn(`[Generate Fallback] Switching to ${CHAT_MODEL}`);
                     continue;
                 } else if (currentModel === CHAT_MODEL && (LITE_MODEL as string) !== (CHAT_MODEL as string)) {
                     currentModel = LITE_MODEL;
                     console.warn(`[Generate Fallback] Switching to ${LITE_MODEL}`);
                     continue;
                 }
                 throw error;
             }
         }
     }
}

// SSE streaming helper
async function streamGeminiResponse(res: VercelResponse, modelCall: (modelName: string) => Promise<any>, initialModel: string) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
        let response = null;
        let currentModel = initialModel;
        const MAX_RETRIES = 3;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    const waitTimeArgs = Math.pow(2, attempt) * 500 + Math.random() * 500;
                    console.warn(`[Retry] Attempt ${attempt+1} waiting ${Math.round(waitTimeArgs)}ms for model ${currentModel}`);
                    await new Promise(r => setTimeout(r, waitTimeArgs));
                }
                response = await modelCall(currentModel);
                break; // 成功
            } catch (error: any) {
                const isTransientError = error.status === 503 || error.status === 429 || 
                    error.message?.includes('429') || error.message?.includes('503') || 
                    error.message?.includes('UNAVAILABLE') || error.message?.includes('fetch failed');
                
                console.error(`[Stream Error] Attempt ${attempt+1} failed:`, error.message || error);
                
                if (!isTransientError || attempt === MAX_RETRIES - 1) {
                    throw error;
                }
                
                if (currentModel === ANALYSIS_MODEL) {
                    currentModel = CHAT_MODEL;
                    res.write(`data: ${JSON.stringify({ status: 'quota_fallback', text: '\n[Info: サーバー高負荷のため、高速モデルで再試行しています...]\n' })}\n\n`);
                } else if (currentModel === CHAT_MODEL && (CHAT_MODEL as string) !== (LITE_MODEL as string)) {
                    currentModel = LITE_MODEL;
                    res.write(`data: ${JSON.stringify({ status: 'quota_fallback', text: '\n[Info: サーバー高負荷のため、軽量モデルで再試行しています...]\n' })}\n\n`);
                } else {
                    throw error;
                }
            }
        }

        if (!response) {
            throw new Error("APIサーバーからの応答がありませんでした（リトライオーバー）。");
        }

        for await (const chunk of response) {
            try {
                const text = chunk.text;
                if (text) {
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
            } catch (chunkError) {
                console.error("[Stream Chunk Error] failed to read chunk text", chunkError);
            }
        }
    } catch (error: any) {
        console.error("[Stream Framework Error]", error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed due to server error' })}\n\n`);
    } finally {
        res.write('data: [DONE]\n\n');
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

    const prompt = `分析依頼: 以下のキャリア相談履歴を専門的に分析し、JSONで出力せよ。
必ずすべての値（テキスト）を日本語で記述してください。
\n${historyText}`;

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
            },
            temperature: 0.0,
            topP: 0.8
        }
    }), ANALYSIS_MODEL);
}

async function handlePerformSkillMatchingStream(payload: { conversations: StoredConversation[] }, res: VercelResponse) {
    const { conversations } = payload;
    const historyText = conversations.slice(-5).map(c => c.summary).join('\n');
    const prompt = `適職診断依頼: 履歴から診断を行いJSONで出力せよ。
必ずすべての値（テキスト）を日本語で記述してください。
\n${historyText}`;

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
                                type: { type: Type.STRING }, // 'course' | 'book' | 'article'
                                url: { type: Type.STRING }
                            },
                            required: ["title", "type", "url"]
                        }
                    }
                },
                required: ["keyTakeaways", "analysisSummary", "recommendedRoles", "skillsToDevelop", "learningResources"]
            },
            temperature: 0.0,
            topP: 0.8
        }
    }), ANALYSIS_MODEL);
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    
    // 特許準拠：打鍵リズムによる心理的コンテキストの抽出
    let fluencyContext = "";
    if (profile && profile.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 600) fluencyContext = "【心理的コンテキスト: 慎重/ためらい】ユーザーは入力に時間がかかっており、言葉を選んでいるか、迷いがある可能性があります。より受容的で粘り強い態度で接してください。";
        if (stdDev > 200) fluencyContext = "【心理的コンテキスト: 感情的動揺/葛藤】打鍵が不規則であり、内面で強い葛藤や焦燥がある可能性があります。安心感を与える言葉がけを意識してください。";
    }

    let systemInstruction = "";
    if (aiType === 'dog') {
        systemInstruction = `あなたは温かく愛嬌のある犬のキャリアカウンセラー「${aiName}」として振る舞ってください。
以下のガイドラインに徹底して従ってください：
1. 相談者を温かくハッピーに包み込み、元気づけるような会話を心がけ、時折語尾に「わん」「ワン」などを付けてください。
2. 否定的な意見、評価、性急なアドバイスは一切せず、相手が語る事実や感情に寄り添い、鏡のように反復（リフレクション）してください。
3. 心理相談のプロフェッショナルなスキルに基づいて、相手の心身を守り、次の気づきへの小さなヒントを提供する程度に留めてください。`;
    } else {
        systemInstruction = `あなたは高い傾聴力と共感力を持つ人間のプロキャリアカウンセラー「${aiName}」として振る舞ってください。
以下のガイドラインに徹底して従ってください：
1. クライアントが自らの体験と本音に向き合えるよう、高い受容性と支持性を示して応答してください。
2. 評価・診断・性急な解決策 of 指示はすべて避け、相手が語った具体的なテーマ, 事実, 感情をリフレクションし、自分で気づくのを助けてください。
3. 学術的なカウンセリング理論に根差した、対等かつ温かい寄り添い言葉かけを行ってください。`;
    }

    if (fluencyContext) {
        systemInstruction += `\n\n${fluencyContext}`;
    }

    const contents = messages.map(m => ({
        role: m.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    await streamGeminiResponse(res, (modelName) => getAIClient().models.generateContentStream({
        model: modelName,
        contents,
        config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.9,
        }
    }), CHAT_MODEL);
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }) {
    const { chatHistory, aiType, aiName, profile } = payload;
    
    const errorKeywords = [
        "APIキーが設定されていません", 
        "Model not found", 
        "quota exceeded", 
        "upstream error", 
        "システムに負荷がかかっております",
        "エラーが発生しました",
        "推論システムにアクセスが集中"
    ];

    const cleansedHistory = chatHistory.filter(msg => {
        if (!msg.text) return false;
        return !errorKeywords.some(keyword => msg.text.includes(keyword));
    });

    const totalUserChars = cleansedHistory
        .filter(m => m.author === MessageAuthor.USER)
        .reduce((sum, m) => sum + (m.text?.length || 0), 0);
    const isThinConversation = totalUserChars < 25;

    let fluencySummaryContext = "";
    if (profile && profile.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 0) {
            if (mean > 600 || stdDev > 200) {
                fluencySummaryContext = "【ユーザーの入力傾向: 感情の揺れ・内省の深さ】\n打鍵速度が遅めであるか変動しており、感情的な葛藤を抱き真剣に言葉を選びながら話していた可能性があります。そのひたむきな姿勢とエネルギーを無条件に承認し、ありのままを包み込んでください。";
            } else {
                fluencySummaryContext = "【ユーザーの入力傾向: スムーズ・自己整理の進展】\n非常に滑らかで整理されたタイピングでした。思考の明確さとしなやかさを強みとして記述に取り込んでください。";
            }
        } else {
            fluencySummaryContext = "【ユーザーの入力傾向: 不明】";
        }
    } else {
        fluencySummaryContext = "【ユーザーの入力傾向: 不明】";
    }

    let conversationVolumeInstruction = "";
    if (isThinConversation) {
        conversationVolumeInstruction = `
【🚨重要：対話が極めて少ないセッション（最初の数言等、または十分に対話していない段階）】
相談者からの文字数や発話数が非常に少ないため、大げさな課題抽出やハルシネーション（強引な決めつけ）は厳禁です。
今日の一歩（このカウンセリングを開いて対話を試みたこと。その行動力）を心から歓迎・感謝しお祝いする、コンパクトで温かいメッセージに仕上げてください。
`;
    } else {
        conversationVolumeInstruction = `
【対話が十分に繰り広げられたセッション】
履歴を精緻に読み解き、相談者が語った具体的な言葉や、エピソード（ファクト）に密接に寄り添った、その人だけの温かいレポートにしてください。
`;
    }

    let toneInstruction = "";
    if (aiType === 'dog') {
        toneInstruction = `
【出力の文体トーン：わんこ型（共感ナラティブ・モデル）🐶】
- 各セクションは、箇条書きではなく、ストーリー仕立て（ナラティブ）の温かく語りかけるような日本語文章で出力してください。
- 相談者のこれまでの歩みと感情に寄り添い、優しく包み込むような表現を重視してください。語尾は「〜だワン」「〜だね」など、温かみのある表現にしてください。
`;
    } else {
        toneInstruction = `
【出力の文体トーン：人間型（プロフェッショナル・ロジカル・モデル）👤】
- 各セクションは、因果関係（なぜその悩み・やりがいが発生しているか、どのような背景があるか）が論理的に整理された、スマートなビジネスパーソン向けの知的な文体で記述してください。
- 客観的かつ構造的な段落、あるいは箇条書きで分かりやすく整理してください。
`;
    }

    const historyText = cleansedHistory.slice(-30).map(m => `${m.author}: ${m.text}`).join('\n');

    const prompt = `あなたは相談者の言葉をただ整理して並べる「透明なノート」です。綺麗にまとめようとせず、相談者の「まとまらないありのままの言葉」を尊重してください。
これまでの対話の集大成となる、簡潔で心の負担にならない「心の可視化レポート（透明なノート）」を作成してください。
今回のアシスタントは一切の「評価」「アドバイス」「勝手な解釈」「お仕着せの診断」「強みの勝手な断定やラベル貼り」を行いません。
綺麗な言葉でまとめようとせず、相談者の「まとまらないありのままの言葉」をそのまま拾い上げ、ありのままに鏡のように整理（リフレクション）して文章化してください。
また、相談データが極めて少ない場合、またはエラー等で会話が進まなかった場合は、今日の一歩をねぎらい、温かく歓迎することに特化させてください。

※打鍵傾向に基づく深い受容: ${fluencySummaryContext}

${conversationVolumeInstruction}
${toneInstruction}

【🚨セクション4に関する極めて重要な構成指示ルール】
- 「4. 対話を通じて言葉にした『あなた自身の気づき』」の最後の1文は、AIからの具体的な行動アドバイスや今後のプランを提示しすぎてはいけません。
- 代わりに、対話内容を踏まえた『すぐには答えが出ない、人生の本質的な問い（例：あなたが一番呼吸が軽くなる姿とは？）』を必ず 1 つ、独立した一文として出力し、ユーザーへの宿題（問い）として残して締めくくってください。

【記載 of 最重要方針】
必ず、以下の出力フォーマットの構成のみに従い、プレーンな日本語のMarkdownとして簡潔に出力してください。装飾や追加のセクション、余計な前置き・後書きなどの文言は一切不要です。
「user_summary」フィールドには、以下の構成から始まるテキストのみを格納してください。
(※〜)のような説明・指示の補足アノテーション文言を「user_summary」の出力テキストに含めることは絶対に禁止します。
他のセクションや追加の見出しを独自に作成しないでください。

【出力フォーマット】
■ Repotta（レポッタ）：本日の「心の可視化レポート」

1. 本日の対話のテーマと現状（客観的ファクト）
(内容を記述。わんこ型はストーリー仕立て、人間型は論理的な文章)

2. あなたが大切にしたいこと（満足点・やりがい・価値観）
(内容を記述。わんこ型はストーリー仕立て、人間型は論理的な文章)

3. 現在感じている葛藤や課題（心のひっかかり・悩み）
(内容を記述. わんこ型はストーリー仕立て、人間型は論理的な文章)

4. 対話を通じて言葉にした「あなた自身の気づき」
(内容を記述。最後の1文は必ず『すぐには答えが出ない、本質的な問い』にすること。わんこ型はストーリー仕立て、人間型は論理的な文章)

【管理者・専門家向け詳細メモ(professional_summary)】
- 「professional_summary」フィールドには、これまでの対話履歴を元に、次回の面談や次の支援ステップのための客観的・専門的な引き継ぎ情報を日本語で記述してください（500字程度）。キャリア構築理論（マーク・サビカスのナラティブ・アプローチ、レヴィンソンの理論など）に基づいた客観的かつ学術的・実践的な引き継ぎ指針・ラポール形成 of ポイントを含めてください。

履歴:
${historyText}`;

    const result = await fetchGeminiWithRetry((modelName) => getAIClient().models.generateContent({
        model: modelName, 
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    user_summary: { type: Type.STRING }, // キャリア・リフレクション・レポート（プレーンMarkdown形式）
                    professional_summary: { type: Type.STRING } // 専門家（管理者）向けの引き継ぎ用メモ
                },
                required: ["user_summary", "professional_summary"]
            }
        }
    }), ANALYSIS_MODEL, CHAT_MODEL);

    try {
        const parsed = JSON.parse(result.text || "{}");
        return { 
            text: JSON.stringify({
                user_summary: parsed.user_summary || result.text || "",
                professional_summary: parsed.professional_summary || "",
                analysis_points: []
            })
        };
    } catch {
        return { text: JSON.stringify({ 
            user_summary: result.text || "内容の生成に失敗しました。",
            professional_summary: "（分析エラー）",
            analysis_points: []
        })};
    }
}

async function handleGenerateSuggestions(payload: { messages: ChatMessage[], currentDraft?: string }) {
    const { messages, currentDraft } = payload;
    const historyText = messages.slice(-6).map(m => `${(m.author as string) === 'user' || m.author === MessageAuthor.USER ? 'クライアント' : 'AI'}: ${m.text}`).join('\n');
    const prompt = `あなたは相談者の視点で対話の続きを予測するアシスタントです。
対話履歴と相談者が現在入力中のテキストを元に、次に発言したい候補を3つと、対話の進捗度（0.0〜1.0）をJSON形式で出力してください。

【進捗度(readinessScore) of 基準】
0.0-0.3: まだ挨拶や導入のみ。発散が必要。
0.4-0.6: 主要な悩みや状況が語られ始め、具体性が増してきた。
0.7-1.0: 悩み、背景、理想が概ね共有され、まとめや専門家への相談に適した状態。

【サジェスト生成 of ルール】
1. AIとしての回答（助言）は出力しない。
2. 相談者が発話する形式にする。
3. 入力中の内容がある場合は、その補完フレーズを優先する。

履歴:
${historyText}

入力中: ${currentDraft || '(空)'}`;

    const result = await fetchGeminiWithRetry((modelName) => getAIClient().models.generateContent({
        model: modelName,
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
    }), LITE_MODEL, CHAT_MODEL);

    try {
        const parsed = JSON.parse(result.text || '{"suggestions":[], "readinessScore": 0.0}');
        return parsed;
    } catch {
        return { suggestions: [], readinessScore: 0.0 };
    }
}
