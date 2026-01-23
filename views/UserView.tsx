
// views/UserView.tsx - v4.04 - Race Condition Prevention Update
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, STORAGE_VERSION, AIType, UserProfile } from '../types';
import { getStreamingChatResponse, generateSummary, generateSuggestions } from '../services/index';
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
import InductionChip from '../components/InductionChip';
import ReferralView from './ReferralView';
import ExpertMatchingView from './ExpertMatchingView';
import { ASSISTANTS } from '../config/aiAssistants';

interface UserViewProps {
  userId: string;
  onSwitchUser: () => void;
}

type UserViewMode = 'loading' | 'dashboard' | 'avatarSelection' | 'chatting' | 'referral' | 'expertMatching';

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

const GREETINGS = {
  human: (name: string) => `[HAPPY] こんにちは、${name}です。お越しいただきありがとうございます。今のあなたの想いや状況を、まずはありのままにお聞かせください。対話を通じて現状を丁寧に整理し、あなたが自信を持って次の一歩を踏み出せるよう、誠心誠意サポートさせていただきます。まずは、今のあなたの状況に近いものを教えていただけますか？`,
  dog: (name: string) => `[HAPPY] こんにちは、${name}だワン！会えて嬉しいワン！今のあなたの気持ちや、がんばっていること、なんでもお話ししてほしいワン。ボクがしっかり寄りさとって、一緒にこれからのことを整理するワン。キミが元気に一歩踏み出せるように応援するからね！まずは、今のキミはどんな感じかな？`
};

const UserView: React.FC<UserViewProps> = ({ userId, onSwitchUser }) => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const [pin, setPin] = useState<string>(''); 
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false); 
  const [isConsultationReady, setIsConsultationReady] = useState<boolean>(false);
  const [isCompleteReady, setIsCompleteReady] = useState<boolean>(false); 
  const [aiName, setAiName] = useState<string>('');
  const [aiType, setAiType] = useState<AIType>('dog');
  const [aiAvatarKey, setAiAvatarKey] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState<boolean>(false); 
  const [hasError, setHasError] = useState<boolean>(false);
  const [aiMood, setAiMood] = useState<Mood>('neutral');

  const [inputClearSignal, setInputClearSignal] = useState<number>(0);

  const [isResponseSlow, setIsResponseSlow] = useState<boolean>(false);
  const slowResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimeRef = useRef<number>(0);
  // v4.04: Synchronous lock to prevent race conditions during state updates
  const isProcessingRef = useRef<boolean>(false);
  
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
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);

  const lastSuggestionKeyRef = useRef<string>('');
  const isFetchingSuggestionsRef = useRef<boolean>(false);

  useEffect(() => {
    if (isLoading) {
        slowResponseTimerRef.current = setTimeout(() => {
            setIsResponseSlow(true);
        }, 20000); 
    } else {
        if (slowResponseTimerRef.current) clearTimeout(slowResponseTimerRef.current);
        setIsResponseSlow(false);
    }
    return () => { if (slowResponseTimerRef.current) clearTimeout(slowResponseTimerRef.current); };
  }, [isLoading]);

  useEffect(() => {
    const user = getUserById(userId);
    setNickname(user?.nickname || userId);
    setPin(user?.pin || '0000'); 
    const allDataRaw = localStorage.getItem('careerConsultations');
    let convs: StoredConversation[] = [];
    if (allDataRaw) {
        try {
            const parsed = JSON.parse(allDataRaw);
            let allConversations: StoredConversation[] = [];
            if (parsed && parsed.data && Array.isArray(parsed.data)) allConversations = parsed.data;
            else if (Array.isArray(parsed)) allConversations = parsed;
            if (allConversations.length > 0) convs = allConversations.filter(c => c.userId === userId);
        } catch(e) { console.error(e); }
    }
    setUserConversations(convs);
    setView(convs.length > 0 ? 'dashboard' : 'avatarSelection');
  }, [userId]);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    const { type, avatarKey } = selection;
    const assistant = ASSISTANTS.find(a => a.id === avatarKey);
    if (!assistant) return;
    
    const selectedAiName = assistant.nameOptions[Math.floor(Math.random() * assistant.nameOptions.length)];
    setAiType(type);
    setAiAvatarKey(avatarKey);
    setAiName(selectedAiName);
    
    startTimeRef.current = Date.now();
    
    const greetingText = GREETINGS[type](selectedAiName);
    setMessages([{ author: MessageAuthor.AI, text: greetingText }]);
    
    if (greetingText.startsWith('[HAPPY]')) setAiMood('happy');
    
    setOnboardingStep(1);
    setUserProfile({ lifeRoles: [] });
    setOnboardingHistory([]);
    setSelectedRoles([]);
    setHasError(false);
    setSuggestionsVisible(false);
    setIsCompleteReady(false);
    setCrisisCount(0);
    lastSuggestionKeyRef.current = ''; 
    isFetchingSuggestionsRef.current = false;
    isProcessingRef.current = false;
    
    setView('chatting');
  }, []);

  const triggerSuggestions = async (currentMessages: ChatMessage[], draftText: string = '', force: boolean = false) => {
      if (isFetchingSuggestionsRef.current || isLoading) return;
      if (onboardingStep < 6) return;

      const trimmedDraft = draftText.trim();
      const lastAiMsg = [...currentMessages].reverse().find(m => m.author === MessageAuthor.AI)?.text || "";
      const suggestionKey = `${currentMessages.length}-${lastAiMsg.slice(-10)}-${trimmedDraft}`;

      if (!force && lastSuggestionKeyRef.current === suggestionKey) return;
      
      isFetchingSuggestionsRef.current = true;
      lastSuggestionKeyRef.current = suggestionKey;

      try {
        const contextualMessages = trimmedDraft
            ? [...currentMessages, { author: MessageAuthor.USER, text: `(相談者が入力しようとしていること: ${trimmedDraft})` }] 
            : currentMessages;
            
        const response = await generateSuggestions(contextualMessages);
        if (response?.suggestions?.length) {
            setSuggestions(response.suggestions);
            if (!isLoading) {
                setSuggestionsVisible(true);
            }
        }
      } catch (e) {
        lastSuggestionKeyRef.current = '';
      } finally {
        isFetchingSuggestionsRef.current = false;
      }
  };

  const handleInputStateChange = useCallback((state: { isFocused: boolean; isTyping: boolean; isSilent: boolean; currentDraft: string }) => {
    setIsTyping(state.isTyping);
    if (state.isSilent && !isLoading && onboardingStep >= 6) {
        triggerSuggestions(messages, state.currentDraft);
    }
  }, [messages, isLoading, onboardingStep]);

  const finalizeAiTurn = async (currentMessages: ChatMessage[], currentStep: number) => {
      setIsLoading(false);
      isProcessingRef.current = false; // v4.04: Release lock
      
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

      if (currentMessages.length >= 4) {
          setIsConsultationReady(true);
      }

      setIsCompleteReady(aiText.includes('[COMPLETE_READY]'));

      if (currentStep >= 6) {
          await triggerSuggestions(currentMessages, "", true);
      }
  };

  const handleSendMessage = async (text: string, isRetry: boolean = false) => {
    const trimmedText = text.trim();
    // v4.04: Synchronous lock check to prevent duplicate execution during state transitions
    if (!trimmedText || (isProcessingRef.current && !isRetry)) return;
    
    isProcessingRef.current = true;
    setIsLoading(true);
    setInputClearSignal(prev => prev + 1);

    if (trimmedText.includes('まとめて') || trimmedText.includes('終了') || trimmedText.includes('完了')) {
        handleGenerateSummary();
        isProcessingRef.current = false;
        setIsLoading(false);
        return;
    }

    const hasCrisisWord = CRISIS_KEYWORDS.some(regex => regex.test(trimmedText));
    if (hasCrisisWord) {
        setCrisisCount(prev => prev + 1);
        setIsCrisisModalOpen(true);
        setMessages(prev => [...prev, { author: MessageAuthor.USER, text: trimmedText }]);
        isProcessingRef.current = false;
        setIsLoading(false);
        return;
    }

    setHasError(false);
    setIsResponseSlow(false);

    let newMessages: ChatMessage[];
    if (isRetry) {
        newMessages = messages.filter((m, i) => !(m.author === MessageAuthor.AI && i === messages.length - 1));
    } else {
        newMessages = [...messages, { author: MessageAuthor.USER, text: trimmedText }];
    }
    
    setMessages(newMessages);
    setSuggestionsVisible(false); 
    setIsCompleteReady(false); 
    setAiMood('thinking');
    lastSuggestionKeyRef.current = ''; 

    if (onboardingStep >= 1 && onboardingStep <= 5) {
        await processOnboarding(trimmedText, newMessages);
        return;
    }

    try {
      const stream = await getStreamingChatResponse(newMessages, aiType, aiName, userProfile);
      if (!stream) throw new Error("Stream connection failed");
      let aiResponseText = '';
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);
      const reader = stream.getReader();
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          if (value.error) {
              if (value.error.code === 'SAFETY_BLOCK') {
                  setCrisisCount(prev => prev + 1);
                  setIsCrisisModalOpen(true);
                  setMessages(prev => prev.slice(0, -1));
                  setIsLoading(false);
                  isProcessingRef.current = false;
                  return;
              }
              throw new Error(value.error.message);
          }

          if (value.text) {
            aiResponseText += value.text;
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].text = aiResponseText;
                return updated;
            });
            
            if (slowResponseTimerRef.current) {
                clearTimeout(slowResponseTimerRef.current);
                setIsResponseSlow(false);
            }
          }
      }
      await finalizeAiTurn([...newMessages, { author: MessageAuthor.AI, text: aiResponseText }], onboardingStep);
    } catch (error: any) {
      setHasError(true);
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: error.message || "通信エラーが発生しました。" }]);
      setIsLoading(false);
      isProcessingRef.current = false;
      setAiMood('neutral');
    }
  };

  const handleRetry = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].author === MessageAuthor.USER) {
            handleSendMessage(messages[i].text, true);
            return;
        }
    }
  };

  const handleDeepDive = () => {
      const prompt = aiType === 'dog' 
          ? "もっと深く話したいワン！今の内容をさらに深掘りして、ボクがまだ気づいていない視点やテーマを3つほど提案してほしいワン！"
          : "さらに深く対話したいと考えています。これまでの内容を踏まえ、私がまだ自覚していない可能性や、掘り下げるべき価値のあるテーマを3点ほど提示いただけますか。";
      handleSendMessage(prompt);
  };

  const processOnboarding = async (choice: string, history: ChatMessage[]) => {
    setOnboardingHistory(prev => [...prev, { ...userProfile }]);
    // Artificial small delay for UX smoothness
    await new Promise(r => setTimeout(r, 400));
    let nextText = '';
    let nextStep = onboardingStep + 1;

    const isDog = aiType === 'dog';

    if (onboardingStep === 1) {
        setUserProfile(prev => ({ ...prev, stage: choice }));
        nextText = isDog 
            ? `[HAPPY] ありがとうワン！次に、あなたの**年代**を教えてほしいワン。` 
            : `[HAPPY] ありがとうございます。次に、ご自身の**年代**を教えていただけますか。`;
    } 
    else if (onboardingStep === 2) {
        setUserProfile(prev => ({ ...prev, age: choice }));
        nextText = isDog 
            ? `[REASSURE] わかったワン。差し支えなければ、**性別**も教えてほしいワン！`
            : `[REASSURE] 承知いたしました。差し支えなければ、**性別**も伺えますでしょうか。`;
    }
    else if (onboardingStep === 3) {
        setUserProfile(prev => ({ ...prev, gender: choice }));
        nextText = isDog
            ? `[CURIOUS] 教えてくれてありがとうワン！今、あなたの**エネルギーはどこに多く使われているかな？**（複数選べるワン）`
            : `[CURIOUS] ありがとうございます。今、あなたの**エネルギーはどこに多く注がれていますか？**（複数選択可能です）`;
    }
    else if (onboardingStep === 4) {
        const roles = choice.split('、');
        setUserProfile(prev => ({ ...prev, lifeRoles: roles }));
        nextText = isDog
            ? `[HAPPY] 準備OKだワン！今日はどんなことをお話ししてみたいかな？自由に話してほしいワン！`
            : `[HAPPY] 対話の準備が整いました。今日は、どのようなことをお話ししてみたいですか？ 答えやすいところからで結構ですよ。`;
    }
    else if (onboardingStep === 5) {
        const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const finalProfile = { 
          ...userProfile, 
          complaint: choice,
          interactionStats: { backCount, resetCount, totalTimeSeconds: totalTime }
        };
        setUserProfile(finalProfile);
        setOnboardingStep(6);
        await startActualConsultation(history, finalProfile, 6);
        return;
    }

    setMessages([...history, { author: MessageAuthor.AI, text: nextText }]);
    setOnboardingStep(nextStep);
    setIsLoading(false);
    isProcessingRef.current = false;
  };

  const startActualConsultation = async (history: ChatMessage[], profile: UserProfile, stepAtFinalize: number) => {
    try {
      const stream = await getStreamingChatResponse(history, aiType, aiName, profile);
      if (!stream) throw new Error("Stream failed");
      let aiResponseText = '';
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);
      const reader = stream.getReader();
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value.text) {
            aiResponseText += value.text;
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].text = aiResponseText;
                return updated;
            });
          }
      }
      await finalizeAiTurn([...history, { author: MessageAuthor.AI, text: aiResponseText }], stepAtFinalize);
    } catch (e) { 
      setHasError(true);
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: "接続に失敗しました。時間をおいて再度お試しください。" }]);
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleGoBack = () => {
    if (onboardingStep <= 1 || isProcessingRef.current) return;
    setBackCount(prev => prev + 1);
    const prevHistory = [...onboardingHistory];
    const prevProfile = prevHistory.pop() || { lifeRoles: [] };
    setMessages(prev => prev.slice(0, -2));
    setOnboardingStep(prev => prev - 1);
    setUserProfile(prevProfile);
    setOnboardingHistory(prevHistory);
    setHasError(false);
    setSuggestionsVisible(false);
    setIsCompleteReady(false);
    setAiMood('neutral');
    lastSuggestionKeyRef.current = '';
  };

  const resetOnboarding = (isManualReset: boolean = true) => {
    if (isManualReset) setResetCount(prev => prev + 1);
    const greetingText = GREETINGS[aiType](aiName);
    setMessages([{ author: MessageAuthor.AI, text: greetingText }]);
    if (greetingText.includes('[HAPPY]')) setAiMood('happy');
    setOnboardingStep(1);
    setUserProfile({ lifeRoles: [] });
    setOnboardingHistory([]);
    setSelectedRoles([]);
    setHasError(false);
    setSuggestionsVisible(false);
    setIsCompleteReady(false);
    setCrisisCount(0);
    lastSuggestionKeyRef.current = '';
    isProcessingRef.current = false;
  };

  const handleGenerateSummary = () => {
    if (isProcessingRef.current) return;
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    generateSummary(messages, aiType, aiName, userProfile)
      .then(setSummary).catch(() => setSummary("エラーが発生しました。")).finally(() => setIsSummaryLoading(false));
  };

  const finalizeAndSave = async (conversation: StoredConversation, isInterrupt: boolean = false) => {
      setIsSummaryModalOpen(false);
      setIsInterruptModalOpen(false); 
      setIsFinalizing(true);
      
      await new Promise(r => setTimeout(r, 1000));
      
      const storedDataRaw = localStorage.getItem('careerConsultations');
      let currentAllConversations = [];
      if (storedDataRaw) {
          try {
              const parsed = JSON.parse(storedDataRaw);
              currentAllConversations = parsed.data || (Array.isArray(parsed) ? parsed : []);
          } catch(e) {}
      }
      
      let updated = [...currentAllConversations, conversation];
      localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updated }));
      
      setUserConversations(updated.filter((c:any) => c.userId === userId));
      setIsFinalizing(false);
      isProcessingRef.current = false;
      
      if (isInterrupt) {
          setView('dashboard'); 
          setMessages([]); 
          setOnboardingStep(0);
          setIsConsultationReady(false);
          lastSuggestionKeyRef.current = '';
      } else {
          setView('referral'); 
      }
  };

  const handleCloseReferral = () => {
      setView('dashboard'); 
      setMessages([]); 
      setOnboardingStep(0);
      setIsConsultationReady(false);
      lastSuggestionKeyRef.current = '';
  };

  const renderOnboardingUI = () => {
    // v4.04: Added disabled states and opacity to prevent double clicks during processing
    return (
      <div className="flex flex-col">
        {onboardingStep === 1 && (
          <div className={`grid grid-cols-1 gap-2 p-4 animate-in fade-in duration-500 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            {STAGES.map(s => (
              <button key={s.id} onClick={() => handleSendMessage(s.label)} disabled={isLoading} className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-50 transition-all shadow-sm active:scale-[0.98]">
                <p className="font-bold text-slate-800">{s.label}</p>
                <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
              </button>
            ))}
          </div>
        )}
        {onboardingStep === 2 && (
          <div className={`flex gap-2 overflow-x-auto p-4 pb-2 scrollbar-hide animate-in fade-in duration-500 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            {AGES.map(a => (
              <button key={a} onClick={() => handleSendMessage(a)} disabled={isLoading} className="flex-shrink-0 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-sky-50 text-sm font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98]">
                {a}
              </button>
            ))}
          </div>
        )}
        {onboardingStep === 3 && (
          <div className={`flex flex-wrap gap-2 p-4 animate-in fade-in duration-500 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            {['男性', '女性', 'その他', '回答しない'].map(g => (
              <button key={g} onClick={() => handleSendMessage(g)} disabled={isLoading} className="px-7 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-sky-50 font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98]">
                {g}
              </button>
            ))}
          </div>
        )}
        {onboardingStep === 4 && (
          <div className={`p-4 flex flex-col gap-5 animate-in fade-in duration-500 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex flex-wrap gap-3">
              {LIFE_ROLES.map(r => (
                <button 
                  key={r.id} 
                  disabled={isLoading}
                  onClick={() => setSelectedRoles(prev => prev.includes(r.label) ? prev.filter(x => x !== r.label) : [...prev, r.label])}
                  className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2.5 font-bold shadow-sm active:scale-[0.98] ${
                    selectedRoles.includes(r.label) ? 'bg-sky-600 border-sky-600 text-white shadow-sky-100' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-lg">{r.icon}</span><span>{r.label}</span>
                </button>
              ))}
            </div>
            <button disabled={selectedRoles.length === 0 || isLoading} onClick={() => handleSendMessage(selectedRoles.join('、'))} className="w-full py-4 bg-sky-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-sky-100 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-[0.98]">これで決定する</button>
          </div>
        )}
        {onboardingStep === 5 && (
          <div className={`flex flex-wrap gap-2 p-4 animate-in fade-in duration-500 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            {['方向性の迷い', '適性を知りたい', '現状を変えたい', '不安を聞いてほしい'].map(c => (
              <button key={c} onClick={() => handleSendMessage(c)} disabled={isLoading} className="px-7 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-sky-50 font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98]">
                {c}
              </button>
            ))}
          </div>
        )}
        {onboardingStep >= 1 && onboardingStep <= 5 && (
          <div className="flex justify-center gap-8 pb-4 text-xs font-bold text-slate-400">
            {onboardingStep > 1 && (
              <button onClick={handleGoBack} disabled={isLoading} className="hover:text-sky-600 transition-colors uppercase tracking-wider disabled:opacity-30">← 戻る</button>
            )}
            <button onClick={() => resetOnboarding(true)} disabled={isLoading} className="hover:text-sky-600 transition-colors uppercase tracking-wider disabled:opacity-30">最初からやり直す</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-slate-100 ${view === 'chatting' ? 'h-full overflow-hidden' : 'min-h-[100dvh]'} relative`}>
      {view === 'chatting' && <Header showBackButton={true} onBackClick={() => setIsInterruptModalOpen(true)} />}
      
      {view === 'chatting' && (
        <div className="fixed top-20 right-4 lg:right-[calc(50vw-480px)] z-[100] transition-all duration-500">
           <div className={`
             rounded-full border-4 border-white shadow-2xl bg-slate-800 overflow-hidden ring-4 ring-sky-500/20 active:scale-95 transition-all
             ${isLoading ? 'animate-pulse ring-sky-500 ring-opacity-100 shadow-[0_0_30px_rgba(14,165,233,0.4)]' : ''}
             w-16 h-16 sm:w-20 sm:h-20 lg:w-32 lg:h-32
           `}>
             <AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} mood={aiMood} isCompact={true} />
           </div>
           <div className="mt-2 text-center">
              <span className="bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-tighter shadow-md">
                {aiName}
              </span>
           </div>
        </div>
      )}

      <main className={`flex-1 flex flex-col items-center ${view === 'chatting' || view === 'referral' || view === 'expertMatching' ? 'p-4 md:p-6 overflow-hidden h-full' : 'p-0 sm:p-4 md:p-6'}`}>
        {view === 'dashboard' ? <UserDashboard conversations={userConversations} onNewChat={() => setView('avatarSelection')} onResume={(c) => { setMessages(c.messages); setAiName(c.aiName); setAiType(c.aiType); setAiAvatarKey(c.aiAvatar); setView('chatting'); setOnboardingStep(6); }} userId={userId} nickname={nickname} pin={pin} onSwitchUser={onSwitchUser} /> :
         view === 'avatarSelection' ? <AvatarSelectionView onSelect={handleAvatarSelected} /> :
         view === 'referral' ? <ReferralView onBack={handleCloseReferral} onContinueChat={() => setView('chatting')} onSearchExperts={() => setView('expertMatching')} /> :
         view === 'expertMatching' ? <ExpertMatchingView onBack={handleCloseReferral} /> :
         <div className="w-full max-w-5xl h-full flex flex-row gap-6 relative justify-center">
            <div className="flex-1 h-full flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
              <ChatWindow messages={messages} isLoading={isLoading} onEditMessage={() => {}} />
              
              <div className="flex-shrink-0 flex flex-col bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-10">
                  {isResponseSlow && (
                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                            <span className="text-xs font-bold text-amber-800">応答に時間がかかっています。接続を確認するか再試行してください。</span>
                        </div>
                        <button 
                            onClick={handleRetry}
                            className="px-3 py-1 bg-amber-600 text-white text-[10px] font-black rounded-full shadow-sm hover:bg-amber-700 transition-colors uppercase tracking-widest"
                        >
                            Retry
                        </button>
                    </div>
                  )}

                  <div className="relative">
                      {onboardingStep >= 6 && !isLoading && (
                        <InductionChip 
                            isVisible={isCompleteReady} 
                            onSummarize={handleGenerateSummary} 
                            onDeepDive={handleDeepDive} 
                        />
                      )}
                      {onboardingStep >= 6 && (
                        <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSendMessage} isVisible={suggestionsVisible && !isCompleteReady} />
                      )}
                      
                      {renderOnboardingUI()}
                      
                      <ChatInput 
                        onSubmit={handleSendMessage} 
                        isLoading={isLoading} 
                        isEditing={false} 
                        initialText="" 
                        clearSignal={inputClearSignal}
                        onCancelEdit={() => {}} 
                        onStateChange={handleInputStateChange}
                      />
                      
                      {onboardingStep >= 6 && <ActionFooter isReady={isConsultationReady} onSummarize={handleGenerateSummary} onInterrupt={() => setIsInterruptModalOpen(true)} />}
                  </div>
              </div>
            </div>
         </div>}
      </main>

      {isFinalizing && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex flex-col items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center scale-up-center">
             <div className="relative mb-8">
               <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
               <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <h3 className="text-2xl font-bold text-slate-800">相談データを保存しています</h3>
             <p className="text-slate-500 mt-4 leading-relaxed font-medium">整理した内容を安全に保存しました。<br/>次のステップを案内します。</p>
          </div>
        </div>
      )}

      <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summary} isLoading={isSummaryLoading} onRevise={() => {}} onFinalize={() => finalizeAndSave({ id: Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary, date: new Date().toISOString(), status: 'completed' }, false)} />
      
      <InterruptModal 
        isOpen={isInterruptModalOpen} 
        onSaveAndInterrupt={() => finalizeAndSave({ id: Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary: '中断', date: new Date().toISOString(), status: 'interrupted' }, true)} 
        onExitWithoutSaving={() => { setIsInterruptModalOpen(false); setView('dashboard'); isProcessingRef.current = false; }} 
        onContinue={() => setIsInterruptModalOpen(false)} 
      />

      <CrisisNoticeModal 
        isOpen={isCrisisModalOpen} 
        onClose={() => setIsCrisisModalOpen(false)} 
        intensity={crisisCount >= 2 ? 'high' : 'normal'}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        .scale-up-center { animation: scale-up-center 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; }
        @keyframes scale-up-center { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}} />
    </div>
  );
};

export default UserView;
