
// views/UserView.tsx - v4.11 - Resilience Core (Standard State Control)
import React, { useState, useCallback, useEffect } from 'react';
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

const GREETINGS = {
  human: (name: string) => `[HAPPY] こんにちは、${name}です。今のあなたの状況を教えていただけますか？`,
  dog: (name: string) => `[HAPPY] こんにちは、${name}だワン！今のキミはどんな感じかな？`
};

const UserView: React.FC<UserViewProps> = ({ userId, onSwitchUser }) => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  const [nickname, setNickname] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConsultationReady, setIsConsultationReady] = useState<boolean>(false);
  const [isCompleteReady, setIsCompleteReady] = useState<boolean>(false); 
  const [aiName, setAiName] = useState<string>('');
  const [aiType, setAiType] = useState<AIType>('dog');
  const [aiAvatarKey, setAiAvatarKey] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState<boolean>(false); 
  const [hasError, setHasError] = useState<boolean>(false);
  const [aiMood, setAiMood] = useState<Mood>('neutral');
  const [onboardingStep, setOnboardingStep] = useState<number>(0); 
  const [userProfile, setUserProfile] = useState<UserProfile>({ lifeRoles: [] });

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isInterruptModalOpen, setIsInterruptModalOpen] = useState<boolean>(false);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const user = getUserById(userId);
    setNickname(user?.nickname || userId);
    const allDataRaw = localStorage.getItem('careerConsultations');
    let convs: StoredConversation[] = [];
    if (allDataRaw) {
        try {
            const parsed = JSON.parse(allDataRaw);
            convs = (parsed.data || parsed).filter((c:any) => c.userId === userId);
        } catch(e) { }
    }
    setUserConversations(convs);
    setView(convs.length > 0 ? 'dashboard' : 'avatarSelection');
  }, [userId]);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    const assistant = ASSISTANTS.find(a => a.id === selection.avatarKey);
    if (!assistant) return;
    setAiType(selection.type);
    setAiAvatarKey(selection.avatarKey);
    const name = assistant.nameOptions[0];
    setAiName(name);
    setMessages([{ author: MessageAuthor.AI, text: GREETINGS[selection.type](name) }]);
    setAiMood('happy');
    setOnboardingStep(1);
    setView('chatting');
  }, []);

  const triggerSuggestions = async (currentMessages: ChatMessage[]) => {
      if (onboardingStep < 6 || isLoading) return;
      try {
        const response = await generateSuggestions(currentMessages);
        if (response?.suggestions?.length) {
            setSuggestions(response.suggestions);
            setSuggestionsVisible(true);
        }
      } catch (e) { }
  };

  const finalizeAiTurn = async (currentMessages: ChatMessage[]) => {
      setIsLoading(false);
      const lastAiText = currentMessages[currentMessages.length - 1]?.text || "";
      
      if (lastAiText.includes('[HAPPY]')) setAiMood('happy');
      else if (lastAiText.includes('[CURIOUS]')) setAiMood('curious');
      else if (lastAiText.includes('[THINKING]')) setAiMood('thinking');
      else if (lastAiText.includes('[REASSURE]')) setAiMood('reassure');
      else setAiMood('neutral');

      setIsConsultationReady(currentMessages.length >= 4);
      setIsCompleteReady(lastAiText.includes('[COMPLETE_READY]'));
      await triggerSuggestions(currentMessages);
  };

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isLoading) return;
    
    setIsLoading(true);
    setHasError(false);
    const newMessages = [...messages, { author: MessageAuthor.USER, text: trimmedText }];
    setMessages(newMessages);
    setSuggestionsVisible(false);
    setAiMood('thinking');

    if (onboardingStep >= 1 && onboardingStep <= 5) {
        await processOnboarding(trimmedText, newMessages);
        return;
    }

    try {
      const stream = await getStreamingChatResponse(newMessages, aiType, aiName, userProfile);
      if (!stream) throw new Error("接続に失敗しました。");
      let aiResponseText = '';
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);
      const reader = stream.getReader();
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value.error) throw new Error(value.error.message);
          if (value.text) {
            aiResponseText += value.text;
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].text = aiResponseText;
                return updated;
            });
          }
      }
      await finalizeAiTurn([...newMessages, { author: MessageAuthor.AI, text: aiResponseText }]);
    } catch (error: any) {
      setHasError(true);
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: `エラー: ${error.message}` }]);
      setIsLoading(false);
      setAiMood('neutral');
    }
  };

  const processOnboarding = async (choice: string, history: ChatMessage[]) => {
    await new Promise(r => setTimeout(r, 600));
    let nextText = '';
    const isDog = aiType === 'dog';

    if (onboardingStep === 1) {
        setUserProfile(prev => ({ ...prev, stage: choice }));
        nextText = isDog ? "[HAPPY] ありがとうワン！次はあなたの年代を教えてほしいワン。" : "[HAPPY] ありがとうございます。次に、ご自身の年代を教えていただけますか。";
        setMessages([...history, { author: MessageAuthor.AI, text: nextText }]);
        setOnboardingStep(2);
        setIsLoading(false);
        setAiMood('happy');
    } else if (onboardingStep === 2) {
        setUserProfile(prev => ({ ...prev, age: choice }));
        nextText = isDog ? "[REASSURE] わかったワン。最後に、今日はどのようなことでお悩みかな？自由に話してほしいワン！" : "[REASSURE] 承知いたしました。では、本日はどのようなことについてお話ししてみたいですか？";
        setMessages([...history, { author: MessageAuthor.AI, text: nextText }]);
        setOnboardingStep(5);
        setIsLoading(false);
        setAiMood('reassure');
    } else if (onboardingStep === 5) {
        setUserProfile(prev => ({ ...prev, complaint: choice }));
        setOnboardingStep(6);
        await startActualConsultation(history, { ...userProfile, complaint: choice });
    }
  };

  const startActualConsultation = async (history: ChatMessage[], profile: UserProfile) => {
    try {
      const stream = await getStreamingChatResponse(history, aiType, aiName, profile);
      if (!stream) throw new Error("通信に失敗しました。");
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
      await finalizeAiTurn([...history, { author: MessageAuthor.AI, text: aiResponseText }]);
    } catch (e) {
      setHasError(true);
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: "接続が不安定です。再度お試しください。" }]);
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = () => {
    if (isLoading) return;
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    generateSummary(messages, aiType, aiName, userProfile)
      .then(setSummary).catch(() => setSummary("要約生成中にエラーが発生しました。")).finally(() => setIsSummaryLoading(false));
  };

  const finalizeAndSave = async (conversation: StoredConversation) => {
      const stored = localStorage.getItem('careerConsultations');
      const current = stored ? JSON.parse(stored).data || [] : [];
      localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: [...current, conversation] }));
      window.location.reload();
  };

  return (
    <div className={`flex flex-col bg-slate-100 ${view === 'chatting' ? 'h-full overflow-hidden' : 'min-h-[100dvh]'} relative`}>
      {view === 'chatting' && <Header showBackButton={true} onBackClick={() => setIsInterruptModalOpen(true)} />}
      
      {view === 'chatting' && (
        <div className="fixed top-20 right-4 z-[100] transition-all">
           <div className={`rounded-full border-4 border-white shadow-2xl bg-slate-800 overflow-hidden w-16 h-16 sm:w-24 sm:h-24 ${isLoading ? 'animate-pulse ring-4 ring-emerald-500 shadow-emerald-200' : ''}`}>
             <AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} mood={aiMood} isCompact={true} />
           </div>
        </div>
      )}

      <main className={`flex-1 flex flex-col items-center ${view === 'chatting' ? 'p-4 h-full overflow-hidden' : 'p-6'}`}>
        {view === 'dashboard' ? <UserDashboard conversations={userConversations} onNewChat={() => setView('avatarSelection')} onResume={() => {}} userId={userId} nickname={nickname} pin="0000" onSwitchUser={onSwitchUser} /> :
         view === 'avatarSelection' ? <AvatarSelectionView onSelect={handleAvatarSelected} /> :
         view === 'referral' ? <ReferralView onBack={() => setView('dashboard')} onContinueChat={() => setView('chatting')} onSearchExperts={() => setView('expertMatching')} /> :
         view === 'expertMatching' ? <ExpertMatchingView onBack={() => setView('dashboard')} /> :
         <div className="w-full max-w-4xl h-full flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
              <ChatWindow messages={messages} isLoading={isLoading} onEditMessage={() => {}} />
              <div className="flex-shrink-0 flex flex-col bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                  {onboardingStep >= 6 && !isLoading && <InductionChip isVisible={isCompleteReady} onSummarize={handleGenerateSummary} onDeepDive={() => handleSendMessage("もう少し深掘りしてお話ししたいです")} />}
                  {onboardingStep >= 6 && <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSendMessage} isVisible={suggestionsVisible && !isLoading} />}
                  
                  {onboardingStep < 6 && onboardingStep > 0 && (
                      <div className="p-4 flex flex-wrap gap-2 bg-slate-50 border-b animate-in fade-in duration-500">
                          {onboardingStep === 1 ? STAGES.map(s => <button key={s.id} onClick={() => handleSendMessage(s.label)} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs font-bold shadow-sm">{s.label}</button>) :
                           onboardingStep === 2 ? ['10代', '20代', '30代', '40代', '50代', '60代以上'].map(a => <button key={a} onClick={() => handleSendMessage(a)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-full hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs font-bold shadow-sm">{a}</button>) : null}
                      </div>
                  )}

                  <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} isEditing={false} initialText="" onCancelEdit={() => {}} />
                  {onboardingStep >= 6 && <ActionFooter isReady={isConsultationReady} onSummarize={handleGenerateSummary} onInterrupt={() => setIsInterruptModalOpen(true)} />}
              </div>
         </div>}
      </main>

      <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summary} isLoading={isSummaryLoading} onRevise={() => {}} onFinalize={() => finalizeAndSave({ id: Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary, date: new Date().toISOString(), status: 'completed' })} />
      <InterruptModal isOpen={isInterruptModalOpen} onSaveAndInterrupt={() => finalizeAndSave({ id: Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary: '中断', date: new Date().toISOString(), status: 'interrupted' })} onExitWithoutSaving={() => setView('dashboard')} onContinue={() => setIsInterruptModalOpen(false)} />
      <CrisisNoticeModal isOpen={isCrisisModalOpen} onClose={() => setIsCrisisModalOpen(false)} />
    </div>
  );
};

export default UserView;
