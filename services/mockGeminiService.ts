
// services/mockGeminiService.ts - v4.07 - Enhanced Dynamic Personalized Reflection Engine
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
    
    if (aiType === 'human') {
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

    // 1. ダイナミックなキーワード抽出に基づいた体験パーソナライズ
    const allUserTexts = chatHistory
        .filter(m => m.author === MessageAuthor.USER)
        .map(m => m.text)
        .join('、');

    const topics: string[] = [];
    if (allUserTexts.includes('仕事') || allUserTexts.includes('業務')) topics.push('現在のご自身の「お仕事」やその内容');
    if (allUserTexts.includes('転職') || allUserTexts.includes('辞め')) topics.push('これからの働き方や「転職」への岐路');
    if (allUserTexts.includes('人間関係') || allUserTexts.includes('上司') || allUserTexts.includes('同僚')) topics.push('周囲の人々との「人間関係」やその中で生じる悩み');
    if (allUserTexts.includes('将来') || allUserTexts.includes('不安')) topics.push('まだ見ぬ「将来」へのかすかな不安と、それに真摯に向き合うお気持ち');
    if (allUserTexts.includes('強み') || allUserTexts.includes('スキル')) topics.push('ご自身がこれまで培ってきた「強み」や誇るべきスキル');
    if (allUserTexts.includes('時間') || allUserTexts.includes('疲れ')) topics.push('日常的な「時間管理や心身の疲れ」に耳を傾けるべきタイミング');

    // トピックがない場合の初期フォーカス
    if (topics.length === 0) {
        topics.push('ご自身の心の奥底にある、まだ言葉にならない本来の想いや願い');
    }

    // AIキャラクター毎のお祝い・労いトーン調整
    const isDog = aiType === 'dog';
    const nickname = profile?.age ? `お姿を見せてくれた「${profile.age}」の相談者さま` : "一歩を踏み出そうとする相談者さま";
    const greetingTone = isDog 
        ? `ボクは、キミが本当によくがんばっているのをすぐそばでずーっと見ていたワン！誰よりも自分らしく進もうとするキミの姿に、ボクは心から感動したんだワン。`
        : `私はこの対話を通じて、あなたがご自身の現状に真摯に向き合い、解決への道を模索される素晴らしい熱意に何度も心動かされました。`;

    // 心理的入力ふらつき（タイピング傾向）の検出
    let typingInsight = "";
    if (profile?.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 600) {
            typingInsight = isDog
                ? "文字を打つとき、一つひとつゆっくりと言葉を探してくれたワン。その『丁寧さ』と『自分をごまかさない誠実さ』こそが、キミを支えるかけがえのない宝物だワン！"
                : "タイピングの合間に見られた慎重な「迷い」は、あなたがご自分の心に極めて誠実に向き合い、適当な言葉でごまかさなかった証拠です。その深慮深さが最大の強みです。";
        } else if (stdDev > 200) {
            typingInsight = isDog
                ? "うれしかったり、ドキドキしたり、感情がいっぱいあふれながらお話ししてくれたように感じたワン。その豊かな感性とエネルギーは、周りの人を元気にする特別な力だワン！"
                : "打鍵の揺れ（大きな変動）からは、葛藤を抱えつつも、ごまかさずに言葉を紡ぎ出そうとした熱いお気持ちが伝わりました。生き生きとしたその感情こそが、あなたの前進力です。";
        } else {
            typingInsight = isDog
                ? "頭をきれいに整理しながら、とってもスムーズにお話してくれたワン！その知性と、想いをしっかり伝えきれる表現力は素晴らしい武器だワン！"
                : "迷いなく論理的に書き進めるスマートなタイピングが印象的でした。それはこれまでのご経験が裏打ちする「軸」があるからこそできることです。自信を持ってください。";
        }
    } else {
        typingInsight = isDog
            ? "今日、ありのままの気持ちをボクにお話してくれたこと、それ自体がキミの最高に素晴らしい第一歩なんだワン！"
            : "今日この場で、誰にも言えなかった本音を言葉としてアウトプットしてくださったその行動力と勇気こそが、確かな一歩です。";
    }

    const title = `${aiName}と紡いだ ${profile?.age || '現在'}の心のロードマップ`;
    const core_insight = `### 🌟 今回の対話が照らす、あなたの本当の価値
${nickname}へ。
今日、私たち${aiName}は、${topics.join(isDog ? '、そして' : '、さらには')}について、丁寧に言葉の糸をほぐしていきました。

${greetingTone}

${typingInsight}

これまで一人で抱えてきた重荷を少しでも下ろし、自分自身の新しい一面を「確かにここにある軌跡」として受け取る準備が、今、整いました。`;

    const analysis_points = [
        {
            category: "🌱 あなたが本当に大切にしている価値観（コア）",
            observation: isDog 
                ? `対話のなかで、キミが「自分を大切にし、やりがいを感じる時間を守りたい」と願っていることが熱く伝わってきたワン。何より周囲の人や、自分が関わっている状況を慈しもうとする、心の深さがあるワン！`
                : `あなたが語られた言葉の深層には、ただ業務をこなすだけでなく「自らの意思で人生を選び取り、価値を生み出す充足感を得たい」という極めて自立した美学があります。`
        },
        {
            category: "🤝 発見されたあなたの卓越した強み",
            observation: isDog
                ? `キミは『どんな困難な状況であっても、自分の言葉で想いを整理し、解決策を前に進める』抜群の力を持っているワン。笑顔の裏にある、不屈の「自走力」が最大の魅力なんだワン！`
                : `『現状への違和感を自己研鑽への動機に変え、主体的に課題を探求する』といった自己変革の姿勢が対話の端々から見て取れました。これはあらゆる環境で通用する強力なポータブルスキルです。`
        },
        {
            category: "🛡️ 進むべき一歩を遮るブレーキと解決策",
            observation: isDog
                ? `「失敗しちゃいけないワン…」「期待に応えなきゃ…」という優しい気持ちが、キミの自由な翼を少し小さくしているかもしれないワン。でも大丈夫、その不安はキミが前に進みたい証拠なんだワン！`
                : `周囲からの期待に応えようとしすぎる責任感が、「十分に準備が揃うまで動いてはいけない」というセルフ・ブレーキになっている模様です。完璧を求めず、まずは小さな『スモールステップ』から試すことが解決の糸口です。`
        }
    ];

    const next_inquiry = isDog
        ? `もし、キミが「絶対に失敗しない魔法」をひとつだけ使えるとしたら、明日、どんな小さなワクワクすることを始めてみたいワン？`
        : `これまでの常識や『こうあるべき』という枠をすべて取り払ったとき、あなたが一番『呼吸が軽くなる』瞬間は、一体どのような姿でしょうか？`;

    const professional_summary = `【相談者プロフィール】
年齢：${profile?.age || "未設定"}、現状の葛藤：${profile?.complaint || "現状の整理"}
エネルギー注力先：${profile?.lifeRoles?.join(', ') || "日常"}
【キャリアコンサルタント向け引き継ぎ所見】
対話を通して、クライアントは表面的な「焦り」の奥に、高度な「役割期待への応えすぎ（過適応傾向）」と、本来の「自己発揮」の矛盾に苦しんでいることが明らかになりました。打鍵傾向からは深い内省と、言語化しがたい感情の吐露が示唆されます。
カウンセラーとの面談初期段階では「行動の提案」よりも、まず本人のこの頑張りそのものを無条件で受容し、安全な心理的土台を再構築することが極めて重要です。`;

    const mockStructured = {
        title,
        core_insight,
        analysis_points,
        next_inquiry,
        professional_summary
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

export const generateSuggestions = async (messages: ChatMessage[], currentDraft?: string): Promise<{ suggestions: string[], readinessScore: number }> => {
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
        return { suggestions: dynamicSuggestions, readinessScore: 0.5 };
    }

    // 2. ドラフトがない場合（待機中）: 直前のAIメッセージ（文脈）に基づいて提案
    const lastMessage = messages[messages.length - 1];
    
    // AIからの問いかけに対するリアクションを予測
    if (lastMessage && lastMessage.author === MessageAuthor.AI) {
        const aiText = lastMessage.text;

        // 疑問形で終わっている場合
        if (aiText.includes('？') || aiText.includes('?')) {
            if (aiText.includes('状況') || aiText.includes('教えて')) {
                return { suggestions: ['現状を詳しく話す', '特に変わりはない', '少し整理したい'], readinessScore: 0.5 };
            }
            if (aiText.includes('どう') || aiText.includes('いかが')) {
                return { suggestions: ['そう思う', '違う気がする', 'わからない', '考え中...'], readinessScore: 0.5 };
            }
            return { suggestions: ['はい', 'いいえ', 'どちらとも言えない', '詳しく話したい'], readinessScore: 0.5 };
        }

        // 共感・肯定系の場合
        if (aiText.includes('ですね') || aiText.includes('ますよ') || aiText.includes('ワン！')) {
            return { suggestions: ['聞いてくれてありがとう', '実はもっと話したいことが...', '次のステップに進みたい', '安心した'], readinessScore: 0.5 };
        }

        // 提案系の場合
        if (aiText.includes('整理') || aiText.includes('まとめ')) {
            return { suggestions: ['お願いします', 'もう少し話してから', '今日はここで終わりたい'], readinessScore: 0.5 };
        }
    }

    // 3. デフォルト（会話開始時や汎用）
    return { 
        suggestions: [
            '今の仕事の悩みを聞いて', 
            '将来のキャリアが不安', 
            '自分の強みを知りたい', 
            '雑談したい'
        ],
        readinessScore: 0.5
    };
};
