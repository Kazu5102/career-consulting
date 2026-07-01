# システム詳細仕様書：自己完結型AIキャリアカウンセリング・サポートシステム
**System Specification Document - Version 6.59**

---

## 1. はじめに (Introduction)
本仕様書は、**「システム開発原則：自己完結型データ連携システム」**（特許コンセプト）に基づき開発された、AIキャリアカウンセリング・サポートシステムの完全な再現・再構築を目的とした、AI認識用の詳細仕様書である。

本システムは、プライバシー保護の極地である**「ゼロトラストDB保存」**、暗号化技術を用いた**「自己完結型HTMLパッケージエクスポート」**、および非言語的特徴量である**「タイピング・フルーエンシー（打鍵ゆらぎ）による動的介入」**を統合した、極めて先進的なフルスタックWebアプリケーションである。

---

## 2. 核心的特許コンセプト & システム開発原則
再構築にあたり、AIは以下の4原則を「絶対不変の制約」として遵守しなければならない。

### ① データ管理の基本原則（ゼロトラスト）
*   **永続的DB保存の回避**: 相談者の対話履歴、プロフィール、分析データは、システム提供者側のいかなるサーバー・データベースにも永続的に保存してはならない。
*   **揮発性メモリ管理**: すべて of 対話データはブラウザの揮発性メモリ（React State）を主軸とし、ローカルセッションの維持のみを目的とした一時ストレージ（ブラウザのlocalStorage等）のみに留め、明示的なセッション終了、ブラウザクローズ、またはユーザーによる破棄操作をもって完全に消去する。

### ② 自己完結型HTMLパッケージ（スタンドアロン・エクスポート）
*   **エクスポート形式**: ユーザーがデータのバックアップ、または専門家への共有を行う際は、単一のファイルとして完結した**「スタンドアロン型HTMLファイル」**を出力する。
*   **暗号化アルゴリズム**: ユーザーが指定した独自の「パスワード」から、Web Crypto APIを用いて強力な鍵導出を行い、完全に暗号化されたJSON文字列を生成する。
    *   **鍵導出アルゴリズム**: `PBKDF2` (SHA-256、イテレーション: 100) を用いて、パスワードと16バイトの暗号化用Saltから256bitの `AES-GCM` 共通鍵を動的生成。
    *   **暗号化方式**: 12バイトの初期化ベクトル（IV）と導出された共通鍵を用い、`AES-GCM` による256bit暗号化を施す。
    *   **パッケージ出力フォーマット**:
        `${IVのHex}:${SaltのHex}:${暗号化データのHex}` のコロン区切り文字列を、復号・パース・ローカル描画（CSS/Tailwind, MarkedJS内包）を行うJavaScriptコードと共に単一のHTMLファイルへ埋め込む。

### ③ 専門家へのセキュア連携（ゼロストレージ・デクリプション）
*   **物理/口頭共有パスワード**: 専門家（管理者・キャリアコンサルタント）がデータを確認するには、物理的、または口頭で直接共有された相談者独自のパスワードが必須である。
*   **非永続展開**: 専門家の端末に読み込まれ、復号された相談データは、ブラウザの揮発性メモリ上でのみ展開され、専門家側の管理用データベースやサーバーログへは絶対に保存・転送してはならない。

### ④ 入力ゆらぎを活用した動的介入（タイピング・フルーエンシー）
*   **推敲係数の算出**: ユーザーがテキストを入力する際の打鍵間隔（キープレスとキープレスの間のミリ秒）から、思考の迷いや葛藤を示す「推敲係数（迷いの度合い）」をリアルタイムで算出する。
*   **非言語的コンテキストのプロンプト連携**: 算出された統計データ（平均打鍵速度、標準偏差）を、Gemini APIへのシステムプロンプトに「非言語的情報」として付加することで、共感度や心理的安全性の極めて高い、タイミングに最適化された動的介入（ヒント・問いかけ）を行う。

---

## 3. システムアーキテクチャ & フォルダ構成
アプリケーションは、以下のコンポーネント、ビュー、サービスから構成される。

```
/
├── metadata.json                    # アプリケーションメタデータ
├── package.json                     # 技術スタック、スクリプト、依存関係
├── types.ts                         # アプリケーション全体の厳格な型定義
├── AGENTS.md                        # システム開発原則（ゼロトラストポリシー）
├── SYSTEM_SPECIFICATION.md          # システム詳細仕様書（本ファイル）
├── index.html                       # エントリーHTML
├── vite.config.ts                   # Viteビルド設定
├── api/
│   └── gemini-proxy.ts              # Gemini APIとの通信を媒介する安全なサーバーレスAPIプロキシ
├── config/
│   └── aiAssistants.ts              # AIアバターのキャラクター、プロンプト定義
├── services/
│   ├── index.ts                     # サービスのエクスポート一元化
│   ├── cryptoService.ts             # Web Crypto APIを用いた暗号化・復号ロジック
│   ├── reportService.ts             # 暗号化HTMLパッケージ（スタンドアロン版）の生成
│   ├── conversationService.ts       # 対話履歴のブラウザ一時保存・自動復旧
│   ├── userService.ts               # ローカルユーザー管理、PIN認証
│   ├── authService.ts               # セキュアシグネチャ等の認証ロジック
│   ├── analysisService.ts           # 軌跡分析（Trajectory）、スキルマッチング等のAI分析要求
│   └── mockGeminiService.ts         # オフライン・モック応答シミュレーター
├── components/
│   ├── AIAvatar.tsx                 # 各種AIキャラクター（虎徹含む）のSVG・アニメーション
│   ├── ChatInput.tsx                # タイピング速度・休止間隔をリアルタイム算出する入力部
│   ├── ChatWindow.tsx               # チャット対話ログ表示コンポーネント
│   ├── SummaryModal.tsx             # 相談完了時のカウンセリング概要、分析結果表示
│   ├── ImportSecurePackageModal.tsx  # 暗号化HTMLパッケージを読み込み、復号展開するインポート部
│   └── UserDashboard.tsx            # 相談者の対話履歴管理、エクスポート、保護設定ダッシュボード
└── views/
    ├── UserSelectionView.tsx        # ユーザーログイン/新規登録（PIN認証）
    ├── AvatarSelectionView.tsx      # カウンセラー（アバター）選択画面
    ├── UserView.tsx                 # 相談者向けキャリア相談メイン画面
    └── AdminView.tsx                # 専門家（コンサルタント）向けパッケージ復号・分析ビュー
```

---

## 4. タイピング・フルーエンシー（入力ゆらぎ）制御アルゴリズム
このシステムにおける最も特徴的な技術的アプローチであり、`ChatInput.tsx` と `UserView.tsx` の連携によって実現されている。

### ① 静止判定の「二重領域分離」アルゴリズム
ユーザーの打鍵挙動を以下の2つの時間的領域に分離し、異なるUXアクションをトリガーする。

1.  **第一領域：通常入力領域判定 (0.6秒)**
    *   しきい値: `600ms` 固定（`SILENCE_TIMEOUT`）
    *   アクション: タイピング中のごく自然な小休止とみなし、入力中のドラフトに含まれる単語をローカル辞書（`INSTANT_KEYWORDS`）とマッチングして、瞬時に「クイック入力候補（HINT）」を画面に提示する（通信を発生させず、UIの応答性を最大化）。
2.  **第二領域：内省深堀介入領域判定（動的待機時間μ+3σ）**
    *   しきい値: 統計データから算出された動的タイムアウト（標準初期値: `2500ms`）
    *   アクション: ユーザーの手が止まり、**「内省に入った（迷っている、考え込んでいる）」**と判定。この瞬間（T）、入力途中の不完全なドラフト文字列を、過去の直近の会話文脈と共にGemini APIへ送信し、「次に続く思考を促す予測型のヒント（HINT）」を動的に生成・提示する。

### ② 推敲タイムアウトの動的算出ロジック
```typescript
const calculateDynamicTimeout = (): number => {
  const strokes = keystrokesRef.current; // 打鍵タイムスタンプ（ミリ秒）の配列（最大15個）
  if (strokes.length < 3) return 2500;   // データ不足時は初期値（2.5秒）を適用

  const intervals: number[] = [];
  for (let i = 1; i < strokes.length; i++) {
     const diff = strokes[i] - strokes[i-1];
     // 1.5秒以上の極端な打鍵停止は、すでに入力作業から離脱して「思考/推敲」に入っているため、
     // 純粋なタイピング速度の学習データから除外（統計の歪みを防止するノイズカット処理）
     if (diff < 1500) intervals.push(diff);
  }

  if (intervals.length < 2) return 2500;

  // 平均値（μ）の算出
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  // 分散と標準偏差（σ）の算出
  const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // 推敲待機時間 T = 平均（μ） + 3 * 標準偏差（σ） [3シグマルールを適用]
  const dynamicTimeout = mean + (stdDev * 3);

  // 極端な値にならないよう、下限1.5秒、上限4.0秒にクリップ（丸め処理）
  return Math.min(Math.max(dynamicTimeout, 1500), 4000);
};
```

### ③ 動的介入（HINT）連携時のプロトコル
*   **通信負荷削減 (案V)**: 内省深堀介入時のAPIコールにおいて、履歴全体を送るとトークン増加および並行処理のボトルネックになるため、ペイロードは**「直近2ラリー（最大4件）の履歴＋現在の入力中ドラフト」**に厳しく制限する。
*   **多重通信ブロック (案X)**: API送信中にユーザーが打鍵を再開した場合、重複してリクエストが走るのを防ぐため、送信トリガー前にフラグ `isSuggestingRef.current = true` を立て、通信完了まで次の介入トリガーを排他ブロックする。

---

## 5. スペシャルアバター「虎徹 (Kotetsu)」のSVG描画仕様
本アプレットに搭載されている最重要マスコットキャラクター。チワワとトイプードルのミックスである「チワプー」の愛らしい外見と特徴、およびスマートなスカーフ・首輪を、100%インラインSVGのみで精密かつ美しく実装する。

### ① 基本デザインパラメータ
*   **カラーパレット**:
    *   主毛色（プードル譲りのアプリコット）: `#f2b973`
    *   ハイライト・おでこのブレーズ（縦の白線）・マズル: `#faf8f5` (オフホワイト)
    *   耳の内側（チワワ風の大きなピンク色の耳腔）: `#fbcfe8` (半透明 `opacity="0.9"`)
    *   主輪郭線・表情描画（暖かみのあるチョコブラウン）: `#7c2d12` (Tailwindの `orange-900` に相当)
    *   お鼻（しっとりしたダークグレー）: `#2d3748`
    *   スカーフ・首輪（虎徹を象徴するピンクのお洋服のエッセンス）: `#f472b6`
*   **デザインコンセプト**:
    *   チワワの「大きくてピンと立った愛らしい立ち耳」と、トイプードルの「もこもこした頭頂部」を融合。
    *   お洋服よりも、虎徹本来の表情を他の犬アバターとスケールを合わせて大きく見せるため、頭部および顔（輪郭）の比率を大きくスケールアップし、お洋服はスカーフや首元の襟飾りとしてスマートに最下部に配置（縦横比の調和）。

### ② SVGノード構造
```xml
<svg viewBox="0 0 200 200" class="w-full h-full transition-transform duration-500">
    <!-- 1. 首輪/スカーフ (ピンクのお洋服のエッセンスをスマートに配置) -->
    <path d="M 70,158 C 70,158 60,185 100,185 C 140,185 130,158 130,158 Z" fill="#f472b6" stroke="#7c2d12" stroke-width="2" stroke-linejoin="round" />
    
    <!-- 胸元の白い毛 -->
    <path d="M 85,158 C 90,172 110,172 115,158 Z" fill="#faf8f5" stroke="#7c2d12" stroke-width="1.5" />

    <!-- 2. チワワ風の大きな立ち耳 (ピンクの耳腔、ふちのもこもかも飾り毛付き) -->
    <!-- 左耳 -->
    <path d="M 56,102 C 12,52 40,20 74,68 Z" fill="#f2b973" stroke="#7c2d12" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M 56,96 C 28,66 45,36 68,70 Z" fill="#fbcfe8" opacity="0.9" />
    <path d="M 32,58 Q 22,72 34,82" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round" />
    <path d="M 43,46 Q 34,55 46,64" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round" />

    <!-- 右耳 -->
    <path d="M 144,102 C 188,52 160,20 126,68 Z" fill="#f2b973" stroke="#7c2d12" stroke-width="2.5" stroke-linejoin="round" />
    <path d="M 144,96 C 172,66 155,36 132,70 Z" fill="#fbcfe8" opacity="0.9" />
    <path d="M 168,58 Q 178,72 166,82" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round" />
    <path d="M 157,46 Q 166,55 154,64" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round" />

    <!-- 3. チワプーのシュッとしたスマートな卵型輪郭 (逆三角形・他の犬種アバターと調和する大スケール) -->
    <path d="M 50,110 C 50,145 70,162 100,162 C 130,162 150,145 150,110 C 150,88 130,80 100,80 C 70,80 50,88 50,110 Z" fill="#f2b973" stroke="#7c2d12" stroke-width="2.5" stroke-linejoin="round" />

    <!-- 4. トイプードル譲りのもこもこした頭髪 (重なり円) -->
    <circle cx="100" cy="76" r="22" fill="#f2b973" />
    <circle cx="85" cy="80" r="16" fill="#f2b973" />
    <circle cx="115" cy="80" r="16" fill="#f2b973" />
    <path d="M 75,70 C 82,62 94,61 100,65 C 106,61 118,62 125,70" fill="none" stroke="#7c2d12" stroke-width="2" stroke-linecap="round" />

    <!-- 5. おでこの白いブレーズ (チャームポイント) -->
    <path d="M 91,80 L 109,80 L 105,108 L 95,108 Z" fill="#faf8f5" />

    <!-- 6. ふっくらもこもなマズル (ウィスカーパッド) -->
    <ellipse cx="85" cy="128" rx="18" ry="14" fill="#faf8f5" stroke="#7c2d12" stroke-width="1.5" />
    <ellipse cx="115" cy="128" rx="18" ry="14" fill="#faf8f5" stroke="#7c2d12" stroke-width="1.5" />
    <ellipse cx="100" cy="134" rx="16" ry="12" fill="#faf8f5" />
    <ellipse cx="100" cy="126" rx="14" ry="12" fill="#faf8f5" />

    <!-- 7. ふんわりキュートな眉毛 -->
    <path d="M 70,94 Q 82,86 91,92" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <path d="M 109,92 Q 118,86 130,94" stroke="#7c2d12" stroke-width="2.5" fill="none" stroke-linecap="round" />

    <!-- 8. 表情連動パーツ (DynamicEyes, DynamicBlush, DynamicMouth) -->
    <!-- お鼻 (少し大きめのダークグレーで愛らしさを強調) -->
    <ellipse cx="100" cy="120" rx="9.5" ry="6.5" fill="#2d3748" />
</svg>
```

---

## 6. 主要データ構造と型定義 (Data Models)
`types.ts` に準拠。データベースを一切持たないため、この型定義が暗号化パッケージの読み書き仕様を完全に統制する。

### ① 暗号化ファイルの構造 (`StoredData`)
```typescript
export interface StoredData {
  version: number;                  // ストレージ仕様バージョン (現在: 2)
  data: StoredConversation[];       // 相談履歴
  users?: UserInfo[];               // ローカルPINユーザーのリスト
  userInfo?: UserInfo;              // エクスポートしたユーザー自身の情報
  exportedAt?: string;              // エクスポート時刻 (ISO string)
  analysisHistory?: AnalysisHistoryEntry[]; // 専門家による詳細分析履歴
}
```

### ② 相談者プロフィール (`UserProfile`)
オンボードおよび対話中に動的にアップデートされる情報。
```typescript
export interface UserProfile {
  nickname?: string;
  stage?: string;                   // 5つの発達段階 (cultivate, seek, solidify, preserve, liberate)
  age?: string;                     // 年代区分
  gender?: string;                  // 性別（任意）
  complaint?: string;               // 最初の主訴（自由記述）
  lifeRoles?: string[];             // ライフロール（複数選択：学校、家庭、趣味、仕事、セルフケア）
  interactionStats?: {
    backCount: number;              // 差し戻し・修正回数
    resetCount: number;             // リセット回数
    totalTimeSeconds: number;       // セッション累積時間（秒）
  };
  typingFluency?: {                 // タイピング・フルーエンシーの最終統計
    mean: number;                   // 平均打鍵間隔 (ms)
    stdDev: number;                 // 標準偏差 (ms)
  };
}
```

### ③ キャリア発達段階 (Superのライフ・キャリア・レインボーに基づく)
*   **じっくり自分を育み、守っている (`cultivate`)**: 好きなことを見つけたり、自分を蓄えている感覚
*   **新しい道や可能性を探している (`seek`)**: 次の場所や役割を模索している感覚
*   **今の役割で力を発揮し、基盤を固めている (`solidify`)**: 今の生活や仕事を安定させている感覚
*   **経験を活かし、次を見据えている (`preserve`)**: 積み重ねを整理し、現状維持や後進を支える感覚
*   **役割から離れ、本来の自分に戻りたい (`liberate`)**: 責任を卒業し、自由な生き方を見つけたい感覚

### ④ 軌跡分析結果 (`TrajectoryAnalysisData`)
専門家画面（`AdminView.tsx`）および分析ダッシュボード（`AnalysisDashboard.tsx`）にわたるAI統合解析のデータモデル。
```typescript
export interface TrajectoryAnalysisData {
  userId: string;
  totalConsultations: number;
  consultations: { dateTime: string; estimatedDurationMinutes: number }[];
  keyThemes: string[];               // 抽出された主要テーマ
  detectedStrengths: string[];       // 検出された強み
  areasForDevelopment: string[];     // 開拓領域・課題
  suggestedNextSteps: string[];      // 提案アクション
  overallSummary: string;            // 統合的心理要約
  triageLevel: 'high' | 'medium' | 'low'; // トリアージ優先度
  ageStageGap: number;               // 選択年代と回答における発達ステージのギャップ度 (0-100)
  theoryBasis?: string;              // 学術的根拠理論（Super, Hall, Savickas等）
  expertAdvice?: string;             // 専門家向け指導アドバイス
  reframedSkills: {                  // 本人の言葉をプロフェッショナルスキルに言語化・再定義
    userWord: string;
    professionalSkill: string;
    insight: string;
  }[];
  sessionStarter: string;            // 次回復職・相談時の導入会話スターター案
  narrativeTimeline?: { topic: string; emotionalTone: number }[]; // 感情軌跡のタイムラインデータ
}
```

---

## 7. API / 外部通信プロトコル (Communication Layer)

### ① Gemini API プロキシプロトコル (`api/gemini-proxy.ts`)
*   **役割**: クライアント側のフロントエンドからGemini APIキーを完全に隠蔽するため、サーバーレス関数（Vercel Serverless Function）を中継プロキシとして機能させる。
*   **セキュリティ要件**: フロントからプロキシへのリクエストには署名やPIN検証などの軽量認証を施す。
*   **API仕様**:
    *   エンドポイント: `/api/gemini-proxy`
    *   SDK: `@google/genai` の `GoogleGenAI` クライアントを使用。
    *   使用モデル: デフォルトで `gemini-2.5-flash` もしくは `gemini-2.5-pro` を用途（対話 vs 複雑な軌跡分析）に応じて振り分け。

### ② プロンプトへの非言語特徴量（推敲係数）の動的バインド
対話中に `typingFluency` が算出されている場合、プロキシまたは対話リクエスト時に以下のようなJSON、またはテキストでコンテキストがプロンプトへ注入される。

```markdown
【相談者の打鍵行動データ（非言語的特徴量）】
* 平均打鍵速度 (mean): 185ms (非常に滑らかな入力、淀みがない)
* 打鍵のばらつき (stdDev): 42ms (安定して一定のリズムで入力)
* 最終打鍵時の推敲遅延 (latency): 3200ms (非常に長い沈黙、葛藤・迷い、内省の極致)

[AIへの指示]
この相談者は、入力の途中で 3秒以上の強い沈黙（推敲遅延）が発生しました。
この沈黙は、直前の問いかけに対する「言葉にしがたい葛藤」や「深い自己探求」を表しています。
焦らせるようなアドバイスは避け、この「迷い」や「言い淀み」の背後にある感情に共感し、そっと背中を押す、あるいは深く傾聴する返答を生成してください。
```

---

## 8. 厳格な開発・バージョン更新ルール
システムが自己崩壊するのを防ぐため、再構築・改修を行うAIは、以下の開発プロトコルを遵守すること。

1.  **2箇所同時バージョン更新の徹底**:
    コードに変更を加える際は、必ず以下の2箇所を同時に新しい数値（例: `6.59`）にインクリメントして書き換えること。
    *   **各ファイルの冒頭コメント**: `// components/AIAvatar.tsx - v6.59 - 2026-06-30 - ...`
    *   **プログラム内部 of バージョン定数**: `VERSION = "6.59"`, `metadata.json` 内の `"version": "6.59"` など。
2.  **一意なコンテキストマッチング**:
    コードを書き換える際は、対象の前後10行の一意なコード構造を正確に対比させ、ズレのない外科的置換（Surgical Edits）を行うこと。
3.  **無駄なコード崩壊・機能削減の禁止**:
    既存のカウンセラーの豊かな振る舞いや、タイピングゆらぎアルゴリズムなどの繊細なロジックを、一時的な改修の都合で削除したり、モックデータに置き換えたりしてはならない。
4.  **詳細仕様書（SYSTEM_SPECIFICATION.md）の遵守と更新管理（案A）**:
    開発を始める前に、必ず本仕様書を全行参照すること。また、変更を決定して適用する際は、常に仕様書、プログラムのバージョン記述、およびシステム指示書（`AGENTS.md`）の3つを完全に同期すること。

---
*End of Document.*
