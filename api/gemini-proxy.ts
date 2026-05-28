// api/gemini-proxy.ts - v6.04 - 2026-05-28 - Filter out system error messages & prevent hallucinated reports on thin chats (Plan B)
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
                                type: { type: Type.STRING }, // 'course' | 'book' | 'article' | 'video'
                                provider: { type: Type.STRING }
                            },
                            required: ["title", "type", "provider"]
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
    if (profile.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 600) fluencyContext = "【心理的コンテキスト: 慎重/ためらい】ユーザーは入力に時間がかかっており、言葉を選んでいるか、迷いがある可能性があります。より受容的で辛抱強い態度で接してください。";
        if (stdDev > 200) fluencyContext = "【心理的コンテキスト: 感情的動揺/葛藤】打鍵が不規則であり、内面で強い葛藤や焦燥がある可能性があります。安心感を与える言葉がけを意識してください。";
    }

    let systemInstruction = "";
    if (aiType === 'dog') {
        systemInstruction = `あなたは温かく愛嬌のある犬のキャリアカウンセラー「${aiName}」として振る舞ってください。
以下のガイドラインに徹底して従ってください：
1. 相談者を温かくハッピーに包み込み、元気づけるような会話を心がけ、語尾には「〜ワン」「〜だワン！」などを自然につけてください。
2. 相談者がリラックスして、自分の心を開いて話せる安全な雰囲気を作ってください。
3. ${fluencyContext ? fluencyContext + '\n' : ''}上記の心理的コンテキストが生み出す相談者の心理的ゆらぎに、誰よりも敏感に優しく寄り添ってください。`;
    } else {
        systemInstruction = `あなたはプロフェッショナルで温かい人間のキャリアコンサルタント「${aiName}」として振る舞ってください。
以下のガイドラインに徹底して従ってください：
1. 深い共感と受容的な態度を持って相談者の悩みを真摯に聴き、優しく支えてください。
2. 指示的になりすぎず、問いかけや丁寧な傾聴を通じて、相談者が自己決定を行えるように伴走してください。
3. ${fluencyContext ? fluencyContext + '\n' : ''}上記の心理的コンテキストが示す相談者の言葉の奥にあるためらいや感情の揺れに対して、常に安全で心理的安全性に満ちた言葉がけを行ってください。`;
    }

    const contents = messages.map(msg => ({
        role: (msg.author as string) === 'user' || msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    await streamGeminiResponse(res, (model) => getAIClient().models.generateContentStream({
        model: model,
        contents,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            topP: 0.9,
        }
    }), CHAT_MODEL);
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile, aiType: AIType, aiName: string }) {
    const { chatHistory, profile, aiType, aiName } = payload;
    
    // システムエラーメッセージ等の除外フィルタ
    const errorKeywords = [
        "アクセスが集中しており",
        "応答の生成に失敗",
        "お時間を置いてから",
        "システムに負荷がかかっております",
        "エラーが発生しました",
        "推論システムにアクセスが集中"
    ];

    const isSystemErrorMsg = (text: string) => {
        return errorKeywords.some(kw => text.includes(kw));
    };

    // クレンジングされた会話履歴の作成（エラーメッセージ等を含む行を完全に除いたもの）
    const cleansedHistory = chatHistory.filter(m => {
        const text = m.text || "";
        return !isSystemErrorMsg(text);
    });

    // ユーザー側の発話
    const userMessages = cleansedHistory.filter(m => (m.author as string) === 'user' || m.author === MessageAuthor.USER);
    
    // システムエラー起因のユーザー疑問発言や単なる短すぎるテストワード（2文字以下）のノイズ除去
    const noiseKeywords = ["どうでしょうか", "エラー", "失敗", "動かない", "おーい", "てすと", "あいうえお", "テスト"];
    const validUserMessages = userMessages.filter(m => {
        const text = (m.text || "").trim();
        if (text.length <= 1) return false;
        return !noiseKeywords.some(kw => text.includes(kw));
    });

    const userMsgCount = validUserMessages.length;
    const userCharCount = validUserMessages.reduce((sum, m) => sum + (m.text?.length || 0), 0);
    const totalMsgCount = cleansedHistory.length;

    // 対話が極めて少ない（ユーザーからの有意義な発信が3回未満、または合計文字数が120文字未満、または全チャットが5ターン未満）
    const isThinConversation = userMsgCount < 3 || userCharCount < 120 || totalMsgCount < 5;
    
    // 心理的コンテキストの抽出（打鍵リズム）
    let fluencySummaryContext = "";
    if (profile && profile.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 600) {
            fluencySummaryContext = "【ユーザーの入力傾向: 迷い・慎重さ】\n相談者は対話中、言葉を慎重に選んでいました。その慎重さを優しく包み込み、「ゆっくりと自分に向き合えたこと」への賞賛に昇華させてください。";
        } else if (stdDev > 200) {
            fluencySummaryContext = "【ユーザーの入力傾向: 感情の揺れ】\n打鍵が変動しており、感情的な葛藤を抱えながら話していた可能性があります。その真剣なエネルギーを承認し、ありのままを包み込んでください。";
        } else {
            fluencySummaryContext = "【ユーザーの入力傾向: スムーズ・確信】\n整理された滑らかなタイピングでした。その思考の明確さを強みとして受け止めてください。";
        }
    } else {
        fluencySummaryContext = "【ユーザーの入力傾向: 不明（テキストインポートなど）】";
    }

    let conversationVolumeInstruction = "";
    if (isThinConversation) {
        conversationVolumeInstruction = `
【🚨重要：対話が極めて少ないセッション（お試しや最初の数言のみ等、またはエラーによる未遂）】
今回、相談者からの入力文字数や発話数が非常に少ないか、あるいはまだ会話を始めたばかりの段階です。
特に不正確な課題分析や、大げさな人生目標の断定、架空の強みのデコレーションなどによる「ハルシネーション（嘘や飛躍の激しい決めつけ）」は絶対に避けてください。
以下の要件に厳格に従って、スマートで謙虚な（おせっかいにならない）レポートを作成してください。

1. **お仕着せの強みや性格の断定は禁止**:
   - 会話がない、あるいは極めて薄いにもかかわらず「自らの意思で人生を選び取り価値を生み出す自立した美学がある」「周囲の期待に応えようとしすぎる責任感」のようなお決まりの具体的な記述は避けてください。
2. **今日の一歩に寄り添い、温かく歓迎する**:
   - 今日このシステムにアクセスして、キャリアについて考えるきっかけ（一歩）を持とうとした行動それ自体を、優しく温かにねぎらってください。
   - 大げさな称賛ではなく、謙虚で自然な寄り添いを心がけてください。
3. **対話内容の誠実な要約**:
   - もし自己紹介等で少しでも自身のことを語っていれば、その内容にだけ厳密に言及し、「まずは〜についてお話を聞かせていただきました」と簡潔に述べてください。
   - 挨拶のみなど中身がない場合は、最初の一歩を踏み出してくれたこと、アクセスしてくれたことへの歓迎に特化させてください。
4. **短く余白を残した文章量（100〜160文字程度）**:
   - 「対話の核心（core_insight）」には、長文の羅列は大げさに感じるため避け、相談者に負担を与えない簡潔な歓迎・寄り添いメッセージのみを記述してください。
5. **次への前向きな問いかけ（next_inquiry）**:
   - 背伸びせずに次回話せそうなことや、現在の軽い気持ちをそっと尋ねるような、間口の広い温かい問いかけ（例：「今、一番ホッとできる時間や、少し気になっているテーマはありますか？」など）にしてください。
`;
    } else {
        conversationVolumeInstruction = `
【対話が十分に繰り広げられたセッション】
履歴を精緻に読み解き、プロのキャリアコンサルタントとしてこれまでの対話から紡ぎ出された「真の核心（Crux）」を描き出してください。
ただし、誰にでも当てはまるようなテンプレ的なフレーズ（例：「現状への違和感を自己研鑽に変え…」「ポータブルスキル」等の決めつけ）の羅列は、相談者が冷めてしまう原因となります。
必ず、相談者が語った具体的な言葉や、エピソード（ファクト）に密接に寄り添った、その人だけの温かいレポートにしてください。
「対話の核心（core_insight）」は150〜250文字程度で、温かく美しいストーリーに織り込んで表現してください。
`;
    }

    // AIがエラー文などを誤認しないよう、クレンジングされたテキストをプロンプトに提供
    const historyText = cleansedHistory.slice(-30).map(m => `${m.author}: ${m.text}`).join('\n');

    const prompt = `あなたは卓越した優しさと専門性を兼ね備えたキャリアコンサルタントおよび伴走メンターとして、これまでの対話の集大成となる、簡潔で心の負担にならない「キャリア・リフレクション・レポート」を作成してください。
今回は「情報過多で疲れさせない」ことを最重視し、対話の「真の核心（Crux）」と「明日を照らす前向きな一言（問いかけ・エール）」だけに情報をぎゅっと結晶化させてください。

※打鍵傾向に基づく深い受容: ${fluencySummaryContext}

${conversationVolumeInstruction}

【記載のポイント（圧倒的な労いと前向きな気持ちの創出）】
1. **共に答えを紡いだ伴走表現**: 相談者が「AIと一緒にこれを紡ぎ出せたんだ」と感じられる, 心に染み渡る言葉遣い。
2. **明日を照らす最初の一歩（next_inquiry）**: 相談者が背伸びせず、深呼吸して未来を優しく見つめ直せるような、思わず前向きになれるスマートで優しい一言、または温かい問いかけ。

【制約・トーン】
- 敬意と温かい包容力に満ちた、文学的かつ極めて美しい日本語にすること。
- 分析項目（強み、ブレーキ等）は項目として羅列せず、すべて対話の核心（core_insight）の中にストーリーとして優しく織り込んでください。

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
                    title: { type: Type.STRING }, // レポートのタイトル
                    core_insight: { type: Type.STRING }, // 対話の核心（ぎゅっと結晶化させた文章）
                    next_inquiry: { type: Type.STRING }, // 明日を照らす温かい問いかけ・一言エール
                    professional_summary: { type: Type.STRING } // 専門家（管理者）向けの引き継ぎ用メモ
                },
                required: ["title", "core_insight", "next_inquiry", "professional_summary"]
            }
        }
    }), ANALYSIS_MODEL, CHAT_MODEL);

    try {
        const parsed = JSON.parse(result.text || "{}");
        parsed.analysis_points = [];
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
    const historyText = messages.slice(-6).map(m => `${(m.author as string) === 'user' || m.author === MessageAuthor.USER ? 'クライアント' : 'AI'}: ${m.text}`).join('\n');
    const prompt = `あなたは相談者の視点で対話の続きを予測するアシスタントです。
対話履歴と相談者が現在入力中のテキストを元に、次に発言したい候補を3つと、対話の進捗度（0.0〜1.0）をJSON形式で出力してください。

【進捗度(readinessScore) of 基準】
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
