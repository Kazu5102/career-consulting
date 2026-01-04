
// services/mockGeminiService.ts - v2.19 - Fixed Suggestion Sentences
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, MessageAuthor, UserProfile } from '../types';
import { StreamUpdate } from './geminiService';

// ===================================================================================
//  This is a mock service for development and preview environments.
//  It simulates responses from the backend without making any real API calls.
// ===================================================================================


// --- Utility Functions ---
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
### 1. 相談者の共通の悩み・課題 (Common Challenges)
- **キャリアの不確実性:** 多くの相談者が、将来のキャリアパスについて漠然とした不安を抱えています。特に、技術職と管理職の分岐点や、未経験分野への挑戦に関する悩みが顕著です。

### 2. キャリアにおける希望・目標の傾向 (Career Aspirations)
- **成長意欲の高さ:** 現状維持よりも、新しいスキルを習得し、自身の市場価値を高めたいというポジティブな意欲が伺えます。

### 3. 総合的なインサイトと提言 (Overall Insights & Recommendations)
- **自己分析のサポート強化:** 自身の強みや適性を客観的に把握できていないケースが多いため、自己分析を促すアセスメントツールや、キャリアコーチングの機会を提供することが有効です。
- **具体的な情報提供:** 未経験転職市場の動向や、マネジメントに必要なスキルセットなど、具体的で実践的な情報を提供することで、相談者の不安を解消し、次の一歩を後押しできます。
`,
};

const sampleSkillMatchingResult: SkillMatchingResult = {
    keyTakeaways: [
        "高い学習意欲と協調性があなたの大きな強みです。",
        "Web開発分野でのポテンシャルが非常に高いです。",
        "チーム開発の基本スキルを身につけることが次のステップです。",
    ],
    analysisSummary: `
あなたは、**高い学習意欲**と**着実に物事を進める能力**を兼ね備えています。
新しい技術や知識を積極的に学ぶ姿勢は、変化の速い現代のキャリア市場において非常に大きな強みとなります。
また、対話の中から、他者と協力して目標を達成することに喜びを感じる**協調性**も伺えました。
`,
    recommendedRoles: [
        { role: 'Webデベロッパー', reason: '学習意欲と正確性を活かし、高品質なプロダクト開発に貢献できます。', matchScore: 85 },
        { role: 'プロジェクトコーディネーター', reason: 'コミュニケーション能力と計画性を活かし、チームの潤滑油として活躍できます。', matchScore: 78 },
        { role: 'テクニカルサポート', reason: '課題解決能力と丁寧な対話力で、顧客満足度向上に貢献できます。', matchScore: 72 },
    ],
    skillsToDevelop: [
        { skill: 'Git / GitHub', reason: 'チーム開発の基本ツール. バージョン管理能力は必須です。' },
        { skill: 'クラウドサービスの基礎知識 (AWS/GCP)', reason: '現代のWebサービス開発に不可欠なインフラ知識です。' },
    ],
    learningResources: [
        { title: 'Gitコース', type: 'course', provider: 'Progate' },
        { title: 'AWS認定クラウドプラクティショナー講座', type: 'course', provider: 'Udemy' },
    ],
};

// --- Mock Service Functions ---

export const checkServerStatus = async (): Promise<{status: string}> => {
    await delay(200);
    console.log("[Mock] Server status check: OK");
    return { status: 'ok' };
};


// FIX: Updated mock getStreamingChatResponse to accept UserProfile.
export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<ReadableStream<StreamUpdate> | null> => {
    console.log("[Mock] getStreamingChatResponse called with:", { messages, aiType, aiName, profile });
    await delay(1500);

    const responseText = "これはデモ用の応答です。AIがあなたの発言を分析し、最適な返信を生成している様子をシミュレートしています。実際の環境では、ここでAIからの返答がストリーミングされます。";
    const chunks = responseText.split(/(、|。)/).filter(Boolean);
    
    // Create a mock stream that sends text updates
    let isClosed = false;
    
    const stream = new ReadableStream({
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
        cancel() {
            isClosed = true;
        }
    });

    return stream;
};

// FIX: Updated mock generateSummary to accept UserProfile.
export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string, profile?: UserProfile): Promise<string> => {
    console.log("[Mock] generateSummary called", { profile });
    await delay(2000);
    const mockStructured = {
        user_summary: `
## 💡 今日の気づき
今日は**「現状への違和感を、成長への種として捉え直す」**という大切な一歩を踏み出せましたね。

## 🌟 大切にしたいあなたの価値観
対話を通じて、あなたが**「周囲との調和」**と**「専門性の追求」**の両方を、妥協せずに大切にしたいと考えていることが伝わってきました。

## 💪 見つかった「あなたらしさ」
- **誠実な対話力**: 自分の弱さを隠さず、正直に言葉にできる強さ。
- **高い学習意欲**: 未知の領域に対しても、自ら情報を集めようとする姿勢。
- **論理的な整理能力**: 複雑な状況を一つずつ分解して考える力。

## 🌱 未来への小さな一歩
まずは明日、**「今の自分が一番わくわくする瞬間」**を一つだけメモ帳に書き出してみてください。
        `,
        pro_notes: `
### キャリア分析ノート
- **発達段階**: 確立期における再探索の状態。
- **葛藤レベル**: 中程度。自己効力感の回復に向けたリフレーミングが奏功している。
- **提言**: 具体的なキャリア・アンカーの特定に向けたワークを推奨。
        `
    };
    return JSON.stringify(mockStructured);
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    console.log("[Mock] reviseSummary called");
    await delay(1500);
    return originalSummary + `\n\n### 修正依頼 (デモ)\n- ${correctionRequest}`;
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    console.log("[Mock] analyzeConversations called");
    await delay(2500);
    return {
        ...sampleAnalysisData,
        keyMetrics: {
            ...sampleAnalysisData.keyMetrics,
            totalConsultations: summaries.length
        }
    };
};

export const analyzeTrajectory = async (conversations: StoredConversation[], userId: string): Promise<TrajectoryAnalysisData> => {
    console.log("[Mock] analyzeTrajectory called for user:", userId);
    await delay(2500);
    // FIX: Added missing expert analysis fields to match TrajectoryAnalysisData interface
    return {
        keyTakeaways: [
            "相談を通じて自己理解が着実に深まっている。",
            "キャリアパスの不確実性が主要なテーマである。",
            "次のステップとして具体的な行動計画の策定が有効。"
        ],
        userId,
        totalConsultations: conversations.length,
        consultations: conversations.map(c => ({
            dateTime: new Date(c.date).toLocaleString('ja-JP'),
            estimatedDurationMinutes: 15 + Math.floor(Math.random() * 15)
        })),
        keyThemes: ['キャリアパスの悩み', 'スキルアップ', '自己分析'],
        detectedStrengths: ['学習意欲', '協調性', '課題発見能力'],
        areasForDevelopment: ['ポートフォリオ作成', '面接対策'],
        suggestedNextSteps: ['具体的な職種研究', '情報収集の継続'],
        overallSummary: `ユーザー **${userId}** のデモ用個別分析レポートです。\n- **相談の軌跡**: 複数回の相談を通じて、自己理解が深まっている様子が伺えます。\n- **今後の展望**: 具体的なアクションプランの策定が次のステップです。`,
        triageLevel: 'medium',
        ageStageGap: 35,
        reframedSkills: [
            { userWord: 'コツコツやる', professionalSkill: '継続的改善能力', insight: '地道な作業を苦にせず、品質を高め続ける姿勢が見られます。' },
            { userWord: '人の話を聞く', professionalSkill: 'アクティブリスニング', insight: '相手の意図を汲み取り、円滑なコミュニケーションを促進できます。' }
        ],
        sessionStarter: '最近の取り組みの中で、一番手応えを感じていることは何ですか？',
    };
};

export const findHiddenPotential = async (conversations: StoredConversation[], userId: string): Promise<HiddenPotentialData> => {
    console.log("[Mock] findHiddenPotential called for user:", userId);
    await delay(2000);
    return {
        hiddenSkills: [
            { skill: '潜在的なリーダーシップ', reason: 'チームでの成果を重視する発言から、将来的にリーダーシップを発揮する可能性があります。' },
            { skill: 'UXデザインへの関心', reason: 'UI改善の成功体験を嬉しそうに語っており、ユーザー視点でのプロダクト開発に関心があるかもしれません。' }
        ]
    };
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    console.log("[Mock] generateSummaryFromText called");
    await delay(2000);
    return `
### インポートされたテキストのデモサマリー
- **内容**: ${textToAnalyze.substring(0, 100)}...
- **分析**: テキスト内容をAIが分析し、構造化したサマリーを生成する機能のデモです。
    `;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    console.log("[Mock] performSkillMatching called");
    await delay(3000);
    return sampleSkillMatchingResult;
};

export const generateSuggestions = async (messages: ChatMessage[]): Promise<{ suggestions: string[] }> => {
    await delay(800);
    console.log("[Mock] Generating suggestions.");
    return { suggestions: [
        '対話を通じて見えた自分の強みを知りたい',
        '自分に合う他の職種についても深掘りしたい',
        '今後のプランについて一緒に整理してほしい'
    ]};
};
