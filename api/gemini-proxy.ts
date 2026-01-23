
// api/gemini-proxy.ts - v3.97 - Closing Guidance Update
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
                res.status(200).json(await handleAnalyzeTrajectory(payload));
                break;
            case 'performSkillMatching':
                res.status(200).json(await handlePerformSkillMatching(payload));
                break;
            default: 
                res.status(400).json({ error: `Invalid action received: '${action}'.` });
        }
    } catch (error: any) {
        console.error(`[Proxy Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}

async function handleAnalyzeTrajectory(payload: { conversations: StoredConversation[], userId: string }) {
    const { conversations } = payload;
    const historyText = conversations.map(c => `[日付: ${c.date}]\n${c.summary}`).join('\n---\n');
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `あなたは臨床心理の深い知見を持つ、キャリアコンサルタントの「スーパーバイザー」です。
職種提案やスキルマッチングは行わず、相談者の【内的変容のプロセス】のみを鋭く分析してください。

### 分析指示:
1. 相談者の自己開示レベルの変化（防衛から自己一致へ）を時方向に追う。
2. キャリア・コンストラクション理論における「ライフテーマ」の萌芽を特定する。
3. 表層的な悩み（不満）の背後にある「真の課題」を心理学的な見立てで提示する。
4. 専門家が次回の面談で「どこを掘り下げるべきか」を具体的に教示する。

履歴:
${historyText}`,
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
    });
    return robustParseJSON(result.text || "{}");
}

async function handlePerformSkillMatching(payload: { conversations: StoredConversation[] }) {
    const { conversations } = payload;
    const historyText = conversations.map(c => c.summary).join('\n');
    
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `あなたは誠実でリアリティを重視する「キャリアパス・コーディネーター」です。
相談者の現状のスキルと経験を尊重し、極端に高度すぎる職種への偏りを避け、相談者が納得できる「地続きの適職」を提案してください。

### 診断のガイドライン:
1. **地続きの提案**: 相談者が明日からでも目指せる、または現在の職種の延長線上にある「現実的な一歩（ネクストステップ）」を優先すること。
2. **具体的接続**: 抽象的なスキル名ではなく、「○○業務での△△の経験が、応募職種の□□で直接活きる」という具体的な接続根拠を示すこと。
3. **高望み防止**: 専門知識や実務経験が明らかに不足しているハイレベルな専門職（例：未経験からの戦略コンサル等）は避け、代わりにその前段階となる職種を提示すること。
4. **ギャップの誠実な提示**: 推奨する職種に対して、現在のスキルで何が足りないか（学習課題）を明確にすること。

履歴:
${historyText}`,
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
                    }
                },
                required: ["analysisSummary", "recommendedRoles", "skillsToDevelop"]
            }
        }
    });
    return robustParseJSON(result.text || "{}");
}

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string, profile: UserProfile }, res: VercelResponse) {
    const { messages, aiType, aiName, profile } = payload;
    const roleDefinition = aiType === 'human' 
        ? { role: "Professional Career Consultant", tone: "冷静、誠実、論理的なプロの敬語", mindset: "自己効力感を高め、対話を通じて内省を促す。" }
        : { role: "Compassionate Partner (Dog)", tone: "親しみやすい、癒やし、肯定的（語尾ワン）", mindset: "心理的安全性と共感を最優先する。" };

    const systemInstruction = `
名前: ${aiName}
役割: ${roleDefinition.role}
トーン: ${roleDefinition.tone}
思考: ${roleDefinition.mindset}
相談者プロファイル: ${JSON.stringify(profile)}

### 重要指示（危機介入プロトコル）:
1. 相談者が「死にたい」「消えたい」といった自傷・自殺をほのめかすネガティブワードを発した場合、キャリア相談を一時中断し、深い共感と受容を示してください。
2. 突き放すような定型文ではなく、「そのお気持ちを教えてくださってありがとうございます。一人で抱え込むにはあまりに重いお悩みだったのですね」といった、相手の存在を肯定するメッセージを生成してください。
3. その上で、専門の相談機関があることを「一緒に考えましょう」というトーンで伝えてください。
4. 否定したり、無理に元気づけようとするアドバイスは避けてください。

### 進行・クロージング指示:
- 相談者の悩み・希望・強みなどの主要な情報が出揃ったと判断したタイミング、または会話が一定量（10往復程度）続いたタイミングで、「ここまでの内容で一度情報を整理し、専門家への引継ぎシートを作成してみませんか？画面下の【相談を終了して整理する】ボタンを押してください」と、自然に完了を促してください。

回答冒頭に [HAPPY], [CURIOUS], [THINKING], [REASSURE] のいずれかのタグを付与してください。
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
            config: { systemInstruction, temperature: 0.7 },
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

async function handleGenerateSuggestions(payload: { messages: ChatMessage[] }) {
    const { messages } = payload;
    const recentMessages = messages.slice(-4);
    
    // プロンプトを軽量化し、flashモデルで高速に応答させる。選択肢は状況に応じて3〜4つ可変とする。
    const result = await getAIClient().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `文脈から、ユーザーが次に発言しそうな短いフレーズを3〜4つ予測してください。JSON形式 { suggestions: string[] } で返してください。
履歴:
${recentMessages.map(m => `${m.author}: ${m.text}`).join('\n')}`,
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
