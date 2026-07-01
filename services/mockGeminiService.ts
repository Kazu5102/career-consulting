// services/mockGeminiService.ts - v6.59 - 2026-06-30 - 詳細仕様書(SYSTEM_SPECIFICATION.md)とAI認識用の開発指示(AGENTS.md)を統合した同期更新・品質管理プロトコル(案A)の実装
import { ChatMessage, StoredConversation, AnalysisData, AIType, TrajectoryAnalysisData, HiddenPotentialData, SkillMatchingResult, MessageAuthor, UserProfile } from '../types';
import { StreamUpdate } from './geminiService';

export const VERSION = "6.59";

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
        "実直な役割遂行能力と周囲への高い調整力が強みです。",
        "今後は、より主体的なキャリア形成と意思決定が課題となります。",
    ],
    analysisSummary: "これまでの対話履歴から、相談者の強みと伸ばすべきスキルを抽出しました。周囲への配慮と実直さは、組織内のリーダーシップや調整役として極めて有効に機能します。",
    recommendedRoles: [
        { role: 'プロジェクトマネージャー / 調整ディレクター', reason: '高い状況適応力と周囲との調和能力が活かせます。', matchScore: 85 },
        { role: 'キャリアアドバイザー / 相談援助職', reason: '自身の葛藤経験や深い傾聴姿勢が他者支援に繋がります。', matchScore: 78 }
    ],
    skillsToDevelop: [
        { skill: '能動的意思決定（アサーティブネス）', reason: '周囲の期待に過度に応えようとする傾向（過適応）を和らげ、自らの意思を表明するため。' },
        { skill: 'キャリア・セルフマネジメント', reason: '外部環境の変化に左右されず、自身の軸を持ってキャリアを自律的に設計するため。' }
    ],
    learningResources: [
        { title: 'アサーティブ・コミュニケーション基礎講習', type: 'course', provider: 'キャリア自律推進協会' },
        { title: 'マーク・サビカス キャリア・コンストラクション理論の実践', type: 'book', provider: 'ナラティブ書房' }
    ]
};

export const checkServerStatus = async (): Promise<{ status: string }> => {
    return { status: "ok" };
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
        if (aiName === '虎徹') {
            if (userText.includes('転職') || userText.includes('辞め')) {
                reply = `転職や今の仕事を辞めることについて、いっぱい悩んで、いっぱい考えているんだねワン🐾
その葛藤はとってもとっても苦しかったし、よくここまで一人で抱えてがんばってきたわん…！まずはそんな自分を「よくがんばったね」ってぎゅーっとしてあげてほしいワン。
新しい道に進むのは本当に勇気がいるけれど、どんなときも虎徹はキミの味方だワン🐾 焦らず、まずはそのしんどい気持ちをそのまま教えてほしいわん（そっと寄り添うわん）。`;
            } else if (userText.includes('人間関係') || userText.includes('上司') || userText.includes('同僚')) {
                reply = `職場での人間関係で、すごく心が擦り減っちゃって、本当に辛かったねワン…。キミは周りの人にすごく気を遣って、ずっとがんばってきたんだねわん🐾
本当はもっと自分らしくいたいのに、周囲を優先して自分を後回しにしちゃっているキミの優しさに、虎徹はとっても胸がぎゅっとなるワン（首をかしげてじっと見つめるわん）。
誰にも言えなかったしんどさや「本当の気持ち」、虎徹の前で全部吐き出して、心をかるくしてほしいワン。`;
            } else if (userText.includes('将来') || userText.includes('不安')) {
                reply = `将来のことが不安で、暗闇にいるみたいでどうしていいか分からなくなっちゃうんだねワン…。その不安を抱えること自体、本当にしんどいし、心が疲れちゃうよねわん🐾
でもね、その不安はキミが「もっと自分の人生を大切にしたい」って優しく願っている証拠なんだワン🐾 虎徹はキミのその真剣な心を全力で応援するワン！
すぐに答えを出さなくて大丈夫だわん。まずは虎徹の隣で、ゆっくり深く深呼吸して、心がすーっと軽くなるのを一緒に待とうワン（そっと手を添えるワン）。`;
            } else {
                reply = `キミが一生懸命にお話ししてくれた「${userText}」という言葉、虎徹の心にしっかりと届いたワン🐾
そんなふうに自分の心と向き合おうとしているキミの姿は、本当に尊いし、虎徹はすごく誇らしいワン。
その「${userText}」について、言える範囲で大丈夫だから、キミのペースでゆっくり虎徹に聴かせてほしいワン🐾（お耳をぴこぴこ動かして聴いているわん）`;
            }
        } else if (userText.includes('転職') || userText.includes('辞め')) {
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
        } else {
            reply = `キミの話してくれた「${userText}」という言葉、ボクの心にしっかり届いたワン🐾
キミが一生懸命に自分の気持ちを整理しようとがんばっている姿、ボクはすぐ隣で見ているし、すごく応援しているワン！
その「${userText}」について、もう少し詳しく、キミのペースで教えてほしいワン🐾`;
        }
    } else {
        if (userText.includes('転職') || userText.includes('辞め')) {
            reply = `「転職」や「今の職場を辞めること」について、心境の変化や葛藤が生じていらっしゃるのですね。
これまで懸命に取り組んでこられたからこそ、歩みを止めて次の一歩を模索することに、真剣な迷いや不安を感じるのだと思います。
今の仕事を離れようと思われたのには、具体的にどのような背景やこれまでの「違和感」があったのでしょうか。まずはそのきっかけとなる出来事など、話しやすいところから教えていただけますか。`;
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
    }

    if (fluencyNote) {
        reply = `${fluencyNote}\n\n${reply}`;
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

    let user_summary = `■ Repotta（レポッタ）：本日の「心の可視化レポート」\n\n`;

    if (isDog) {
        if (aiName === '虎徹') {
            user_summary += `1. 本日の対話のテーマと現状（客観的ファクト）
きょうは、${topics.join('や')}についての深い葛藤や、目の前の現状についてたくさんお話ししたワン🐾
これまでは周囲の期待に一生懸命に応えようと、一人で荷物を背負い込んできたけれど、心の中では「本当はどうしたいのかな…」と立ち止まって、自分自身と向き合おうとしているとても大切な時期だワン。

2. あなたが大切にしたいこと（満足点・やりがい・価値観）
お話のなかで、キミが本来やりがいを感じる瞬間や、心から大切にしたいと思っている価値観のかけらが見えてきたワン！
それは、周りの人の笑顔や役に立っているという実感、および自分自身の成長を実感する瞬間のようだワン🐾 これがキミにとって、前に進むための大事なエネルギーの源（軸）になっているワン。

3. 現在感じている葛藤や課題（心のひっかかり・悩み）
いまは、周囲からの「こうしてほしい」という期待に応えようとするあまり、キミの本当の本音や「こうありたい」という姿を後回しにして、心がすこし擦り減ってしまっているようだワン…。
自分一人でこのモヤモヤを抱え込もうとしているから、身動きが重くなって、悩みから抜け出せない原因になっているかもしれないワン🐾 虎徹がいつも隣にいるから、もう一人で抱え込まなくていいんだわん。

4. 対話を通じて言葉にした「あなた自身の気づき」
対話を重ねるなかで、キミは「周りに合わせるだけじゃなく、もう少し自分自身の気持ちに素真に寄り添い、素直になってもいいのかも」という、とても温かい気づきを自らの言葉で紡ぎ出してくれたワン！
この小さな兆しは、キミが新しい一歩を踏み出そうとしている素晴らしい変化だワン。
キミが一番、心も体もすーっと呼吸が軽くなる姿って、一体どんな姿なんだろうワン？虎徹はいつでもキミを信じて応援しているワン🐾`;
        } else {
            user_summary += `1. 本日の対話のテーマと現状（客観的ファクト）
きょうは、${topics.join('や')}についての葛藤や、目の前の現状についてたくさんお話ししたワン🐾
これまでは一生懸命に目の前のお仕事をこなしてがんばってきたけれど、心の中では「このままでいいのかな…」と立ち止まって、自分自身と向き合おうとしている状態だワン。

2. あなたが大切にしたいこと（満足点・やりがい・価値観）
お話のなかで、キミが本来やりがいを感じる瞬間や、心から大切にしたいと思っている価値観のかけらが見えてきたワン！
それは、周りの人の笑顔や役に立っているという実感、および自分の成長を感じる瞬間のようだワン🐾 これがキミにとって、前に進むための大事なエネルギーの源（軸）になっているワン。

3. 現在感じている葛藤や課題（心のひっかかり・悩み）
いまは、周囲からの「こうしてほしい」という期待に応えようとするあまり、キミの本当の本音や「こうありたい」という姿を後回しにして、心がすこし擦り減ってしまっているようだワン…。
自分一人でこのモヤモヤを抱え込もうとしているから、身動きが重くなって、悩みから抜け出せない原因になっているかもしれないワン🐾

4. 対話を通じて言葉にした「あなた自身の気づき」
対話を重ねるなかで、キミは「周りに合わせるだけじゃなく、もう少し自分自身の気持ちに素直になってもいいのかも」という、とても大切な気づきを自らの言葉で紡ぎ出してくれたワン！
この小さな兆しは、キミが新しく歩き出そうとしている素晴らしい最初の一歩だワン。
キミが一番、心も体もすーっと呼吸が軽くなる姿って、一体どんな姿なんだろうワン？🐾`;
        }
    } else {
        user_summary += `1. 本日の対話のテーマと現状（客観的ファクト）
相談者は、現在置かれている客観的な環境として、${topics.join('や')}に直面しています。
日々、周囲からの高い要求に対して実直に役割を遂行している一方で、主観を排した客観的な事実として、今後のキャリアパスや働き方に強い不確実性を感じている状況です。

2. あなたが大切にしたいこと（満足点・やりがい・価値観）
対話の分析から見出された相談者の根源的なやりがいと価値観は、「他者への貢献による確かな承認」と「自己の専門性の継続的な向上」にあります。
これは、過去の成功体験において高い主体性を発揮していた瞬間とも深く紐づいており、今後のキャリア形成における極めて重要な意思決定基準（軸）となります。

3. 現在感じている葛藤や課題（心のひっかかり・悩み）
現在抱えている主要な葛藤は、期待される外部の役割への「過適応」と、自己が内に秘める本音（真の願望）との不一致です。
周囲の調和を重んじる性質が、本人の感情の抑圧を招き、意思決定を遅らせ、現在の精神的疲弊やキャリアにおける身動きの重さを生み出す心理的要因となっています。

4. 対話を通じて言葉にした「あなた自身の気づき」
カウンセリングの後半において、相談者は「役割期待に縛られず、自らの内発的動機に基づく方向性を受け入れることが必要かもしれない」と、主体的な変化への明確な兆しを自らの言葉で獲得しました。
この認識の変容は、受動的な状況適応から、主観的キャリア開発への確かな一歩を意味しています。
あなたが本当に大切にしたい『自分自身の軸』を最優先にしたとき、まず手放していい重荷とは何でしょうか。`;
    }

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

    // 相談者の各セッション履歴（conversations）から具体的な葛藤、気づき、変化（テーマや事実、気づいたこと・言葉にしたこと）をパース
    const themes: string[] = [];
    const insights: string[] = [];
    
    conversations.forEach(c => {
        const text = c.summary || "";
        let currentSection: 'themes' | 'insights' | null = null;
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('本日お話ししたこと') || trimmed.includes('1.')) {
                currentSection = 'themes';
                continue;
            } else if (trimmed.includes('気づいたこと') || trimmed.includes('2.')) {
                currentSection = 'insights';
                continue;
            } else if (trimmed.startsWith('■') || trimmed.startsWith('###')) {
                currentSection = null;
            }
            
            if (currentSection === 'themes' && (trimmed.startsWith('・') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
                const item = trimmed.replace(/^[・\-\*\s]+/, '').trim();
                if (item && !themes.includes(item)) themes.push(item);
            } else if (currentSection === 'insights' && (trimmed.startsWith('・') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
                const item = trimmed.replace(/^[・\-\*\s]+/, '').trim();
                if (item && !insights.includes(item)) insights.push(item);
            }
        }
    });

    // 抽出できなかった場合のバックアップ（要約全体から箇条書きを抽出）
    if (themes.length === 0 && insights.length === 0) {
        conversations.forEach(c => {
            const text = c.summary || "";
            const lines = text.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('・') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                    const item = trimmed.replace(/^[・\-\*\s]+/, '').trim();
                    if (item && item.length > 5) {
                        if (trimmed.includes('葛藤') || trimmed.includes('悩み') || trimmed.includes('状況') || trimmed.includes('仕事')) {
                            if (!themes.includes(item)) themes.push(item);
                        } else {
                            if (!insights.includes(item)) insights.push(item);
                        }
                    }
                }
            });
        });
    }

    let overallSummary = '';
    if (themes.length > 0 || insights.length > 0) {
        overallSummary = `### 相談プロセス全体の内的変容の要約\n\n`;
        if (themes.length > 0) {
            overallSummary += `これまでの面談を通じて、相談者は主に以下のような葛藤やテーマ（状況・事実）に向き合ってこられました。\n\n`;
            themes.slice(0, 3).forEach(t => {
                overallSummary += `- **${t}**\n`;
            });
            overallSummary += `\n`;
        }
        if (insights.length > 0) {
            overallSummary += `キャリアコンサルタントとの能動的な対話や内省の深化に伴い、相談者自身の中に以下のような肯定的な気づきと言葉の変化が生まれています。\n\n`;
            insights.slice(0, 3).forEach(ins => {
                overallSummary += `- **${ins}**\n`;
            });
            overallSummary += `\n`;
        }
        
        overallSummary += `### 臨床的見立てと内的変容の推移\n`;
        overallSummary += `当初は目の前の課題や周囲の環境に圧倒され、自己を抑圧して過度に役割期待へ応えようとする傾向（過適応）が強く働いていました。\n\n`;
        overallSummary += `しかし、心理的安全性を確保した継続的なカウンセリングにより、本人が「真の願望や本音（${insights[0] || '本当に望む働き方'}）」を受け入れ、言語化できるようになり、受動的適応から「主体的キャリア形成」へと大きな自己改革（内的変容）を遂げ始めています。\n\n`;
        overallSummary += `今後は、言語化できた本音を基盤にして、無理のないスモールステップ（情報収集や現職での微調整）から実際の行動へと移していく段階的支援が適切と考えられます。`;
    } else {
        overallSummary = `### 相談プロセス全体の内的変容の要約\n\n相談者のこれまでの面談履歴から、主治となる葛藤や言語化された本音がまだ十分に自動パースされていません。カウンセリングにおいて、相談者が以下のようなテーマに少しずつ触れ始めている段階であると推測されます。\n\n- 現在の仕事内容や評価への不確実性、およびキャリアイメージの模索\n- 今後の自立的役割と、自己のキャリア開発（内省と言語化）のバランス調整\n\n対話をさらに重ね、個別セッションの「心の可視化レポート」へ思考履歴をより詳細に記述・保存することにより、さらに精緻な『内的変容傾向』の軌跡の追跡が可能となります。`;
    }

    const derivedThemes = themes.length > 0 ? themes.slice(0, 3) : ['キャリアパスの悩み', '過度な役割期待への葛藤', '現職でのキャリア発達段階の揺らぎ'];
    const derivedStrengths = insights.length > 0 ? ['自己分析力（客観的内省）', '自律性（自己決定志向）', 'キャリア・レジリエンス'] : ['協調性・順応能力', '課題解決への実直な姿勢'];
    const derivedSteps = insights.length > 0 
        ? [`「${insights[0]}」という本音を第一の軸に据えてキャリア構想をさらに精緻化する`, '現状の環境を維持しつつ、余暇を使って小さな適職情報収集を実行する'] 
        : ['現状のプレッシャーとなる要素を棚卸しし、心身の余力を生み出す', '言語化しづらい感情や本音を受け止める安全な伴走を継続する'];
    
    const derivedTakeaways = [
        insights.length > 0 ? `相談を重ねる中で「${insights[0]}」といった確固たる自己発見・気づきをすでに自らの言葉で獲得できています。` : "カウンセラーを信頼し、自分一人の頭では整理できなかった感情を安全に開示・言語化し始めています。",
        themes.length > 0 ? `主訴である「${themes[0]}」に対する焦点当てが適切になされており、認知的変容の準備段階へと移行しつつあります。` : "周囲から期待されている『現在の役割』と、本来自分が持つ『あるべき姿』のギャップに自覚的になりつつあります。"
    ];

    return {
        keyTakeaways: derivedTakeaways,
        userId,
        totalConsultations: conversations.length,
        consultations: conversations.map(c => ({ dateTime: new Date(c.date).toLocaleString('ja-JP'), estimatedDurationMinutes: 20 })),
        keyThemes: derivedThemes,
        detectedStrengths: derivedStrengths,
        areasForDevelopment: ['キャリア・アクションにおけるスモールステップへの展開（具体的実行計画の策定）'],
        suggestedNextSteps: derivedSteps,
        overallSummary,
        triageLevel: conversations.length >= 3 ? 'low' : 'medium',
        ageStageGap: 35,
        theoryBasis: "レヴィンソンの『人生の四季』理論に基づくと、30代中盤の『30代の転機』において、20代の未解決な探索課題が再演されている状態と推測されます。またサビカスのキャリア・コンストラクション理論から見ると、内的動機に基づき自己を主体的かつ現実的に意味づけ（リフレーミング）していく真っ只中にあります。",
        expertAdvice: "相談者の不安や焦燥感が一時的に高まる場合、拙速に具体的な選択を促すと過適応や防衛反応が起こりやすくなります。これまでの面談を通じて『本当の心の声』が顔を出し始めているため、まずはその本音を徹底的にエンパワーメントし、『自己のキャリアの責任主体は自分自身である』というキャリア・アダプタビリティの自覚を促してください。",
        reframedSkills: themes.map((t, idx) => ({
            userWord: t.length > 15 ? t.substring(0, 15) + '...' : t,
            professionalSkill: idx % 2 === 0 ? '状況適応・客観的調整力' : '当事者意識（自己管理力）',
            insight: '生々しい葛藤の中から、本来自分が重視したい価値観を見出す動機付けに昇華されています。'
        })).concat(insights.map((ins, idx) => ({
            userWord: ins.length > 15 ? ins.substring(0, 15) + '...' : ins,
            professionalSkill: idx % 2 === 0 ? '確固たる内省力（自己概念の構築）' : '自己方向付け能力',
            insight: '直感的な気づきを自発的な意図へと接続し、今後の役割転換の確かな土台となっています。'
        }))).slice(0, 3) || [{ userWord: 'コツコツやる', professionalSkill: '継続的改善能力', insight: '地道な作業を苦にせず、品質を高め続ける姿勢があります。' }],
        sessionStarter: insights.length > 0 ? `前回の気づきであった「${insights[0]}」について、その後のご心境の変化や、より深く掘り下げてみたい点は何かございますか？` : '最近の取り組みの中で、一番手応えを感じていることや、小さな変化などはございましたか？',
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
