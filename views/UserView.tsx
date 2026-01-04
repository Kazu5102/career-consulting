
// views/UserView.tsx - v2.14 - Suggestion Transparency Logic
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, STORAGE_VERSION, AIType, UserProfile } from '../types';
import { getStreamingChatResponse, generateSummary, generateSuggestions } from '../services/index';
import { getUserById } from '../services/userService';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import SummaryModal from '../components/SummaryModal';
import InterruptModal from '../components/InterruptModal';
import AIAvatar from '../components/AIAvatar';
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

const UserView: React.FC<UserViewProps> = ({ userId, onSwitchUser }) => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  const [nickname, setNickname] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInputActive, setIsInputActive] = useState<boolean>(false); // NEW: 入力アクティブ状態
  const [isConsultationReady, setIsConsultationReady] = useState<boolean>(false);
  const [aiName, setAiName] = useState<string>('');
  const [aiType, setAiType] = useState<AIType>('dog');
  const [aiAvatarKey, setAiAvatarKey] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const [backCount, setBackCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);

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

  useEffect(() => {
    const user = getUserById(userId);
    setNickname(user?.nickname || userId);
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
    setAiType(type);
    setAiAvatarKey(avatarKey);
    setAiName(assistant.nameOptions[Math.floor(Math.random() * assistant.nameOptions.length)]);
    
    startTimeRef.current = Date.now();
    resetOnboarding(false);
    setView('chatting');
  }, []);

  const resetOnboarding = (isManualReset: boolean = true) => {
    if (isManualReset) setResetCount(prev => prev + 1);
    const greetingText = `こんにちは。あなたのこれからの歩みを一緒に考えるパートナーです。話したくないことは飛ばしても大丈夫。あなたのペースで、今のことを少しだけ教えてください。\n\nまず、**今のあなたの「心の状況」に近いものはどれですか？**`;
    setMessages([{ author: MessageAuthor.AI, text: greetingText }]);
    setOnboardingStep(1);
    setUserProfile({ lifeRoles: [] });
    setOnboardingHistory([]);
    setSelectedRoles([]);
    setHasError(false);
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
    setHasError(false);
  };

  const finalizeAiTurn = async (currentMessages: ChatMessage[]) => {
      setIsLoading(false);
      try {
        const response = await generateSuggestions(currentMessages);
        if (response?.suggestions?.length) setSuggestions(response.suggestions);
      } catch (e) {
        console.warn("Suggestions failed", e);
      }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setHasError(false);
    const userMessage: ChatMessage = { author: MessageAuthor.USER, text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setSuggestions([]);
    setIsLoading(true);

    if (onboardingStep >= 1 && onboardingStep <= 5) {
        await processOnboarding(text, newMessages);
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
          if (value.text) {
            aiResponseText += value.text;
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].text = aiResponseText;
                return updated;
            });
          }
      }
      setIsConsultationReady(true);
      await finalizeAiTurn([...newMessages, { author: MessageAuthor.AI, text: aiResponseText }]);
    } catch (error) {
      setHasError(true);
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: "通信エラーが発生しました。" }]);
      setIsLoading(false);
    }
  };

  const processOnboarding = async (choice: string, history: ChatMessage[]) => {
    setOnboardingHistory(prev => [...prev, { ...userProfile }]);
    await new Promise(r => setTimeout(r, 400));

    let nextText = '';
    let nextStep = onboardingStep + 1;

    if (onboardingStep === 1) {
        setUserProfile(prev => ({ ...prev, stage: choice }));
        nextText = `ありがとうございます。次に、あなたの**年代**を教えてください。`;
    } 
    else if (onboardingStep === 2) {
        setUserProfile(prev => ({ ...prev, age: choice }));
        nextText = `差し支えなければ、**性別**を教えていただけますか？`;
    }
    else if (onboardingStep === 3) {
        setUserProfile(prev => ({ ...prev, gender: choice }));
        nextText = `今、あなたの**エネルギーはどこに多く使われていますか？**（複数選択可）`;
    }
    else if (onboardingStep === 4) {
        const roles = choice.split('、');
        setUserProfile(prev => ({ ...prev, lifeRoles: roles }));
        nextText = `準備が整いました。本日は**どのようなことをお話ししたいですか？**`;
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
        await startActualConsultation(history, finalProfile);
        return;
    }

    setMessages([...history, { author: MessageAuthor.AI, text: nextText }]);
    setOnboardingStep(nextStep);
    setIsLoading(false);
  };

  const startActualConsultation = async (history: ChatMessage[], profile: UserProfile) => {
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
      setIsConsultationReady(true);
      await finalizeAiTurn([...history, { author: MessageAuthor.AI, text: aiResponseText }]);
    } catch (e) { 
      setHasError(true);
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: "接続に失敗しました。" }]);
      setIsLoading(false);
    }
  };

  const renderOnboardingUI = () => {
    if (isLoading) return null;
    
    return (
      <div className="flex flex-col">
        {onboardingStep === 1 && (
          <div className="grid grid-cols-1 gap-2 p-4">
            {STAGES.map(s => (
              <button key={s.id} onClick={() => handleSendMessage(s.label)} className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-50 transition-all">
                <p className="font-bold text-slate-800">{s.label}</p>
                <p className="text-xs text-slate-500">{s.sub}</p>
              </button>
            ))}
          </div>
        )}
        {onboardingStep === 2 && (
          <div className="flex gap-2 overflow-x-auto p-4 pb-2 scrollbar-hide">
            {AGES.map(a => (
              <button key={a} onClick={() => handleSendMessage(a)} className="flex-shrink-0 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-sky-50 text-sm font-semibold text-slate-700">
                {a}
              </button>
            ))}
          </div>
        )}
        {onboardingStep === 3 && (
          <div className="flex flex-wrap gap-2 p-4">
            {['男性', '女性', 'その他', '回答しない'].map(g => (
              <button key={g} onClick={() => handleSendMessage(g)} className="px-6 py-2 rounded-full border border-slate-200 bg-white hover:bg-sky-50 font-semibold text-slate-700">
                {g}
              </button>
            ))}
          </div>
        )}
        {onboardingStep === 4 && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {LIFE_ROLES.map(r => (
                <button 
                  key={r.id} 
                  onClick={() => setSelectedRoles(prev => prev.includes(r.label) ? prev.filter(x => x !== r.label) : [...prev, r.label])}
                  className={`px-4 py-2 rounded-full border transition-all flex items-center gap-2 font-semibold ${
                    selectedRoles.includes(r.label) ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{r.icon}</span><span>{r.label}</span>
                </button>
              ))}
            </div>
            <button disabled={selectedRoles.length === 0} onClick={() => handleSendMessage(selectedRoles.join('、'))} className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-md disabled:bg-slate-300">決定</button>
          </div>
        )}
        {onboardingStep === 5 && (
          <div className="flex flex-wrap gap-2 p-4">
            {['方向性の迷い', '適性を知りたい', '現状を変えたい', '不安を聞いてほしい'].map(c => (
              <button key={c} onClick={() => handleSendMessage(c)} className="px-6 py-2 rounded-full border border-slate-200 bg-white hover:bg-sky-50 font-semibold text-slate-700">
                {c}
              </button>
            ))}
          </div>
        )}
        
        {onboardingStep >= 1 && onboardingStep <= 5 && (
          <div className="flex justify-center gap-6 pb-4 text-xs font-semibold text-slate-400">
            {onboardingStep > 1 && (
              <button onClick={handleGoBack} className="hover:text-sky-500 transition-colors">一つ前の質問に戻る</button>
            )}
            <button onClick={() => resetOnboarding(true)} className="hover:text-sky-500 transition-colors">最初からやり直す</button>
          </div>
        )}
        
        {onboardingStep >= 6 && (
           <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSendMessage} isInputActive={isInputActive} />
        )}
      </div>
    );
  };

  const handleGenerateSummary = () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    generateSummary(messages, aiType, aiName, userProfile)
      .then(setSummary).catch(() => setSummary("エラーが発生しました。")).finally(() => setIsSummaryLoading(false));
  };

  const finalizeAndSave = (conversation: StoredConversation) => {
      const storedDataRaw = localStorage.getItem('careerConsultations');
      let currentAllConversations = storedDataRaw ? JSON.parse(storedDataRaw).data || [] : [];
      let updated = [...currentAllConversations, conversation];
      localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updated }));
      setUserConversations(updated.filter((c:any) => c.userId === userId));
      setView('dashboard'); setMessages([]); setOnboardingStep(0);
  };

  return (
    <div className={`flex flex-col bg-slate-100 ${view === 'chatting' ? 'h-full' : 'min-h-[100dvh]'}`}>
      {view === 'chatting' && <Header showBackButton={true} onBackClick={() => setIsInterruptModalOpen(true)} />}
      <main className={`flex-1 flex flex-col items-center ${view === 'chatting' ? 'p-4 md:p-6 overflow-hidden' : 'p-0 sm:p-4 md:p-6'}`}>
        {view === 'dashboard' ? <UserDashboard conversations={userConversations} onNewChat={() => setView('avatarSelection')} onResume={(c) => { setMessages(c.messages); setAiName(c.aiName); setAiType(c.aiType); setAiAvatarKey(c.aiAvatar); setView('chatting'); setOnboardingStep(6); }} userId={userId} nickname={nickname} onSwitchUser={onSwitchUser} /> :
         view === 'avatarSelection' ? <AvatarSelectionView onSelect={handleAvatarSelected} /> :
         <div className="w-full max-w-7xl h-full flex flex-row gap-6">
            <div className="hidden lg:flex w-[400px] h-full flex-shrink-0"><AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} /></div>
            <div className="flex-1 h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <ChatWindow messages={messages} isLoading={isLoading} onEditMessage={() => {}} />
              <div className="flex-shrink-0 flex flex-col bg-white border-t border-slate-200">
                  {renderOnboardingUI()}
                  <ChatInput 
                    onSubmit={handleSendMessage} 
                    isLoading={isLoading} 
                    isEditing={false} 
                    initialText={''} 
                    onCancelEdit={() => {}} 
                    onStateChange={setIsInputActive} // 入力状態の同期
                  />
                  {onboardingStep >= 6 && <ActionFooter isReady={isConsultationReady} onSummarize={handleGenerateSummary} onInterrupt={() => setIsInterruptModalOpen(true)} />}
              </div>
            </div>
         </div>}
      </main>
      <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summary} isLoading={isSummaryLoading} onRevise={() => {}} onFinalize={() => finalizeAndSave({ id: Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary, date: new Date().toISOString(), status: 'completed' })} />
      <InterruptModal isOpen={isInterruptModalOpen} onSaveAndInterrupt={() => finalizeAndSave({ id: Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary: '中断', date: new Date().toISOString(), status: 'interrupted' })} onExitWithoutSaving={() => setView('dashboard')} onContinue={() => setIsInterruptModalOpen(false)} />
    </div>
  );
};

export default UserView;
