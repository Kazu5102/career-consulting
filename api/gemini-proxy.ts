// api/gemini-proxy.ts - v6.51 - 2026-06-26 - 構文エラーの完全修復と重複要約ロジックの完全除去
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { JOB_TAXONOMY } from '../data/jobTaxonomy';

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
    
    const taxonomyString = JSON.stringify(JOB_TAXONOMY, null, 2);
    const prompt = `適職診断依頼:
以下のキャリア相談履歴（要約）を丁寧に読み取り、相談者の資質・ポテンシャル・現在のスキルと、提供された「標準職種タクソノミー（JOB_TAXONOMYマスターデータ）」を論理的・構造的にマッチングして、適職診断結果をJSONで出力せよ。

【標準職種タクソノミー（JOB_TAXONOMY）】
${taxonomyString}

【診断および出力ルール】
1. 提案する職種は、必ず上記の「標準職種タクソノミー」に定義されたもの（JOB_TAXONOMYの中の職種）のみとし、適合度の高い順に2〜3件抽出してください。それ以外の未定義な職種（「上級ITコンサルタント」「経営コンサルタント」など一足飛びで現実離れしたもの）を新規提案してはなりません。主に20代などの若手の段階的な成長パスに沿う実務的な一歩を提案してください。
2. recommendedRolesの各要素について：
   - 'job_code': 対象職種の code（例: "JOB_IT_SUPPORT"）を正確に代入。
   - 'role': 対象職種の name（例: "ITヘルプデスク・ユーザーサポート"）を完全に一致させて代入。
   - 'reason': 単なる「向いているかと思います」といった曖昧な記述を避け、相談者の具体的な発言要約や心理コンテキスト（迷い、几帳面さ、他者への丁寧な関わりなど）を特定し、その職種の「suitabilityBasisTemplate」の方向性を十分に踏めて、キャリア支援側からもしっかり背中を押し、本人にも「だから自分はこの仕事が向いているんだ」と自信・納得感を与えられる具体的かつ説得力あふれる適合根拠として解説文を記述してください。
   - 'matchScore': 60〜95の範囲の数値（対話の親和性に応じたパーセント度）。
3. 必ずすべての値（テキスト）を日本語で記述してください。

\n【対話履歴要約】\n${historyText}`;

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
                                job_code: { type: Type.STRING },
                                role: { type: Type.STRING },
                                reason: { type: Type.STRING },
                                matchScore: { type: Type.INTEGER }
                            },
                            required: ["job_code", "role", "reason", "matchScore"]
                        }
                    }
                },
                required: ["keyTakeaways", "analysisSummary", "recommendedRoles"]
            },
            temperature: 0.2,
            topP: 0.9
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
2. 評価・診断・性急な解決策・指示はすべて避け、相手が語った具体的なテーマ、事実、感情をリフレクションし、自分で気づくのを助けてください。
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

    const isWanko = aiType === 'dog';
    let avatarStyleInstruction = "";
    if (isWanko) {
        avatarStyleInstruction = `
【わんこ型アバター（共感モデル）としてのナラティブな記述方針】
- あなたは温かく愛嬌のある犬のカウンセラー「${aiName}」として振る舞い、各セクションを箇条書き（「- 」で始まる形式）としてまとめつつ、単なる無機質な事実の羅列ではなく、ストーリー仕立て（ナラティブ）の温かい語りかけ文体（「〜だね」「〜と感じているんだね」「〜だワン」等）で出力してください。
- 相談者のこれまでの歩みや、言葉の奥にある繊細な感情、ひたむきな姿勢に寄り添い、優しく包み込んで承認する表現を極めて重視してください。
`;
    } else {
        avatarStyleInstruction = `
【人間型アバター（プロモデル）としてのロジカルな記述方針】
- あなたはプロのキャリアカウンセラー「${aiName}」として振る舞い、各セクションを箇条書き（「- 」で始まる形式）としてまとめつつ、スマートなビジネスパーソンに響く、因果関係が論理的に整理された知的でシャープな文体（敬体：〜です、〜ます）で記述してください。
- なぜその悩みややりがいが発生しているのか、背景にある環境要因や自己スキーマなどを客観的かつクリアに言語化し、本人が論理的に現状を俯瞰して自己理解が深まるように構成してください。
`;
    }

    let conversationVolumeInstruction = "";
    if (isThinConversation) {
        conversationVolumeInstruction = `
【🚨重要：対話が極めて少ないセッション（最初の数言等、または十分に対話していない段階）】
相談者からの文字数や発話数が非常に少ないため、大げさな課題抽出やハルシネーション（強引な決めつけ）は厳禁です。
今日の一歩（このカウンセリングを開いて対話を試みたこと。その行動力）を心から歓迎・感謝しお祝いする、コンパクトで温かいメッセージに仕上げてください。その際も、以下の4つのセクション構成は絶対に維持し、ボリュームを抑えつつ最大限の受容を示してください。
`;
    } else {
        conversationVolumeInstruction = `
【対話が十分に繰り広げられたセッション】
履歴を精緻に読み解き、相談者が語った具体的な言葉や、エピソード（ファクト）に密接に寄り添った、その人だけの温かいレポートにしてください。
`;
    }

    const historyText = cleansedHistory.slice(-30).map(m => `${m.author}: ${m.text}`).join('\n');

    const prompt = `あなたは相談者の心の鏡であり、対話を通じて思考を整理する「心の可視化レポート（透明なノート）」を紡ぎ出すカウンセラーです。
これまでの対話の集大成となる、簡潔で心の負担にならない「心の可視化レポート」を作成してください。
今回のアシスタントは一切の「押し付けがましい評価」「上から目線のアドバイス」「お仕着せの診断」「強みの勝手な断定やラベル貼り」を行いません。
綺麗な言葉でまとめようとせず、相談者の「まとまらないありのままの言葉」をそのまま拾い上げ、ありのままに鏡のように整理（リフレクション）して記述してください。

※打鍵傾向に基づく深い受容: ${fluencySummaryContext}

${avatarStyleInstruction}

${conversationVolumeInstruction}

【記載の最重要方針】
必ず、以下の出力フォーマットの構成のみに従い、プレーンな日本語のMarkdownとして簡潔に出力してください。装飾や追加のセクション、余計な前置き・後書きなどの文言は一切不要です。
「user_summary」フィールドには、以下の構成から始まるテキストのみを格納してください。
(※〜)のような説明・指示の補足アノテーション文言を「user_summary」の出力テキストに含めることは絶対に禁止します。
他のセクションや追加の見出しを独自に作成しないでください。

【4セクション（案A）の構成ルール】
1. 「1. 本日お話ししたこと（テーマと事実）」：相談者が何について悩んでいたか、どんな状況を話していたかを、主観を交えず箇条書き（「- 」形式）で簡潔に整理してください。
2. 「2. 対話を通じて、あなたが気づいたこと・言葉にしたこと」：AIが引き出した結論ではなく、相談者自身が対話の後半で「あ、そうか」「私は〜だと思っていた」など、自分の言葉で紡ぎ出した『気づき』や『本当の気持ち』を箇条書きで抽出・整理してください。
3. 「3. 感情 of 動きと心の現在地（満足度・やりがい・悩み）」：対話の中で表れた、どのような瞬間にモチベーションや満足・やりがい、または精神的疲労や不満を感じていたかという「感情の揺れや、現在の心のコンテキスト」を箇条書きで整理してください。
4. 「4. 今後のリフレクションに向けて（あなた自身の気づき）」：これまでの対話を踏まえて、相談者がさらに内省を深め、自己探究を続けるための足がかりを記述します。
   - 【🚨超重要ルール】：このセクションの最後の箇条書きアイテム（あるいはその中の一文）は、具体的な行動アドバイス（「〜をしましょう」「〜を試してください」など）ではなく、相談者の内面に深くアプローチし、すぐには答えが出ない本質的な「問い（相談者への宿題）」で必ず締めくくってください。問いかけることで自己対話と次回のリピート相談を促します。
   （問いの例：「あなたが本当に大切にしたい『自分の心地よいリズム』とは、どのような状態を指すのでしょうか？」など）

【出力フォーマット】
■ Repotta（レポッタ）：本日の「心の可視化レポート」

1. 本日お話ししたこと（テーマと事実）
- 
- 

2. 対話を通じて、あなたが気づいたこと・言葉にしたこと
- 
- 

3. 感情 of 動きと心の現在地（満足度・やりがい・悩み）
- 
- 

4. 今後のリフレクションに向けて（あなた自身の気づき）
- 
- 

【管理者・専門家向け詳細メモ(professional_summary)】
- 「professional_summary」フィールドには、これまでの対話履歴を元に、次回の面談や次の支援ステップのための客観的・専門的な引き継ぎ情報を日本語で記述してください（500字程度）。キャリア構築理論（マーク・サビカスのナラティブ・アプローチ、レヴィンソンの理論など）に基づいた客観的かつ学術的・実践的な引き継ぎ指針・ラポール形成のポイントを含めてください。

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
