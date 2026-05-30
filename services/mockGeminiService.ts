
// services/mockGeminiService.ts - v6.37 - 2026-05-30 - キャリアリフレクションレポートフォーマットを「1.」「2.」に改修（アプローチ案1）
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
    await delay(1200);

    const isDog = aiType === 'dog';
    const lastUserMessage = [...messages].reverse().find(m => m.author === MessageAuthor.USER);
    const userText = lastUserMessage?.text || "";
    
    // 特許準拠：打鍵リズムによる心理的コンテキストの抽出・動的反映
    let fluencyNote = "";
    if (profile?.typingFluency) {
        const { mean, stdDev } = profile.typingFluency;
        if (mean > 600) {
            fluencyNote = isDog 
                ? "キミがいろいろと考えながら、ゆっくり一生懸命、この言葉を紡いでくれたことがすごく伝わってくるわん🐾 だから、ボクもキミのそのスピードに寄り添って、ゆっくりお話を聞くワン。" 
                : "一言一言、とてもゆっくりと時間をかけて言葉を紡いでくださいましたね。それだけ心の中で、言葉になりきらない大切な想いや迷いと丁寧に向き合っていらっしゃるのだとお察しいたします。";
        } else if (stdDev > 200) {
            fluencyNote = isDog 
                ? "なんだかキミのキーボードのリズムに、いろんな感情や葛藤がギュッと詰まっている気がしたワン🐾 焦らなくて大丈夫だワン。キミの隣で同じ気持ちでいるワン！" 
                : "打鍵の間隔に大きな動きや不規則さが見受けられますね。内面で強いお気持ちや、相反する葛藤が激しく渦巻いていらっしゃるのではないでしょうか。どう思われても大丈夫ですので、そのまま吐き出してくださいね。";
        }
    }

    // カウンセラー本来の共感・反復（リフレクション）行動基準に基づく知的な回答ロジック
    let reply = "";
    if (isDog) {
        if (userText.includes('転職') || userText.includes('辞め')) {
            reply = `「転職」や「今の職場を辞めること」について悩んでいるんだねワン。今の仕事を離れて新しい道に行くのは、すごく勇気がいるし、不安になるのも当然だワン！
キミがそうやってこれからの働き方を真剣に考え始めたのは、キミがもっと素敵に輝ける場所を見つけたいっていうワクワクのサインかもしれないワン 🐾
今の職場で「ここがちょっとしんどいな…」と感じることや、新しく挑戦してみたいこと、もっとお話しできる範囲で聞かせてほしいワン！`;
        } else if (userText.includes('人間関係') || userText.includes('上司') || userText.includes('同僚')) {
            reply = `職場の人たちとの関係で悩んでいるんだねワン。上司や同僚とのやり取りって、毎日繰り返すことだからすごく心が擦り減っちゃうワン…。キミは本当によくがんばっているワン！
周りの人に気を使いすぎたり、期待に応えようとして、自分の「本当の気持ち」を後回しにしちゃっていることはないワン？🐾
もしよかったら、「こういうときが一番しんどいんだ」というエピソードを、ボクにそっと吐き出してみてほしいワン。`;
        } else if (userText.includes('将来') || userText.includes('不安')) {
            reply = `将来への漠然とした不安を抱えているんだねワン。まだ見ぬ先のことって、暗闇を歩いているみたいでどうしたらいいかわからなくなっちゃうの、すごくよくわかるワン🐾
でも、その不安があるってことは、キミが自分の人生を「もっと良くしていきたい」って、真剣に自分と向き合っている証拠なんだワン！素晴らしいことだワン！
今この瞬間、キミが一番「こうなったら心がスッキリするのにな」って思う理想の姿は、どんな小さなことでもいいから浮かんでくるワン？🐾`;
        } else if (userText.includes('強み') || userText.includes('スキル') || userText.includes('得意')) {
            reply = `自分の「強み」や「得意なこと」を見つけたいんだねワン！キミは自分のこと「まだまだワン…」って思っているかもしれないけど、ボクから見たらキラキラ輝くタカラモノがいっぱいあるワン！🐾
たとえば、今日こうして自分の気持ちを言葉にして整理しようとする行動力だって、ものすごく強力な強みなんだワン！
周りの人から「これ、助かったよ！」とか「器用だね」って言われたこと、あるいは自分がやっていて全然飽きないことって、何かないワン？小さなことでも誇っていいワン🐾`;
        } else {
            reply = `「${userText}」っていう、キミの今の大切な言葉、ボクの大きなお耳でしっかり優しく受け止めたワン🐾
そう話してくれた時のキミの気持ち、そして今日ここまで自分の心を見つめて言葉を紡いできてくれたこと、ボクは心からがんばっているねって伝えたいワン！
もう少し、その「${userText}」について、キミが感じていることや想いをボクに聞かせてくれないワン？キミのペースで大丈夫だワン！🐾`;
        }
        
        if (fluencyNote) {
            reply = `${fluencyNote}\n\n${reply}`;
        }
    } else {
        if (userText.includes('転職') || userText.includes('辞め')) {
            reply = `「転職」あるいは「退職」という、人生における重要な転機について真剣に向き合っていらっしゃるのですね。
現在の職場を去るという決断には、これまで築いてきた安定を手放すような怖さや、周囲への遠慮など、本当に多様な感情が交錯するものと思います。
あなたが次の居場所を模索し始めた背景には、どのような思いや、これまでの「違和感」があったのでしょうか。まずはそのきっかけとなる出来事など、話しやすいところから教えていただけますか。`;
        } else if (userText.includes('人間関係') || userText.includes('上司') || userText.includes('同僚')) {
            reply = `職場における周囲との関係性、特に上司や同僚の方々との間で生じるお悩みについてお話しくださいましたね。
業務そのもの以外のコミュニケーションや、期待に応えるための調整は、ご自身が思っていらっしゃる以上に心身に摩擦を与え、疲弊させてしまうものです。
あなたが職場で周囲に気を遣うあまり、抑制してしまっているご自身の「本当の本音」や「こうありたい姿」について、ぜひここで一旦荷物を降ろしてお聞かせください。`;
        } else if (userText.includes('将来') || userText.includes('不安')) {
            reply = `これからの将来、キャリアの先行きに対する漠然とした不安を日々感じていらっしゃるのですね。
先が見えない霧の中を歩むような感覚は、ご自身への不全感や焦燥感を引き起こしやすいものです。しかし、その不安は「自らのキャリアを主体的に創り上げていきたい」という強い欲求の裏返しでもあります。
完璧な計画を目指す必要はありません。まずはご自身が大切にされたい「一つの感情」を拾い上げることから始めましょう。今、視界を少しでも穏やかにするために、何について掘り下げてみたいですか。`;
        } else if (userText.includes('強み') || userText.includes('スキル') || userText.includes('得意')) {
            reply = `ご自身の「強み」や、どのようなポータブルスキルをお持ちなのかを見出したい、という内省の意欲が伝わってまいります。
普段、客観的に評価される成果ばかりに目を向けがちですが、本質的な強みとは「自分が自然と行ってしまうこと」や、この面談を通じて「自己を深く掘り下げようとするその知的で真摯な態度」そのものに宿っています。
これまでの日常や経験の中で、周囲から感謝された出来事や、あなたが苦にならずに取り組めた役割について、些細なことと思われるニュアンスでも結構ですので、共有していただけますでしょうか。`;
        } else {
            reply = `「${userText}」というお言葉を、非常に真摯かつ丁寧に言葉にしてくださいましたね。
ご自身の想いを引き出して整理することは、時に心理的エネルギーを要する行為です。あなたの語るテーマと、その底にある大切な「感情」に深く耳を傾けております。
その「${userText}」という事象や状況について、今現在ご自身の中で、どのような気持ちや感覚が最も強く想起されているか、さらに詳しく教えていただけますでしょうか。`;
        }

        if (fluencyNote) {
            reply = `${fluencyNote}\n\n${reply}`;
        }
    }

    const chunks = reply.split(/(、|。|？|\?|！|\!|…|\n)/).filter(Boolean);
    let isClosed = false;
    return new ReadableStream({
        async pull(controller) {
            if (isClosed) return;
            if (chunks.length > 0) {
                const chunk = chunks.shift();
                controller.enqueue({ text: chunk });
                await delay(30);
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

    const isDog = aiType === 'dog';
    const nickname = profile?.nickname || '相談者様';

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

    if (topics.length === 0) {
        topics.push('今後のキャリアやご自身がありたい姿について');
    }

    const user_summary = `■ Repotta（レポッタ）：本日の「心の可視化レポート」
1. 本日お話ししたこと（テーマと事実）
（※相談者が何について悩んでいたか、どんな状況を話していたかを、主観を交えず箇条書きで簡潔に整理してください）
- ${topics.join(isDog ? '、そして' : '、さらには')}についての葛藤や現在の状況。
- 自分に合った働き方やキャリアの方向性について、深く悩まれている状況。

2. 対話を通じて、あなたが気づいたこと・言葉にしたこと
（※AIが引き出した結論ではなく、相談者自身が対話の後半で「あ、そうか」「私は〜だと思っていた」など、自分の言葉で紡ぎ出した『気づき』や『本当の気持ち』をそのまま抽出して整理してください）
- 自分一人で抱え込まず、少しでも重荷を下ろして次の選択へ向かいたいという正直な想い。
- 周囲からの期待に合わせようとするあまり、自分の本音を後回しにしていたかもしれない、という気づき。`;

    const professional_summary = `【相談者プロフィール】
年齢：${profile?.age || "未設定"}、現状の葛藤：${profile?.complaint || "現状の整理"}
エネルギー注力先：${profile?.lifeRoles?.join(', ') || "日常"}
【キャリアコンサルタント向け引き継ぎ所見】
対話を通して、クライアントは表面的な「焦り」の奥に、高度な「役割期待への応えすぎ（過適応傾向）」と、本来の「自己発揮」の矛盾に苦しんでいることが明らかになりました。打鍵傾向からは深い内省と、言語化しがたい感情の吐露が示唆されます。
カウンセラーとの面談初期段階では「行動の提案」よりも、まず本人のこの頑張りそのものを無条件で受容し、安全な心理的土台を再構築することが極めて重要です。`;

    const mockStructured = {
        user_summary,
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
