
// api/gemini-proxy.ts - v5.93 - 2026-05-24 - Model Upgrade: Adopt Gemini 3.5 Flash and Gemini 3.1 Flash Lite
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
        ai = new GoogleGenAI({ apiKey });
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
                break; // 成功したらループを抜ける
            } catch (error: any) {
                const isTransientError = error.status === 503 || error.status === 429 || 
                    error.message?.includes('429') || error.message?.includes('503') || 
                    error.message?.includes('UNAVAILABLE') || error.message?.includes('fetch failed');
                
                console.error(`[Stream Error] Attempt ${attempt+1} failed:`, error.message || error);
                
                if (!isTransientError || attempt === MAX_RETRIES - 1) {
                    throw error; // 最後のリトライか、非一時的なエラーなら投げる
                }
                
                // 次のモデルへフォールバック
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

        // [STABILITY] SDK 1.19.0: response 自体が AsyncIterable であることを前提とする
        if (!response) {
            throw new Error("APIサーバーからの応答がありませんでした（リトライオーバー）。");
        }

        for await (const chunk of response) {
            try {
                // GenerateContentResponse.text はプロパティ。メソッドではない。
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
        console.error("Proxy Stream Error:", error);
        
        let errorDetails = "An unexpected error occurred during generation.";
        if (error.message) {
            errorDetails = error.message;
        } else if (typeof error === 'string') {
            errorDetails = error;
        }
        res.write(`data: ${JSON.stringify({ error: errorDetails })}\n\n`);
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
                    recommendedRoles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { role: { type: Type.STRING }, reason: { type: Type.STRING }, matchScore: { type: Type.NUMBER } } } },
                    skillsToDevelop: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { skill: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                    learningResources: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING } } } }
                },
                required: ["keyTakeaways", "analysisSummary"]
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
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
            temperature: 0.8,
            topP: 0.95
        }
    }), CHAT_MODEL);
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory, profile } = payload;
    const historyText = chatHistory.slice(-30).map(m => `${m.author}: ${m.text}`).join('\n');
    
    // 特許準拠：打鍵リズムによる心理的コンテキストの抽出を要約にも活用
    let fluencySummaryContext = "";
    if (profile.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 600) fluencySummaryContext = "【ユーザーの入力傾向: 迷い・慎重さ】\n相談者は対話中、言葉を慎重に選んでいる様子が見受けられました。この「迷い」の裏にある本当の想いや、決断への慎重さに光を当てるようなレポートを心がけてください。";
        else if (stdDev > 200) fluencySummaryContext = "【ユーザーの入力傾向: 感情の揺れ】\n打鍵の変動が大きく、感情的な高ぶりや葛藤を抱えながら話していた可能性があります。そのエネルギーを肯定し、今のありのままを包み込むような表現を重視してください。";
        else fluencySummaryContext = "【ユーザーの入力傾向: スムーズ・確信】\n比較的迷いなく想いを綴られていました。その決断力や思考の整理の速さを「強み」として統合してください。";
    }

    const prompt = `あなたは熟練のキャリアコンサルタントおよびメンターとして、これまでの対話の集大成となる「キャリア・リフレクション・レポート」を作成してください。
今回のレポートは、AIが一方的に分析・評価するのではなく、「相談者とAIが共に話し合い、悩み、歩みを進めて作り上げた」という【共創感】と【労いのトーン】を極限まで高めた内容にしてください。

【記載のポイント（重点事項）】
1. **打鍵傾向に基づく共感**: ${fluencySummaryContext}
2. **共に作り上げた実感の醸成**: 「〜というお話を伺い、私自身も深く考えさせられました」「ご自身の言葉で語っていただいたことで、はっきりと見えてきましたね」といった、伴走者としての温かい表現。
3. **深い洞察（インサイト）**:
  a. 対話を通じて明らかになった、相談者が「本当に大切にしている価値観（コア）」や「信念」
  b. ご自身が気付いていなかったかもしれない、対話の端々から感じられる素晴らしい「強み」や「リソース」
  c. 相談を阻んでいた「葛藤」や「ブレーキ」の正体
4. **具体的なエピソードの引用**: 単なる一般論ではなく、対話の中で相談者が語ってくれた象徴的な言葉や、その時の感情の揺れを織り交ぜる。
5. **「今日の一歩」のパーソナライズ**: 固定メッセージではなく、この対話だからこそ得られた「今の相談者に最も響く気づき」を一文で深掘りして生成してください。

【制約事項】
- キャリアコンサルティングの守秘義務と敬意を徹底すること。
- ユーザープロファイル（${JSON.stringify(profile)}）を加味した具体的なアドバイス。
- 評価や断定ではなく、受容と提案（「〜かもしれないですね」など）のトーンにし、各項目の文章量はしっかりと充実させること。

履歴:
${historyText}`;

    const result = await fetchGeminiWithRetry((modelName) => getAIClient().models.generateContent({
        model: modelName, // 要約から分析へグレードアップ (Flash -> Pro)
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { 
                    title: { type: Type.STRING }, // レポートのタイトル
                    core_insight: { type: Type.STRING }, // 対話の核心（深掘りした文章）
                    analysis_points: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: {
                                category: { type: Type.STRING }, // 【価値観】【強み】など
                                observation: { type: Type.STRING } // 具体的な分析内容
                            }
                        } 
                    },
                    next_inquiry: { type: Type.STRING }, // 次への問いかけ
                    professional_summary: { type: Type.STRING } // 専門家（管理者）向けの引き継ぎ用メモ
                },
                required: ["title", "core_insight", "analysis_points", "next_inquiry", "professional_summary"]
            }
        }
    }), ANALYSIS_MODEL, CHAT_MODEL);

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
