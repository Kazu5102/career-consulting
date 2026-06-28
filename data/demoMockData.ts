// data/demoMockData.ts
// v6.43 - 2026-06-16 - デモ用プリセットデータ（パターンA/パターンB）の定義

import { TrajectoryAnalysisData } from '../types';

export const DEMO_DATA_VERSION = "6.43";

export const demoPatternA: TrajectoryAnalysisData = {
    userId: "demo_yuki_18",
    totalConsultations: 1,
    consultations: [
        { dateTime: "2026-06-10T10:00:00Z", estimatedDurationMinutes: 45 }
    ],
    keyTakeaways: [
        "家庭内での心理的安全性が損なわれている状態",
        "孤立感（「友達に相談できない」）へのケアが必要",
        "本人の感情の受容を最優先し、慎重に家庭内の力関係をアセスメント"
    ],
    keyThemes: ["家庭内の不和", "孤立感", "相談への抵抗"],
    detectedStrengths: ["自身の恐怖を言語化できている点", "相談に来られた自律性"],
    areasForDevelopment: ["社会的孤立の解消", "安全の確保"],
    suggestedNextSteps: [
        "感情の積極的受容とラポールの深耕",
        "家庭内での暴力の有無、頻度の客観的確認"
    ],
    overallSummary: `思春期特有の激しい親子の衝突（教育・家族領域）が推測されます。クライアントは『手を出されそうになった』『怒鳴られた』と恐怖を感じており、家庭内での心理的安全性が損なわれている状態です。『友達に相談できない』という孤立感も抱えているため、まずはクライアントの感情の受容と、家庭内の力関係（暴力の有無の確認）を慎重にアセスメントする方向でのカウンセリングを推奨します。`,
    triageLevel: 'medium', // イエロー配色
    ageStageGap: 40,
    theoryBasis: "キャリア構築理論 / 発達臨床心理学",
    expertAdvice: "証拠が不十分な段階（対話が浅い段階）では、「〇〇の可能性があります。まずは慎重なアセスメントを推奨します」というトーンでの見立てが推奨されます。",
    reframedSkills: [
        { userWord: "怒鳴られる", professionalSkill: "危機状況下での自己防衛反応", insight: "自身の安全を守るため、脅威に鋭敏に気づく感性があります" }
    ],
    sessionStarter: "最近のご家庭でのご様子について、少しお話しいただけますか？",
    
    // デモ用フィールド
    dialogueDepth: "shallow",
    demoScores: {
        family_education: 80,
        welfare_protection: 20
    },
    redFlag: false,
    urgencyLevel: "medium",
    extractedTags: ["#家庭内の不和", "#孤立感", "#相談への抵抗"],
    typingFluencySpike: false,
};

export const demoPatternB: TrajectoryAnalysisData = {
    userId: "demo_yuki_18_deep",
    totalConsultations: 1,
    consultations: [
        { dateTime: "2026-06-10T11:00:00Z", estimatedDurationMinutes: 60 }
    ],
    keyTakeaways: [
        "胸ぐらを掴まれ押し倒されたという具体的身体暴力のエビデンス",
        "親の社会的地位（著名人）による外部への相談の完全な遮断（強固な孤立）",
        "フラッシュバックや強い恐怖心。自己犠牲的な心理状態からの脱却が必要"
    ],
    keyThemes: ["家庭内暴力の境界線", "有名人の家族", "相談できない孤立", "通報・児童相談所"],
    detectedStrengths: ["沈黙（45秒）を乗り越えて真実を告白した極めて高い勇気", "安全への切実な希求"],
    areasForDevelopment: ["物理的・絶対安全の確保", "相談ネットワークの再構築"],
    suggestedNextSteps: [
        "即時的な福祉的介入、児童相談所や警察等の関係機関へのリファー検討",
        "シェルター等を用いた物理的安全スペースの確保"
    ],
    overallSummary: `初期段階では「思春期の親子の衝突」と推測されましたが、対話中の長い沈黙（45秒）ののち、クライアントは「親の社会的地位（著名人）による外部への相談の完全な遮断」および「身体的暴力の事実（胸ぐらを掴まれ押し倒された）」を吐露しました。クライアントは自己犠牲的な心理状態にあり、フラッシュバックや恐怖心から緊急度を【高（レッドフラッグ）】と判定しています。クライアントの物理的・心理的絶対安全の確保を最優先とし、福祉的介入や児童相談所・警察への適切なリファーを含めた専門的対応を強く推奨します。`,
    triageLevel: 'high', // 要介入（レッド）
    ageStageGap: 85,
    theoryBasis: "家族システム理論 / トラウマケア / 社会的孤立アプローチ",
    expertAdvice: "極めて切迫度の高い対人暴力を確認。もはや個別カウンセリングの範疇を超えており、直ちに関係機関（児相・救急等）へのリファー段取りを開始すべき局面です。",
    reframedSkills: [
        { userWord: "沈黙", professionalSkill: "熟考と自己洞察、安全な開示タイミングの見極め", insight: "言葉にできない葛藤を自らの内で咀嚼し、最善のタイミングで勇気を持って告白する強さがあります" }
    ],
    sessionStarter: "よくお話ししてくれましたね。あなたの安全を一緒につくりましょう。",
    
    // デモ用フィールド
    dialogueDepth: "deep",
    demoScores: {
        family_education: 35,
        welfare_protection: 65
    },
    redFlag: true,
    urgencyLevel: "high",
    extractedTags: ["#家庭内暴力の境界線", "#有名人の家族", "#相談できない孤立", "#通報・児童相談所"],
    typingFluencySpike: true,
};
