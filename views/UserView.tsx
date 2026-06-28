
// views/UserView.tsx - v6.48 - 2026-06-28 - インポート時にニックネームが維持・回復されるように修正し、バージョンを6.48に統一
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, AIType, UserProfile } from '../types';
import { getStreamingChatResponse, generateSummary, generateSuggestions } from '../services/index';
import * as directMockService from '../services/mockGeminiService';
import * as conversationService from '../services/conversationService';
import { getUserById } from '../services/userService';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import SummaryModal from '../components/SummaryModal';
import InterruptModal from '../components/InterruptModal';
import CrisisNoticeModal from '../components/CrisisNoticeModal';
import AIAvatar, { Mood } from '../components/AIAvatar';
import AvatarSelectionView from './AvatarSelectionView';
import UserDashboard from '../components/UserDashboard';
import ActionFooter from '../components/ActionFooter';
import SuggestionChips from '../components/SuggestionChips';
import { ASSISTANTS } from '../config/aiAssistants';

interface UserViewProps {
  userId: string;
  onSwitchUser: () => void;
}

type UserViewMode = 'loading' | 'dashboard' | 'avatarSelection' | 'chatting';

const STAGES = [
  { id: 'cultivate', label: 'じっくり自分を育み、守っている', sub: '好きなことを見つけたり、自分を蓄えている感覚' },
  { id: 'seek', label: '新しい道や可能性を探している', sub: '次の場所や役割を模索している感覚' },
  { id: 'solidify', label: '今の役割で力を発揮し、基盤を固めている', sub: '今の生活や仕事を安定させている感覚' },
  { id: 'preserve', label: '経験を活かし、次を見据えている', sub: '積み重ねを整理し、現状維持や後進を支える感覚' },
  { id: 'liberate', label: '役割から離れ、本来の自分に戻りたい', sub: '責任を卒業し、自由な生き方を見つけたい感覚' },
];

const AGES = ['10代未満', '10代', '20代', '30代', '40代', '50代', '60代', '70代以上', '回答しない'];

const LIFE_ROLES = [
  { id: 'learning', label: '学校・学び', icon: '🎓' },
  { id: 'family', label: '家庭・家族', icon: '🏠' },
  { id: 'hobby', label: '趣味・遊び', icon: '🎨' },
  { id: 'work', label: '仕事・社会活動', icon: '💼' },
  { id: 'care', label: '自分のケア・休息', icon: '🧘' },
];

const CRISIS_KEYWORDS = [
    /死にたい/, /自殺/, /消えたい/, /死にたくなった/, /自死/, /終わりにしたい/, 
    /首をつる/, /飛び降りる/, /殺して/, /生きていたくない/
];

const INSTANT_KEYWORDS: Record<string, string[]> = {
    '仕事': ['仕事の悩みについて', '業務内容の話', '職場の人間関係', 'キャリアの方向性'],
    '転職': ['転職を考えている', '今の仕事を辞めたい', '未経験分野への挑戦', 'スキルアップ'],
    '人間関係': ['上司との関係', '同僚とのトラブル', 'チームの雰囲気', 'コミュニケーション'],
    '余計': ['余計な仕事が多い', '無駄を感じる', '効率化したい', '断れない業務'],
    '無駄': ['無駄な会議', '意味のない業務', '時間の使い方', '生産性を上げたい'],
    '将来': ['将来が不安', 'キャリアプラン', '5年後の自分', 'ロールモデルがない'],
    '給料': ['給与への不満', '評価制度について', '年収アップ', '待遇改善'],
    'スキル': ['スキル不足を感じる', '新しい技術', '資格取得', '学習方法'],
    '疲れ': ['仕事に疲れた', 'リフレッシュしたい', 'メンタルヘルス', '休職について'],
    '辞め': ['辞めたい', '退職交渉', '引き止めにあっている', '退職のタイミング'],
    '不安': ['漠然とした不安', 'このままでいいのか', '自信がない', '今後の生活'],
    '強み': ['自分の強みを知りたい', 'アピールポイント', '向いている仕事', '適性検査'],
    '時間': ['残業が多い', 'ワークライフバランス', '自分の時間が欲しい', '時間管理'],
    '評価': ['正当に評価されない', '目標設定が厳しい', 'フィードバックがない', '昇進について'],
    '起業': ['起業に興味がある', '独立を考えている', 'アイデアを形にしたい', '事業計画の立て方'],
    '企業': ['企業選びの軸', '自分に合う企業', '大企業かベンチャーか', '会社の将来性']
};

const FALLBACK_SUGGESTIONS = [
    "もう少し詳しく話したい",
    "ここまでの話を整理したい",
    "どうすればいいと思う？",
    "今の気持ちを聞いてほしい"
];

const GREETINGS = {
  human: (name: string) => `[HAPPY] こんにちは、${name}です。お越しいただきありがとうございます。今のあなたの想いや状況を、まずはありのままにお聞かせください。対話を通じて現状を丁寧に整理し、あなたが自信を持って次の一歩を踏み出せるよう、誠心誠意サポートさせていただきます。まずは、今のあなたの状況に近いものを教えていただけますか？`,
  dog: (name: string) => `[HAPPY] こんにちは、${name}だワン！会えて嬉しいワン！今のあなたの気持ちや、がんばっていること、なんでもお話ししてほしいワン。ボクがしっかり寄りさとって、一緒にこれからのことを整理するワン。キミが元気に一歩踏み出せるように応援するからね！まずは、今のキミはどんな感じかな？`
};

const UserView: React.FC<UserViewProps> = ({ userId, onSwitchUser }) => {
  const VERSION = "6.48";
  const [isSummaryHighlighted, setIsSummaryHighlighted] = useState<boolean>(false);
  const [view, setView] = useState<UserViewMode>('loading');
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const [pin, setPin] = useState<string>(''); 
  
  // Conversation State
  const [currentConversationId, setCurrentConversationId] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false); 
  const [isTyping, setIsTyping] = useState<boolean>(false); 
  const [isConsultationReady, setIsConsultationReady] = useState<boolean>(false);
  const [consultationReadiness, setConsultationReadiness] = useState<number>(0);
  const [aiName, setAiName] = useState<string>('');
  const [aiType, setAiType] = useState<AIType>('dog');
  const [aiAvatarKey, setAiAvatarKey] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [baseSuggestions, setBaseSuggestions] = useState<string[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState<boolean>(false); 
  const [aiMood, setAiMood] = useState<Mood>('neutral');

  const [inputClearSignal, setInputClearSignal] = useState<number>(0);
  const lastApiDraftRef = useRef<string>(''); // API無限ループ防止用キャッシュ
  const lastDraftRawRef = useRef<string>(''); // 入力テキストの変更検知用
  const isSuggestingRef = useRef<boolean>(false); // 案X: 並行通信ブロック用フラグ

  const startTimeRef = useRef<number>(0);
  const [backCount, setBackCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [crisisCount, setCrisisCount] = useState(0);

  const [onboardingStep, setOnboardingStep] = useState<number>(0); 
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    lifeRoles: [],
    interactionStats: { backCount: 0, resetCount: 0, totalTimeSeconds: 0 }
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [onboardingHistory, setOnboardingHistory] = useState<UserProfile[]>([]);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isInterruptModalOpen, setIsInterruptModalOpen] = useState<boolean>(false);
  
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [typingFluency, setTypingFluency] = useState<{ mean: number; stdDev: number } | undefined>(undefined);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);
  const [restoredNotification, setRestoredNotification] = useState<boolean>(false);

  useEffect(() => {
    if (isTyping && onboardingStep < 6) {
      setSuggestionsVisible(false);
    }
  }, [isTyping, onboardingStep]);

  useEffect(() => {
    const initData = async () => {
      const user = await getUserById(userId);
      setNickname(user?.nickname || userId);
      setPin(user?.pin || '0000'); 
      
      const convs = await conversationService.getConversationsByUserId(userId);
      setUserConversations(convs);

      const saved = await conversationService.getAutoSave(userId);
      if (saved && saved.messages && saved.messages.length > 0) {
          setMessages(saved.messages);
          setAiName(saved.aiName);
          setAiType(saved.aiType);
          setAiAvatarKey(saved.aiAvatarKey);
          setOnboardingStep(saved.onboardingStep);
          setUserProfile(saved.userProfile);
          setAiMood(saved.aiMood);
          // Restore ID if available, otherwise generate new to prevent overwriting undefined
          setCurrentConversationId(saved.currentConversationId || Date.now());
          
          setView('chatting');
          setRestoredNotification(true);
          setTimeout(() => setRestoredNotification(false), 5000);
      } else {
          setView(convs.length > 0 ? 'dashboard' : 'avatarSelection');
      }
    };
    initData();
  }, [userId]);

  useEffect(() => {
      if (view === 'chatting' && messages.length > 0) {
          const dataToSave = {
              timestamp: Date.now(),
              currentConversationId, // Persist ID
              messages,
              aiName,
              aiType,
              aiAvatarKey,
              onboardingStep,
              userProfile,
              aiMood
          };
          conversationService.saveAutoSave(userId, dataToSave);
      }
  }, [messages, aiName, aiType, aiAvatarKey, onboardingStep, userProfile, aiMood, view, userId, currentConversationId]);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    const { type, avatarKey } = selection;
    const assistant = ASSISTANTS.find(a => a.id === avatarKey);
    if (!assistant) return;
    
    const selectedAiName = assistant.nameOptions[Math.floor(Math.random() * assistant.nameOptions.length)];
    setAiType(type);
    setAiAvatarKey(avatarKey);
    setAiName(selectedAiName);
    
    startTimeRef.current = Date.now();
    // New Session = New ID
    setCurrentConversationId(Date.now());
    
    const greetingText = GREETINGS[type](selectedAiName);
    setMessages([{ author: MessageAuthor.AI, text: greetingText }]);
    
    if (greetingText.startsWith('[HAPPY]')) setAiMood('happy');
    
    setOnboardingStep(1);
    setUserProfile({ lifeRoles: [] });
    setOnboardingHistory([]);
    setSelectedRoles([]);
    setSuggestionsVisible(false);
    setCrisisCount(0);
    setHasError(false);
    
    setView('chatting');
  }, []);

  const handleBackFromAvatarSelection = () => {
    if (userConversations.length > 0) {
      setView('dashboard');
    } else {
      onSwitchUser();
    }
  };

    /**
     * 対話の心理フェーズに基づいてサジェストを動的に配置する
     */
    const mergeSuggestionsByPhase = useCallback((baseSuggestions: string[], readiness: number) => {
        const msgCount = messages.filter(m => m.author === MessageAuthor.USER).length;
        const summaryLabel = readiness >= 0.9 || msgCount >= 15 ? "✨ ここまでの話をまとめる" : "ここまでの話をまとめる";
        
        let result = [...baseSuggestions];
        
        // 統合期 (Phase 3): 内省が非常に深い、または15回以上の対話
        // 情報を十分に集約できたと判断できて以降は、常時HINTのTOPに出現！
        if (readiness >= 0.85 || msgCount >= 15) {
            result = [summaryLabel, ...result];
        }
        // 収束期 (Phase 2): 10回以上の対話
        // 最初のうちは、選択の最後（末尾）
        else if (readiness >= 0.7 || msgCount >= 10) {
            result.push(summaryLabel);
        }
        // 探索期後半 (Phase 1): 8回以上の対話
        // 最初のうちは、選択の最後（末尾）
        else if (readiness >= 0.5 || msgCount >= 8) {
            result.push(summaryLabel);
        }
        
        return Array.from(new Set(result)).slice(0, 4); // 重複排除 & 最大4件
    }, [messages]);

  const handleInputStateChange = useCallback((state: { 
    isFocused: boolean; 
    isTyping: boolean; 
    isSilent: boolean; 
    isDeepSilent: boolean; 
    currentDraft: string;
    fluency?: { mean: number; stdDev: number };
  }) => {
    setIsTyping(state.isTyping);
    
    // Only update fluency when typing stops or deep silent to avoid frequent re-renders
    if (state.isSilent || state.isDeepSilent) {
        setTypingFluency(state.fluency);
    }
    
    const draft = state.currentDraft;
    const textChanged = draft !== lastDraftRawRef.current;
    
    const userMsgCount = messages.filter(m => m.author === MessageAuthor.USER).length;

    // AI返信中やエラー時はヒントを一切出さない
    if (isLoading || hasError) {
        setSuggestionsVisible(false);
        lastDraftRawRef.current = draft;
        return;
    }

    if (state.isTyping && draft.trim().length > 0 && onboardingStep >= 6) {
        let matched = false;
        for (const [key, list] of Object.entries(INSTANT_KEYWORDS)) {
            if (draft.includes(key)) {
                setSuggestions(list);
                setSuggestionsVisible(true);
                matched = true;
                break;
            }
        }
        // キーワードにマッチしない場合でも、HINT表示を維持する（フォーカス時やタイピング時）
        if (!matched && textChanged) {
            if (onboardingStep >= 6) {
                setSuggestions(baseSuggestions);
                setSuggestionsVisible(baseSuggestions.length > 0);
            }
        }
    }
    // 【内省深堀介入領域】: 動動的学習待機時間(T)超過時 - APIへ推敲文脈の予測（第2段階 HINT）を要求
    else if (state.isDeepSilent && !isLoading && !hasError && onboardingStep >= 6 && !isSuggestingRef.current) {
        if (draft.trim().length >= 2) {
            if (draft !== lastApiDraftRef.current) {
                lastApiDraftRef.current = draft; // 呼び出し前にキャッシュを更新しループ遮断
                isSuggestingRef.current = true; // 案X: ブロック開始
                
                // 案V: 無駄な履歴を削ぎ落とし、直近2ラリー（最大4件）だけを文脈として渡す
                const recentMessages = messages.slice(-4);
                
                generateSuggestions(recentMessages, draft)
                    .then(resp => {
                        if (resp && resp.suggestions && resp.suggestions.length > 0) {
                            const score = resp.readinessScore || 0;
                            setConsultationReadiness(score);
                            const merged = mergeSuggestionsByPhase(resp.suggestions, score);
                            setBaseSuggestions(merged); // APIから届いたHINTを維持するためにbaseに保存
                            setSuggestions(merged);
                            setSuggestionsVisible(true);
                            
                            if (score >= 0.85) {
                                setIsConsultationReady(true);
                                setIsSummaryHighlighted(true);
                            }
                        }
                    })
                    .catch(() => {
                        const merged = mergeSuggestionsByPhase(FALLBACK_SUGGESTIONS, consultationReadiness);
                        setBaseSuggestions(merged);
                        setSuggestions(merged);
                        setSuggestionsVisible(true);
                    })
                    .finally(() => {
                        isSuggestingRef.current = false; // 案X: ブロック解除
                    });
            }
        } else if (draft.trim().length === 0) {
            if (textChanged) {
                if (onboardingStep >= 6) {
                    setSuggestions(baseSuggestions);
                    setSuggestionsVisible(baseSuggestions.length > 0);
                } else {
                    setSuggestionsVisible(false);
                }
            }
        }
    }
    // 【通常入力領域】: 0.6秒のタイピング小休止時はAPI通信を防ぎつつ、ローカル辞書で打感を保つ
    else if (state.isSilent && !state.isDeepSilent && !isLoading && !hasError && onboardingStep >= 6) {
        if (draft.trim().length >= 2) {
            let matched = false;
            for (const [key, list] of Object.entries(INSTANT_KEYWORDS)) {
                if (draft.includes(key)) {
                    setSuggestions(list);
                    setSuggestionsVisible(true);
                    matched = true;
                    break;
                }
            }
            // matchedでない場合も、APIから届いた既存のHINTや基本HINTを維持する
            if (!matched && textChanged) {
                if (onboardingStep >= 6) {
                    setSuggestions(baseSuggestions);
                    setSuggestionsVisible(baseSuggestions.length > 0);
                }
            }
        } else if (draft.trim().length === 0) {
            if (textChanged) {
                if (onboardingStep >= 6) {
                    setSuggestions(baseSuggestions);
                    setSuggestionsVisible(baseSuggestions.length > 0);
                } else {
                    setSuggestionsVisible(false);
                }
            }
        }
    }
    // 入力が消されたら一律非表示
    else if (draft.trim().length === 0) {
        if (textChanged) {
            if (onboardingStep >= 6) {
                setSuggestions(baseSuggestions);
                setSuggestionsVisible(baseSuggestions.length > 0);
            } else {
                setSuggestionsVisible(false);
            }
        }
    }
    
    lastDraftRawRef.current = draft;
  }, [isLoading, onboardingStep, messages, hasError, mergeSuggestionsByPhase, consultationReadiness, baseSuggestions]);

  const finalizeAiTurn = async (currentMessages: ChatMessage[]) => {
      setIsLoading(false);
      const lastAiMessage = currentMessages[currentMessages.length - 1];
      const aiText = lastAiMessage?.text || "";

      if (aiText.includes('[HAPPY]')) setAiMood('happy');
      else if (aiText.includes('[CURIOUS]')) setAiMood('curious');
      else if (aiText.includes('[THINKING]')) setAiMood('thinking');
      else if (aiText.includes('[REASSURE]')) setAiMood('reassure');
      else {
          if (aiText.includes('？')) setAiMood('curious');
          else if (aiText.includes('！')) setAiMood('happy');
          else if (aiText.includes('…')) setAiMood('thinking');
          else setAiMood('neutral');
      }

      const msgCount = currentMessages.filter(m => m.author === MessageAuthor.USER).length;
      if (msgCount >= 4) setIsConsultationReady(true);
      
      if (onboardingStep >= 6) {
          // AIターン直後: 最初の一歩をアシストするAPI予測（第1段階 HINT）
          // APIからの応答を待つ間、ひとまず基本のHINTを提示しておく（システム負荷を考慮したUX向上）
          const initialMerged = mergeSuggestionsByPhase(FALLBACK_SUGGESTIONS, consultationReadiness);
          setBaseSuggestions(initialMerged);
          setSuggestions(initialMerged);
          setSuggestionsVisible(true);

          isSuggestingRef.current = true; // 案X: ブロック開始
          // 案V: 履歴を直前の2ラリー（4件）に限定してペイロードを削減
          const recentMessages = currentMessages.slice(-4);
          
          generateSuggestions(recentMessages)
            .then(resp => {
                const fetchedSuggestions = resp && resp.suggestions && resp.suggestions.length > 0 ? resp.suggestions : FALLBACK_SUGGESTIONS;
                const score = resp.readinessScore || 0;
                setConsultationReadiness(score);
                const merged = mergeSuggestionsByPhase(fetchedSuggestions, score);
                setBaseSuggestions(merged);
                setSuggestions(merged);
                setSuggestionsVisible(true);
                
                // 通常のAIとの対話でも、十分に情報が集約できた場合は自動的に要約ボタンを解放してハイライト誘導
                if (score >= 0.85) {
                    setIsConsultationReady(true);
                    setIsSummaryHighlighted(true);
                }
            })
            .catch(() => {
                const merged = mergeSuggestionsByPhase(FALLBACK_SUGGESTIONS, consultationReadiness);
                setBaseSuggestions(merged);
                setSuggestions(merged);
                setSuggestionsVisible(true);
            })
            .finally(() => {
                isSuggestingRef.current = false; // 案X: ブロック解除
            });
      }
  };

  /**
   * Executes a chat turn:
   * 1. Appends AI placeholder.
   * 2. Calls streaming API.
   * 3. Updates UI on stream updates.
   * 4. Handles errors by cleaning up and setting error state.
   */
  const executeAiTurn = async (history: ChatMessage[], overrideProfile?: UserProfile) => {
      setIsLoading(true);
      setSuggestionsVisible(false); // 送信直後はヒントを隠す
      setHasError(false);
      setAiMood('thinking');
      
      const profileToUse = overrideProfile || { ...userProfile, typingFluency };

      // Add placeholder message for AI
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);

        try {
            const stream = await getStreamingChatResponse(history, aiType, aiName, profileToUse);
            if (!stream) throw new Error("Connection failed: No stream returned");
            
            let aiResponseText = '';
            const reader = stream.getReader();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value.error) throw new Error(value.error.message);
                if (value.text) {
                    aiResponseText += value.text;
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastMsg = updated[updated.length - 1];
                        // Ensure we are updating the AI message
                        if (lastMsg.author === MessageAuthor.AI) {
                            lastMsg.text = aiResponseText;
                        }
                        return updated;
                    });
                }
            }
            
            if (!aiResponseText) throw new Error("Empty response received");
            await finalizeAiTurn([...history, { author: MessageAuthor.AI, text: aiResponseText }]);

        } catch (error) {
            console.error("Chat Execution Error, attempting Mock Fallback:", error);
            try {
                // 429等のエラー時はMockサービスへ自動的にフォールバックするフェイルセーフ機構
                const mockStream = await directMockService.getStreamingChatResponse(history, aiType, aiName, profileToUse);
                if (!mockStream) throw new Error("Mock stream unavailable");
                
                let aiResponseText = '';
                const reader = mockStream.getReader();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value.text) {
                        aiResponseText += value.text;
                        setMessages(prev => {
                            const updated = [...prev];
                            const lastMsg = updated[updated.length - 1];
                            if (lastMsg.author === MessageAuthor.AI) {
                                lastMsg.text = aiResponseText;
                            }
                            return updated;
                        });
                    }
                }
                await finalizeAiTurn([...history, { author: MessageAuthor.AI, text: aiResponseText }]);
                // Mockフォールバック成功時はエラーボックスを見せず、警告のみ
                console.warn("Service is currently in fallback mode.");
            } catch (mockError) {
                console.error("Mock Fallback also failed:", mockError);
                setIsLoading(false);
                setHasError(true);
                setAiMood('thinking'); 
                // 最終的に失敗した場合はプレースホルダーを削除
                setMessages(prev => prev.filter(m => m.text !== ''));
            }
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;
        setInputClearSignal(prev => prev + 1);
        lastApiDraftRef.current = ''; // 意図的な送信時にキャッシュをリセット
        
        if (text === 'ここまでの話をまとめる' || text === '✨ ここまでの話をまとめる' || text.includes('まとめて') || text.includes('終了') || text.includes('完了')) {
            // Optimistic Update: Add user message immediately
            const userMessage: ChatMessage = { author: MessageAuthor.USER, text };
            const newHistory = [...messages, userMessage];
            setMessages(newHistory);
            
            setSuggestionsVisible(false); 
            setHasError(false);
            setIsLoading(true);
            
            setTimeout(() => {
                const isDog = aiType === 'dog';
                const aiResponseText = isDog
                    ? `キミ、今日はいっぱいお話ししてくれて本当にありがとうワン！\nキミが話してくれた大切なこと、心の中の迷い、これからのこと…ボクがぜんぶギュッとまとめておいたワンっ！\n\nここまでの内容を整理する準備はいつでもバッチリだワン！\n\n画面の一番下にある緑色の**【相談を終了して整理する】**ボタンをぽちっと押すと、キミのためだけの「ふりかえりシート」が完成するワン！\nキミの好きなタイミングでボタンを押して、次のステージへ進もうワン！🐾`
                    : `今日にいたるまで、本当にたくさんのお話を聞かせていただきありがとうございました。\nご自身のこれまでの歩みや、今直面している葛藤、そして本当に大切にしたい想いを、ご自身の言葉でとても丁寧に紡いでいただきました。\n\nこれまでの対話の内容をすっきりと整理する準備が整いました。\n\n画面の一番下にある緑色の**【相談を終了して整理する】**ボタンを押していただくと、これまでの歩みをまとめた「キャリア・リフレクション・レポート」を作成いたします。\nご自身のタイミングで、いつでもボタンをタップして次のステップへ一緒に進みましょう。`;
                
                setMessages(prev => [...prev, { author: MessageAuthor.AI, text: aiResponseText }]);
                setIsLoading(false);
                setIsConsultationReady(true); // 要約ボタン解放
                setIsSummaryHighlighted(true); // ボタンをハイライト
                setAiMood('happy');
            }, 1200);
            return;
        }
        
        const hasCrisisWord = CRISIS_KEYWORDS.some(regex => regex.test(text));
        if (hasCrisisWord) {
            setCrisisCount(prev => prev + 1);
            setIsCrisisModalOpen(true);
            setMessages(prev => [...prev, { author: MessageAuthor.USER, text }]);
            return;
        }
        
        // Mockエラーメッセージが出ている状態で新しく送信された場合、直前のAIエラーメッセージを履歴から消す
        let currentHistory = [...messages];
        if (hasError && currentHistory.length > 0 && currentHistory[currentHistory.length - 1].author === MessageAuthor.AI) {
            currentHistory.pop();
        }

        // Optimistic Update: Add user message immediately
        const userMessage: ChatMessage = { author: MessageAuthor.USER, text };
        const newHistory = [...currentHistory, userMessage];
        setMessages(newHistory);
        
        setSuggestionsVisible(false); 
        setHasError(false);

        if (onboardingStep >= 1 && onboardingStep <= 5) {
            await processOnboarding(text, newHistory);
            return;
        }
        
        // Normal chat flow
        await executeAiTurn(newHistory);
    };

    const handleRetry = () => {
        let currentHistory = [...messages];
        // エラー時のAI謝罪メッセージがあれば除去してからリトライ
        if (hasError && currentHistory.length > 0 && currentHistory[currentHistory.length - 1].author === MessageAuthor.AI) {
            currentHistory.pop();
            setMessages(currentHistory);
        }
        if (currentHistory.length === 0) return;
        setHasError(false);
        executeAiTurn(currentHistory);
    };

  const processOnboarding = async (choice: string, history: ChatMessage[]) => {
    setOnboardingHistory(prev => [...prev, { ...userProfile }]);
    await new Promise(r => setTimeout(r, 400));
    let nextText = '';
    let nextStep = onboardingStep + 1;
    const isDog = aiType === 'dog';
    
    // Onboarding logic updates profile in state
    // We calculate the *next* state locally to pass to executeAiTurn if needed
    let updatedProfile = { ...userProfile };

    if (onboardingStep === 1) {
        updatedProfile.stage = choice;
        setUserProfile(prev => ({ ...prev, stage: choice }));
        nextText = isDog ? `[HAPPY] ありがとうワン！次に、あなたの**世代**を教えてほしいワン。` : `[HAPPY] ありがとうございます。次に、ご自身の**年代（世代）**を教えていただけますか。`;
    } 
    else if (onboardingStep === 2) {
        updatedProfile.age = choice;
        setUserProfile(prev => ({ ...prev, age: choice }));
        nextText = isDog ? `[REASSURE] わかったワン。差し支えなければ、**性別（自認する性）**も教えてほしいワン！` : `[REASSURE] 承知いたしました。差し支えなければ、**性別（自認する性）**も伺えますでしょうか。`;
    }
    else if (onboardingStep === 3) {
        updatedProfile.gender = choice;
        setUserProfile(prev => ({ ...prev, gender: choice }));
        nextText = isDog ? `[CURIOUS] 教えてくれてありがとうワン！今、あなたの**意識やエネルギーはどこに多く向いているかな？**（複数選べるワン）` : `[CURIOUS] ありがとうございます。今、あなたの**意識やエネルギーはどこに多く向いていますか？**（複数選択可能です）`;
    }
    else if (onboardingStep === 4) {
        const roles = choice.split('、');
        updatedProfile.lifeRoles = roles;
        setUserProfile(prev => ({ ...prev, lifeRoles: roles }));
        nextText = isDog ? `[HAPPY] 準備OKだワン！今日はどんなことをお話ししてみたいかな？自由に話してほしいワン！` : `[HAPPY] 対話の準備が整いました。今日は、どのようなことをお話ししてみたいですか？ 答えやすいところからで結構ですよ。`;
    }
    else if (onboardingStep === 5) {
        const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const finalProfile = { ...userProfile, complaint: choice, interactionStats: { backCount, resetCount, totalTimeSeconds: totalTime } };
        setUserProfile(finalProfile);
        setOnboardingStep(6);
        // Step 5 -> 6 triggers the first REAL API call
        await executeAiTurn(history, finalProfile);
        return;
    }
    
    // For steps 1-4, it's scripted, no API call
    setMessages([...history, { author: MessageAuthor.AI, text: nextText }]);
    if (nextText.includes('[HAPPY]')) setAiMood('happy');
    else if (nextText.includes('[REASSURE]')) setAiMood('reassure');
    else if (nextText.includes('[CURIOUS]')) setAiMood('curious');
    setOnboardingStep(nextStep);
    setIsLoading(false);
  };

  const handleGoBack = () => {
    if (onboardingStep <= 1) return;
    setBackCount(prev => prev + 1);
    const prevHistory = [...onboardingHistory];
    const prevProfile = prevHistory.pop() || { lifeRoles: [] };
    setMessages(prev => prev.slice(0, -2));
    setOnboardingStep(prev => prev - 1);
    setUserProfile(prevProfile);
    setOnboardingHistory(prevHistory);
    setSuggestionsVisible(false);
    setHasError(false);
    setAiMood('neutral');
  };

  const resetOnboarding = (isManualReset: boolean = true) => {
    conversationService.clearAutoSave(userId);
    if (isManualReset) {
        setResetCount(prev => prev + 1);
        // On strict reset, generate new ID
        setCurrentConversationId(Date.now());
    }
    const greetingText = GREETINGS[aiType](aiName);
    setMessages([{ author: MessageAuthor.AI, text: greetingText }]);
    setAiMood(greetingText.includes('[HAPPY]') ? 'happy' : 'neutral');
    setOnboardingStep(1);
    setUserProfile({ lifeRoles: [] });
    setOnboardingHistory([]);
    setSelectedRoles([]);
    setSuggestionsVisible(false);
    setHasError(false);
    setCrisisCount(0);
  };

  const handleGenerateSummary = () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    const performSummary = async () => {
        try {
            const result = await generateSummary(messages, aiType, aiName, userProfile);
            setSummary(result);
        } catch (e) {
            console.warn("API Error during summary generation, falling back to mock:", e);
            try {
                setSummary(await directMockService.generateSummary(messages, aiType, aiName, userProfile));
            } catch {
                setSummary("申し訳ありません。通信環境の影響で要約を作成できませんでした。");
            }
        } finally { setIsSummaryLoading(false); }
    };
    performSummary();
  };

  const finalizeAndSave = async (conversation: StoredConversation) => {
      setIsSummaryModalOpen(false);
      setIsInterruptModalOpen(false); 
      setIsFinalizing(true);
      await conversationService.clearAutoSave(userId);
      await new Promise(r => setTimeout(r, 1000));
      await conversationService.saveConversation(conversation);
      const updated = await conversationService.getConversationsByUserId(userId);
      setUserConversations(updated);
      setIsFinalizing(false);
      setView('dashboard'); 
      setMessages([]); 
      setOnboardingStep(0);
      setIsConsultationReady(false);
      setHasError(false);
      setAiMood('neutral');
      setCurrentConversationId(0); // Reset after saving
  };

  return (
    <div className={`flex flex-col bg-slate-100 ${view === 'chatting' ? 'h-full overflow-hidden' : 'min-h-[100dvh]'} relative`}>
      {view === 'chatting' && <Header showBackButton={true} onBackClick={() => setIsInterruptModalOpen(true)} />}
      
      {restoredNotification && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-sky-600 text-white px-6 py-3 rounded-full shadow-xl z-[150] animate-in slide-in-from-top-4 duration-500 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-bold text-sm">前回の続きから再開しました</span>
          </div>
      )}

      {view === 'chatting' && (
        <div className="fixed top-20 right-4 lg:right-[calc(50vw-480px)] z-[100] transition-all duration-500">
           <div className={`rounded-full border-4 border-white shadow-2xl bg-slate-800 overflow-hidden ring-4 ring-sky-500/20 active:scale-95 transition-all ${isLoading ? 'animate-pulse ring-sky-500 ring-opacity-100 shadow-[0_0_30px_rgba(14,165,233,0.4)]' : ''} w-16 h-16 sm:w-20 sm:h-20 lg:w-32 lg:h-32`}>
             <AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} mood={aiMood} isCompact={true} />
           </div>
           <div className="mt-2 text-center">
              <span className="bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-tighter shadow-md">{aiName}</span>
           </div>
        </div>
      )}

      <main className={`flex-1 flex flex-col items-center ${view === 'chatting' ? 'p-4 md:p-6 overflow-hidden h-full' : 'p-0 sm:p-4 md:p-6'}`}>
        {view === 'dashboard' ? <UserDashboard 
            conversations={userConversations} 
            onNewChat={() => setView('avatarSelection')} 
            onResume={(c) => { 
                setMessages(c.messages); 
                setAiName(c.aiName); 
                setAiType(c.aiType); 
                setAiAvatarKey(c.aiAvatar); 
                setCurrentConversationId(c.id); // Capture existing session ID
                
                // Restore Context from serialized summary if available
                try {
                    const parsed = JSON.parse(c.summary);
                    if (parsed.userProfile) setUserProfile(parsed.userProfile);
                    if (parsed.aiMood) setAiMood(parsed.aiMood);
                } catch(e) {
                    console.log("Resuming legacy session or simple summary");
                }
                
                setView('chatting'); 
                setOnboardingStep(6); 
                setIsConsultationReady(c.messages.length >= 4);
            }} 
            userId={userId} 
            nickname={nickname} 
            pin={pin} 
            onSwitchUser={onSwitchUser} 
        /> :
         view === 'avatarSelection' ? <AvatarSelectionView onSelect={handleAvatarSelected} onBack={handleBackFromAvatarSelection} /> :
         <div className="w-full max-w-5xl h-full flex flex-row gap-6 relative justify-center">
            <div className="flex-1 h-full flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
              <ChatWindow messages={messages} isLoading={isLoading} onEditMessage={() => {}} />
              <div className="flex-shrink-0 flex flex-col bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-10">
                  {onboardingStep === 1 && (
                    <div className="grid grid-cols-1 gap-2 p-4 animate-in fade-in duration-500">
                      {STAGES.map(s => (
                        <button key={s.id} onClick={() => handleSendMessage(s.label)} className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-50 transition-all shadow-sm active:scale-[0.98]">
                          <p className="font-bold text-slate-800">{s.label}</p>
                          <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {onboardingStep === 2 && (
                    <div className="flex flex-wrap gap-2 p-4 animate-in fade-in duration-500">
                      {AGES.map(a => (
                        <button key={a} onClick={() => handleSendMessage(a)} className="flex-shrink-0 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-sky-50 text-sm font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98]">{a}</button>
                      ))}
                    </div>
                  )}
                  {onboardingStep === 3 && (
                    <div className="flex flex-wrap gap-2 p-4 animate-in fade-in duration-500">
                      {['男性', '女性', 'その他', '回答しない'].map(g => (
                        <button key={g} onClick={() => handleSendMessage(g)} className="px-7 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-sky-50 font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98]">{g}</button>
                      ))}
                    </div>
                  )}
                  {onboardingStep === 4 && (
                    <div className="p-4 flex flex-col gap-5 animate-in fade-in duration-500">
                      <div className="flex flex-wrap gap-3">
                        {LIFE_ROLES.map(r => (
                          <button key={r.id} onClick={() => setSelectedRoles(prev => prev.includes(r.label) ? prev.filter(x => x !== r.label) : [...prev, r.label])} className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2.5 font-bold shadow-sm active:scale-[0.98] ${selectedRoles.includes(r.label) ? 'bg-sky-600 border-sky-600 text-white shadow-sky-100' : 'bg-white border-slate-200 text-slate-700'}`}><span className="text-lg">{r.icon}</span><span>{r.label}</span></button>
                        ))}
                      </div>
                      <button disabled={selectedRoles.length === 0} onClick={() => handleSendMessage(selectedRoles.join('、'))} className="w-full py-4 bg-sky-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-sky-100 disabled:bg-slate-300 transition-all active:scale-[0.98]">これで決定する</button>
                    </div>
                  )}
                  {onboardingStep === 5 && (
                    <div className="flex flex-wrap gap-2 p-4 animate-in fade-in duration-500">
                      {['方向性の迷い', '適性を知りたい', '現状を変えたい', '不安を聞いてほしい'].map(c => (
                        <button key={c} onClick={() => handleSendMessage(c)} className="px-7 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-sky-50 font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98]">{c}</button>
                      ))}
                    </div>
                  )}
                  {onboardingStep >= 1 && onboardingStep <= 5 && (
                    <div className="flex justify-center gap-8 pb-4 text-xs font-bold text-slate-400">
                      {onboardingStep > 1 && <button onClick={handleGoBack} className="hover:text-sky-600 transition-colors uppercase tracking-wider">← 戻る</button>}
                      <button onClick={() => resetOnboarding(true)} className="hover:text-sky-600 transition-colors uppercase tracking-wider">最初からやり直す</button>
                    </div>
                  )}
                  
                  {/* Retry Button Logic */}
                  {hasError && (
                    <div className="px-4 pb-2">
                        <button 
                            onClick={handleRetry}
                            className="w-full py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center justify-center gap-2 font-bold animate-in fade-in slide-in-from-bottom-2 shadow-sm hover:bg-red-100 transition-colors active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            通信エラーが発生しました。タップして再生成
                        </button>
                    </div>
                  )}

                  <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} isEditing={false} initialText="" clearSignal={inputClearSignal} onCancelEdit={() => {}} onStateChange={handleInputStateChange} />
                  {onboardingStep >= 6 && <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSendMessage} isVisible={suggestionsVisible && !hasError} />}
                  {onboardingStep >= 6 && <ActionFooter isReady={isConsultationReady} onSummarize={handleGenerateSummary} onInterrupt={() => setIsInterruptModalOpen(true)} isHighlighted={isSummaryHighlighted} />}
              </div>
            </div>
         </div>}
      </main>

      {isFinalizing && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex flex-col items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
             <div className="relative mb-8"><div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div><div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
             <h3 className="text-2xl font-bold text-slate-800">相談データを保存しています</h3>
             <p className="text-slate-500 mt-4 leading-relaxed font-medium">整理した内容を安全に保存しました。<br/>ダッシュボードへ戻ります。</p>
          </div>
        </div>
      )}

      <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summary} isLoading={isSummaryLoading} onFinalize={() => finalizeAndSave({ id: currentConversationId || Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary, date: new Date().toISOString(), status: 'completed' })} messages={messages} userId={userId} aiName={aiName} nickname={nickname} />
      <InterruptModal isOpen={isInterruptModalOpen} onSaveAndInterrupt={() => finalizeAndSave({ 
          id: currentConversationId || Date.now(), 
          userId, 
          aiName, 
          aiType, 
          aiAvatar: aiAvatarKey, 
          messages, 
          summary: JSON.stringify({
            user_summary: '中断されたセッション',
            userProfile,
            aiMood
          }), 
          date: new Date().toISOString(), 
          status: 'interrupted' 
      })} onExitWithoutSaving={() => { conversationService.clearAutoSave(userId); setIsInterruptModalOpen(false); setView('dashboard'); }} onContinue={() => setIsInterruptModalOpen(false)} />
      <CrisisNoticeModal isOpen={isCrisisModalOpen} onClose={() => setIsCrisisModalOpen(false)} intensity={crisisCount >= 2 ? 'high' : 'normal'} />
    </div>
  );
};

export default UserView;
