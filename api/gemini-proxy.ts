
// api/gemini-proxy.ts - v4.60 - System Instructions & Statistical Model Sync
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Vercel Serverless Function Configuration
export const config = {
  maxDuration: 60, // Maximum allowed duration
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

// Helper to stream JSON chunks back to client to keep connection alive
async function streamGeminiResponse(res: VercelResponse, modelCall: () => Promise<any>) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Initial keep-alive message to establish connection immediately
    res.write(': start\n\n');

    try {
        const stream = await modelCall();
        for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
    } catch (error: any) {
        console.error("Streaming Error:", error);
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
            case 'generateSummary': 
                res.status(200).json(await handleGenerateSummary(payload)); 
                break;
            case 'generateSuggestions': 
                res.status(200).json(await handleGenerateSuggestions(payload)); 
                break;
            case 'analyzeTrajectory':
                // Changed to Streaming Handler
                await handleAnalyzeTrajectoryStream(payload, res);
                break;
            case 'performSkillMatching':
                // Changed to Streaming Handler
                await handlePerformSkillMatchingStream(payload, res);
                break;
            default: 
                res.status(400).json({ error: `Invalid action received: '${action}'.` });
        }
    } catch (error: any) {
        console.error(`[Proxy Error] ${error.message}`);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.end();
        }
    }
}

async function handleAnalyzeTrajectoryStream(payload: { conversations: StoredConversation[], userId: string }, res: VercelResponse) {
    const { conversations } = payload;
    const historyText = conversations.map(c => `[日付: ${c.date}]\n${c.summary}`).join('\n---\n');
    const isSingleSession = conversations.length === 1;

    const contextInstruction = isSingleSession
        ? `相談履歴は**1件のみ**です。
長期的な変容は見えませんが、この1回のセッション内における「感情の微細な揺れ動き」や「発言の矛盾点」、「語られなかった空白」に着目し、【マイクロ・ナラティブ（微細な物語）】として深層心理を分析してください。
「前回からの変化」等の項目については、今回のセッションでの気づきや変化の兆しを記述してください。`
        : `相談履歴は**複数件**あります。
初回から現在に至るまでの【時系列での内的変容プロセス（マクロ・ナラティブ）】を重視して分析してください。`;
    
    const prompt = `あなたは臨床心理の深い知見を持つ、キャリアコンサルタントの「スーパーバイザー」です。
職種提案やスキルマッチングは行わず、相談者の【内的変容のプロセス】のみを鋭く分析してください。

### 前提条件:
${contextInstruction}

### 分析指示:
1. 相談者の自己開示レベルの変化（防衛から自己一致へ）を追う。
2. キャリア・コンストラクション理論における「ライフテーマ」の萌芽を特定する。
3. 表層的な悩み（不満）の背後にある「真の課題」を心理学的な見立てで提示する。
4. 専門家が次回の面談で「どこを掘り下げるべきか」を具体的に教示する。

履歴:
${historyText}`;

    await streamGeminiResponse(res, () => getAIClient().models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "臨床的な重要指摘事項" },
                    overallSummary: { type: Type.STRING, description: "初回から現在までのナラティブな変容プロセス（心理動態の専門的解説）" },
                    triageLevel: { type: Type.STRING, enum: ["high", "medium", "low"], description: "心理的緊急度（安定/不安定）" },
                    ageStageGap: { type: Type.NUMBER, description: "実年齢と心理的成熟（発達課題）の乖離度(0-100)" },
                    theoryBasis: { type: Type.STRING, description: "分析の根拠とした学術的キャリア理論" },
                    expertAdvice: { type: Type.STRING, description: "担当コンサルタントへの臨床的指導アドバイス" },
                    sessionStarter: { type: Type.STRING, description: "次回、相談者の内省の扉を叩くための問いかけ" }
                },
                required: ["keyTakeaways", "overallSummary", "triageLevel", "ageStageGap", "theoryBasis", "expertAdvice", "sessionStarter"]
            }
        }
    }));
}

async function handlePerformSkillMatchingStream(payload: { conversations: StoredConversation[] }, res: VercelResponse) {
    const { conversations } = payload;
    const historyText = conversations.map(c => c.summary).join('\n');
    
    const prompt = `あなたは誠実でリアリティを重視する「キャリアパス・コーディネーター」です。
相談者の現状のスキルと経験を尊重し、極端に高度すぎる職種への偏りを避け、相談者が納得できる「地続きの適職」を提案してください。

### 診断のガイドライン:
1. **地続きの提案**: 相談者が明日からでも目指せる、または現在の職種の延長線上にある「現実的な一歩（ネクストステップ）」を優先すること。
2. **具体的接続**: 抽象的なスキル名ではなく、「○○業務での△△の経験が、応募職種の□□で直接活きる」という具体的な接続根拠を示すこと。
3. **高望み防止**: 専門知識や実務経験が明らかに不足しているハイレベルな専門職（例：未経験からの戦略コンサル等）は避け、代わりにその前段階となる職種を提示すること。
4. **ギャップの誠実な提示**: 推奨する職種に対して、現在のスキルで何が足りないか（学習課題）を明確にすること。

履歴:
${historyText}`;

    await streamGeminiResponse(res, () => getAIClient().models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysisSummary: { type: Type.STRING, description: "現在の経験をベースとした、現実的な強みの再定義レポート" },
                    recommendedRoles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                role: { type: Type.STRING, description: "推奨職種名（現状に即したもの）" },
                                reason: { type: Type.STRING, description: "現在のどの経験がどのように活かせるかという具体的な接続根拠" },
                                matchScore: { type: Type.NUMBER, description: "現在のスキルセットでの即戦力適合度(0-100)" }
                            }
                        }
                    },
                    skillsToDevelop: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING, description: "次に習得すべき具体的スキル" },
                                reason: { type: Type.STRING, description: "なぜそのスキルが今のキャリアを広げるために必要か" }
                            }
                        }
                    },
                    learningResources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING, description: "学習リソースのタイトル" },
                                type: { type: Type.STRING, enum: ["course", "book", "article", "video"], description: "リソースの種類" },
                                provider: { type: Type.STRING, description: "提供元（Udemy, Coursera, Amazon, etc.）" }
                            }
                        }
                    }
                },
                required: ["analysisSummary", "recommendedRoles", "skillsToDevelop", "learningResources"]
            }
        }
    }));
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    const roleDefinition = aiType === 'human' 
        ? { role: "Professional Career Consultant", tone: "冷静、誠実、論理的なプロの敬語", mindset: "自己効力感を高め、対話を通じて内省を促す。" }
        : { role: "Compassionate Partner (Dog)", tone: "親しみやすい、癒やし、肯定的（語尾ワン）", mindset: "心理的安全性と共感を最優先する。" };

    const baseSystemInstruction = `
## 役割とペルソナ (Persona)
あなたは「Professional Career Consultant」です。厚生労働省の倫理綱領 [6, 8, 9] および「人間中心の設計」ガイドライン [5] に基づき、相談者の自律的な意思決定を支援するパートナーとして振る舞ってください。

## 基本指針 (Core Principles)
1. **自己決定権の尊重**: 結論を一方的に提示せず、問いかけ（コーチング）を通じて相談者自らの気づきを促してください [5]。
2. **非診断性の維持**: 医学的、法的、または確定的な職業診断は行わず、統計的な傾向に基づく「情報提供」に徹してください [4]。
3. **倫理性と誠実性**: 常に冷静、誠実、論理的なプロの敬語（AI Type: Human）を用いてください [1]。

## 参照理論 (Theoretical Framework)
以下のキャリア理論を適宜参照し、根拠のある支援を行ってください [6]。
- マーク・サビカス（ナラティブ・キャリア・カウンセリング）
- ナンシー・シュロスバーグ（4Sモデル：状況・自己・支援・戦略）
- ドナルド・スーパー（発達課題とライフキャリア・レインボー）

## 応答ルール (Output Rules)
1. **感情タグの付与**: すべての応答の冒頭に、相談者の状態を推察した感情タグ [HAPPY], [CURIOUS], [THINKING], [REASSURE] のいずれか1つを必ず付与してください [2]。
2. **ネガティブワードへの対処**: 相談者が「消えたい」「不安でたまらない」等の強い負の感情を示した場合、共感を示した上で、専門家（人間のコンサルタント）への相談を優しく促す「トリアージ」を実行してください [6]。

## 構造化出力（JSON要求時）
サマリー生成や分析が要求された場合は、以下のスキーマを厳守してください [2]。
{
  "user_summary": "相談者が自分を見つめ直すための、具体的かつ優しい要約",
  "pro_notes": "管理者向けの専門的な所見（内的変容、発達段階のギャップ、トリアージレベルを含む）"
}

## 禁止事項 (Strict Prohibitions)
- 相談者の入力をAIモデルの直接的な再学習に使用するような振る舞いや、外部サーバーへのデータ保存を示唆する発言を禁じます（ローカルファースト設計の遵守） [5, 6]。
- ハルシネーション（もっともらしい嘘）を避けるため、公的制度や資格要件等の事実確認が必要な事項は必ず「一次情報の確認」を促してください [4]。
`.trim();

    const dynamicContext = `
---
【現在のセッション情報】
名前: ${aiName}
相談者プロファイル: ${JSON.stringify(profile)}
${aiType === 'dog' ? '※特記事項: 今回は「Compassionate Partner (Dog)」モードが選択されています。基本指針の誠実さを保ちつつ、語尾に「ワン」をつけるなど、親しみやすく癒やしを与えるトーンで応答してください。' : ''}
`.trim();

    const systemInstruction = `${baseSystemInstruction}\n\n${dynamicContext}`;

    const contents = messages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    await streamGeminiResponse(res, () => getAIClient().models.generateContentStream({
        model: 'gemini-3-flash-preview', 
        contents,
        config: { 
            systemInstruction, 
            temperature: 0.7,
            topP: 0.95,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
            ],
            thinkingConfig: { thinkingBudget: 0 } 
        },
    }));
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], profile: UserProfile }) {
    const { chatHistory } = payload;
    const historyText = chatHistory.map(m => `${m.author}: ${m.text}`).join('\n');
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `以下の履歴からサマリーを生成してください。JSONで返してください。
履歴: ${historyText}`,
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

async function handleGenerateSuggestions(payload: { messages: ChatMessage[], currentDraft?: string }) {
    const { messages, currentDraft } = payload;
    const recentMessages = messages.slice(-4);
    
    const formattingInstruction = `
出力ルール:
1. JSON形式 { suggestions: string[] } で返してください。
2. 各suggestionはユーザーがそのまま発言できる自然な短い口語文（30文字以内）にしてください。
3. **絶対厳守: 出力される各提案の文頭に、数字、連番、箇条書き記号（例: 1, 1., 1の, -, ・, その1）を一切含めないでください。**
4. 提案は「～について」のような名詞止めではなく、ユーザーの「一人称のセリフ」として完結させてください。
5. **重要: 直前のAIの発言の口調（語尾の『ワン』や特徴的な言い回し）を絶対に模倣しないでください。あくまで『ユーザー（人間）』が使う自然な標準語や丁寧語で生成してください。**
`;

    let prompt = "";
    if (currentDraft && currentDraft.trim().length > 0) {
        prompt = `
文脈と、ユーザーが現在入力中のテキスト（ドラフト）に基づき、ユーザーが言おうとしていること、またはそれに続く言葉を3〜4つ予測してください。
${formattingInstruction}

履歴:
${recentMessages.map(m => `${m.author}: ${m.text}`).join('\n')}
現在入力中のドラフト: "${currentDraft}"
`;
    } else {
        prompt = `
文脈から、ユーザーが次に発言しそうな短いフレーズを3〜4つ予測してください。
${formattingInstruction}

履歴:
${recentMessages.map(m => `${m.author}: ${m.text}`).join('\n')}
`;
    }

    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
            responseSchema: {
                type: Type.OBJECT,
                properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ["suggestions"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}
