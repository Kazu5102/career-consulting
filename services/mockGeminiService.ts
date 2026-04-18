
// services/mockGeminiService.ts - v4.06 - Enhanced Suggestion Mock Logic
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, MessageAuthor, UserProfile } from '../types';
import { StreamUpdate } from './geminiService';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const sampleAnalysisData: AnalysisData = {
    keyMetrics: {
        totalConsultations: 3,
        commonIndustries: ['IT', 'メーカー', 'サービス'],
    },
    commonChallenges: [
        { label: 'キャリアパスの悩み', value: 40 },
        { label: '未経験転職の不安', value: 30 },
        { label: 'ワークライフバランス', value: 20 },
        { label: 'スキル不足', value: 10 },
    ],
    careerAspirations: [
        { label: 'スキルアップ', value: 50 },
        { label: 'マネジメント職', value: 25 },
        { label: '社会貢献', value: 15 },
        { label: '独立・起業', value: 10 },
    ],
    commonStrengths: ['学習意欲', 'コミュニケーション能力', '課題解決能力', '正確性', '協調性'],
    keyTakeaways: [
        "多くの相談者がキャリアの不確実性に悩んでいる。",
        "成長意欲が高く、スキルアップに関心がある。",
        "自己分析と具体的な情報提供が有効な支援となる。",
    ],
    overallInsights: `
### 1. 相談者の共通の悩み・課題
- **キャリアの不確実性:** 多くの相談者が将来について漠然とした不安を抱えています。

### 2. 総合的な提言
- **自己分析のサポート強化:** 自身の強みを客観的に把握できていないケースが多いです。
`,
};

const sampleSkillMatchingResult: SkillMatchingResult = {
    keyTakeaways: [
        "高い学習意欲と協調性があなたの大きな強みです。",
        "Web開発分野でのポテンシャルが非常に高いです。",
    ],
    analysisSummary: `あなたは、**高い学習意欲**と**着実に物事を進める能力**を兼ね備えています。`,
    recommendedRoles: [
        { role: 'Webデベロッパー', reason: '学習意欲を活かし、高品質な開発に貢献できます。', matchScore: 85 },
    ],
    skillsToDevelop: [
        { skill: 'Git / GitHub', reason: 'チーム開発の基本ツールです。' },
    ],
    learningResources: [
        { title: 'Gitコース', type: 'course', provider: 'Progate' },
    ],
};

export const checkServerStatus = async (): Promise<{status: string}> => {
    await delay(200);
    return { status: 'ok' };
};

export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    await delay(1500);

    let responseText = "ごめんなさい、ちょっと今ボクの頭がパンクしちゃってうまく考えがまとまらないワン…。少しだけ休憩して、あとでもう一度お話を聞かせてくれないかな？";
    
    if (aiType === 'mentor' || aiType === 'analytical' || (!aiName.includes('ハチ') && !aiName.includes('ラッキー'))) {
        responseText = "申し訳ありません。現在、推論システムにアクセスが集中しており応答の生成に失敗してしまいました。少しお時間を置いてから、再度お話をお聞かせいただけますでしょうか。";
    }

    const chunks = responseText.split(/(、|。|？|\?|！|\!|…)/).filter(Boolean);
    let isClosed = false;
    return new ReadableStream({
        async pull(controller) {
            if (isClosed) return;
            if (chunks.length > 0) {
                const chunk = chunks.shift();
                controller.enqueue({ text: chunk });
                await delay(100);
            } else {
                controller.close();
                isClosed = true;
            }
        },
        cancel() { isClosed = true; }
    });
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    await delay(2000);
    const mockStructured = {
        user_summary: `## 💡 今日の気づき\n大切な一歩を踏み出せましたね。`,
        pro_notes: `### キャリア分析ノート\n- **発達段階**: 確立期における再探索。`
    };
    return JSON.stringify(mockStructured);
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    await delay(1500);
    return originalSummary + `\n\n### 修正依頼 (デモ)\n- ${correctionRequest}`;
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    await delay(2500);
    return { ...sampleAnalysisData };
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    await delay(2500);
    return {
        keyTakeaways: ["自己理解が深まっている。", "具体的な行動計画が有効。"],
        userId,
        totalConsultations: conversations.length,
        consultations: conversations.map(c => ({ dateTime: new Date(c.date).toLocaleString('ja-JP'), estimatedDurationMinutes: 20 })),
        keyThemes: ['キャリアパスの悩み'],
        detectedStrengths: ['学習意欲'],
        areasForDevelopment: ['ポートフォリオ作成'],
        suggestedNextSteps: ['職種研究'],
        overallSummary: `デモ用個別分析レポートです。`,
        triageLevel: 'medium',
        ageStageGap: 35,
        theoryBasis: "レヴィンソンの『人生の四季』理論に基づくと、30代中盤の『30代の転機』において、20代の未解決な探索課題が再演されている状態と推測されます。",
        expertAdvice: "焦燥感が強いため、拙速な目標設定を促すと防衛機制が働く恐れがあります。まずは『理想の自己像』と『現在の自己』のズレを中立的に受け止めるラポール形成を最優先してください。",
        reframedSkills: [{ userWord: 'コツコツやる', professionalSkill: '継続的改善能力', insight: '地道な作業を苦にせず、品質を高め続ける姿勢があります。' }],
        sessionStarter: '最近の取り組みの中で、一番手応えを感じていることは何ですか？',
    };
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    await delay(2000);
    return { hiddenSkills: [{ skill: '潜在的リーダーシップ', reason: 'チームでの成果を重視する発言があります。' }] };
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    await delay(2000);
    return `### インポートテキストのデモサマリー\n- **内容**: ${textToAnalyze.substring(0, 50)}...`;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    await delay(3000);
    return sampleSkillMatchingResult;
};

export const generateSuggestions = async (messages: ChatMessage[], currentDraft?: string): Promise<{ suggestions: string[] }> => {
    await delay(600); // 思考時間をシミュレート

    // 1. ドラフトがある場合（入力中）: 入力内容に基づいた補完や展開を提案
    if (currentDraft && currentDraft.trim().length > 0) {
        const text = currentDraft.toLowerCase();
        let dynamicSuggestions: string[] = [];

        // 簡易キーワードマッチング
        if (text.includes('転職') || text.includes('辞め')) {
            dynamicSuggestions = ['転職のタイミングについて', '未経験の職種への挑戦', '今の職場に残るメリット', '退職を伝えるのが怖い'];
        } else if (text.includes('人間関係') || text.includes('上司') || text.includes('同僚')) {
            dynamicSuggestions = ['上司との距離感について', '伝え方を工夫したい', '環境を変えるべきか', 'ストレス発散の方法'];
        } else if (text.includes('将来') || text.includes('不安') || text.includes('未来')) {
            dynamicSuggestions = ['5年後のイメージがない', 'このままでいいのか不安', 'キャリアプランの作り方', 'まずは短期的な目標から'];
        } else if (text.includes('強み') || text.includes('スキル') || text.includes('得意')) {
            dynamicSuggestions = ['自分の強みが見つからない', 'ポータブルスキルの棚卸し', '客観的な評価が知りたい', '資格取得は必要？'];
        } else if (text.includes('疲れ') || text.includes('辛い') || text.includes('しんどい')) {
            dynamicSuggestions = ['少し休みたい気持ちがある', '誰かに聞いてほしかった', 'リフレッシュの方法', '仕事量の調整について'];
        } else if (text.includes('余計') || text.includes('無駄')) {
            dynamicSuggestions = ['余計な仕事が多すぎる', '無駄な会議を減らしたい', '効率的に働きたい', '断り方を知りたい'];
        } else if (text.includes('給料') || text.includes('年収') || text.includes('金')) {
            dynamicSuggestions = ['給料への不満がある', '評価制度に納得できない', '年収アップの方法', '副業について'];
        } else {
            // マッチしない場合は入力を補完するようなフレーズ
            dynamicSuggestions = [
                `${currentDraft}ということについて`,
                `${currentDraft}と感じる理由`,
                `具体的には...`,
                `話せてすっきりした`
            ];
        }
        return { suggestions: dynamicSuggestions };
    }

    // 2. ドラフトがない場合（待機中）: 直前のAIメッセージ（文脈）に基づいて提案
    const lastMessage = messages[messages.length - 1];
    
    // AIからの問いかけに対するリアクションを予測
    if (lastMessage && lastMessage.author === MessageAuthor.AI) {
        const aiText = lastMessage.text;

        // 疑問形で終わっている場合
        if (aiText.includes('？') || aiText.includes('?')) {
            if (aiText.includes('状況') || aiText.includes('教えて')) {
                return { suggestions: ['現状を詳しく話す', '特に変わりはない', '少し整理したい'] };
            }
            if (aiText.includes('どう') || aiText.includes('いかが')) {
                return { suggestions: ['そう思う', '違う気がする', 'わからない', '考え中...'] };
            }
            return { suggestions: ['はい', 'いいえ', 'どちらとも言えない', '詳しく話したい'] };
        }

        // 共感・肯定系の場合
        if (aiText.includes('ですね') || aiText.includes('ますよ') || aiText.includes('ワン！')) {
            return { suggestions: ['聞いてくれてありがとう', '実はもっと話したいことが...', '次のステップに進みたい', '安心した'] };
        }

        // 提案系の場合
        if (aiText.includes('整理') || aiText.includes('まとめ')) {
            return { suggestions: ['お願いします', 'もう少し話してから', '今日はここで終わりたい'] };
        }
    }

    // 3. デフォルト（会話開始時や汎用）
    return { 
        suggestions: [
            '今の仕事の悩みを聞いて', 
            '将来のキャリアが不安', 
            '自分の強みを知りたい', 
            '雑談したい'
        ] 
    };
};
