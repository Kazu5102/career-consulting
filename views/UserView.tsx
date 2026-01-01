
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, StoredData, STORAGE_VERSION, AIType } from '../types';
import { getStreamingChatResponse, generateSummary, reviseSummary, generateSuggestions } from '../services/index';
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

// Onboarding stages
const STAGE_GROWTH = '自分を育てている時期（成長期）';
const STAGE_EXPLORATION = 'これからの道を探している時期（探索期）';
const STAGE_ESTABLISHMENT = '今の場所で力を発揮・試行錯誤している時期（確立期）';
const STAGE_MAINTENANCE = '経験を活かし、次を見据えている時期（維持期）';
const STAGE_LIBERATION = '自分らしい自由な生き方を探す時期（解放期）';

const UserView: React.FC<UserViewProps> = ({ userId, onSwitchUser }) => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  const [nickname, setNickname] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConsultationReady, setIsConsultationReady] = useState<boolean>(false);
  const [aiName, setAiName] = useState<string>('');
  const [aiType, setAiType] = useState<AIType>('dog');
  const [aiAvatarKey, setAiAvatarKey] = useState<string>('');
  const [editingState, setEditingState] = useState<{ index: number; text: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Onboarding states
  const [onboardingStep, setOnboardingStep] = useState<number>(0); // 0: none, 1-4: steps, 5: completed
  const [userProfile, setUserProfile] = useState<{ stage?: string; gender?: string; complaint?: string }>({});

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isInterruptModalOpen, setIsInterruptModalOpen] = useState<boolean>(false);
  const [resumingConversationId, setResumingConversationId] = useState<number | null>(null);


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
            
            if (allConversations.length > 0) {
                 convs = allConversations.filter(c => c.userId === userId).map(c => ({...c, status: c.status || 'completed'}));
            }
        } catch(e) { console.error(e); }
    }
    setUserConversations(convs);
    setView(convs.length > 0 ? 'dashboard' : 'avatarSelection');
  }, [userId]);

  const saveConversations = (allConversations: StoredConversation[]) => {
      localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: allConversations }));
  };

  const handleNewChat = useCallback(() => {
    setResumingConversationId(null);
    setMessages([]);
    setOnboardingStep(0);
    setUserProfile({});
    setView('avatarSelection');
  }, []);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    const { type, avatarKey } = selection;
    const assistant = ASSISTANTS.find(a => a.id === avatarKey);
    if (!assistant) return;

    setAiType(type);
    setAiAvatarKey(avatarKey);
    const selectedName = assistant.nameOptions[Math.floor(Math.random() * assistant.nameOptions.length)];
    setAiName(selectedName);

    // STEP 1 & 2: Safety & Career Stage
    let greetingText = '';
    if (type === 'human') {
      greetingText = `こんにちは。AIキャリアコンサルタントの${selectedName}です。\n\n本題に入る前に、大切なことをお伝えしますね。私はあなたのキャリア（生き方や働き方）を一緒に考えるパートナーです。ここで話す内容は統計的な分析とアドバイスのためだけに使用され、外部に漏れることはありません。答えにくい質問はスキップしても大丈夫ですので、あなたのペースで進めていきましょう。\n\n**まずは、今の${nickname}さんはどのステージに近いと感じますか？**`;
    } else {
      greetingText = `ワンワン！ボク、キャリア相談わんこの${selectedName}だワン！キミに会えて嬉しいワン！\n\n最初にお約束だワン。ボクとのお話は、キミとボクだけの秘密にするから安心してほしいワン。答えにくいことは言わなくても大丈夫だワン！ボクと一緒に、キミのペースでゆっくりお話ししようワン。\n\n**今のキミは、自分の人生のどのあたりを歩いていると感じるかな？**`;
    }
    
    setMessages([{ author: MessageAuthor.AI, text: greetingText }]);
    setOnboardingStep(1); // Step 2 (Stage Selection)
    setSuggestions([STAGE_GROWTH, STAGE_EXPLORATION, STAGE_ESTABLISHMENT, STAGE_MAINTENANCE, STAGE_LIBERATION]);
    setView('chatting');
  }, [nickname]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { author: MessageAuthor.USER, text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setSuggestions([]);

    // Onboarding Logic
    if (onboardingStep >= 1 && onboardingStep <= 3) {
      processOnboarding(text, newMessages);
      return;
    }

    // Regular Chatting
    setIsLoading(true);
    try {
      // Pass userProfile to Gemini API via proxy
      const stream = await (getStreamingChatResponse as any)(newMessages, aiType, aiName, userProfile);
      if (!stream) throw new Error();
      
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
      setIsConsultationReady(newMessages.filter(m => m.author === MessageAuthor.USER).length >= 1);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: "エラーが発生しました。" }]);
    } finally {
      setIsLoading(false);
      // Generate standard suggestions
      const response = await generateSuggestions(newMessages);
      if (response?.suggestions?.length) setSuggestions(response.suggestions);
    }
  };

  const processOnboarding = (choice: string, history: ChatMessage[]) => {
    setIsLoading(true);
    setTimeout(() => {
      let nextText = '';
      let nextSuggestions: string[] = [];
      let nextStep = onboardingStep + 1;

      if (onboardingStep === 1) {
        // After Stage selection -> STEP 3: Gender
        setUserProfile(prev => ({ ...prev, stage: choice }));
        const isGrowth = choice === STAGE_GROWTH;
        nextText = aiType === 'human' 
          ? `ありがとうございます。より${nickname}さんに合った情報をお伝えするため、差し支えなければ性別（性自認）を教えてください。`
          : `教えてくれてありがとうワン！次はね、もっとキミにぴったりのアドバイスをするために、キミの性別を教えてほしいワン。`;
        
        nextSuggestions = isGrowth 
          ? ['男の子', '女の子', '自分は自分', 'ひみつ']
          : ['男性', '女性', 'その他', '回答しない'];
      } 
      else if (onboardingStep === 2) {
        // After Gender selection -> STEP 4: Complaint
        setUserProfile(prev => ({ ...prev, gender: choice }));
        nextText = aiType === 'human'
          ? `承知いたしました。それでは、**本日はどのようなことを一番お話ししたいですか？**`
          : `わかったワン！大切にするワン。\n\n**それじゃあ、今日はボクにどんなことをお話ししたいかな？**`;
        
        const stage = userProfile.stage;
        if (stage === STAGE_GROWTH) {
          nextSuggestions = ['学校や居場所について悩んでいる', '自分の「好きなこと」を見つけたい', '将来がなんとなく不安'];
        } else if (stage === STAGE_MAINTENANCE || stage === STAGE_LIBERATION) {
          nextSuggestions = ['これまでの経験をどう活かすか', 'セカンドキャリアの設計', '社会との繋がり直し'];
        } else {
          nextSuggestions = ['自分に向いている仕事を知りたい', '仕事と私生活の両立について', '転職やキャリアアップを考えている'];
        }
      }
      else if (onboardingStep === 3) {
        // After Complaint selection -> Completed
        setUserProfile(prev => ({ ...prev, complaint: choice }));
        nextStep = 5; // Finish onboarding
        startActualConsultation(choice, history);
        return;
      }

      setMessages([...history, { author: MessageAuthor.AI, text: nextText }]);
      setOnboardingStep(nextStep);
      setSuggestions(nextSuggestions);
      setIsLoading(false);
    }, 600);
  };

  const startActualConsultation = async (complaint: string, history: ChatMessage[]) => {
    setIsLoading(true);
    try {
      const finalProfile = { ...userProfile, complaint };
      const stream = await (getStreamingChatResponse as any)(history, aiType, aiName, finalProfile);
      let aiResponseText = '';
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);
      const reader = stream!.getReader();
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
      setOnboardingStep(5);
      setIsConsultationReady(true);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSuggestions([]);
    handleSendMessage(suggestion);
  };

  // Remaining functions (handleBackToDashboard, handleGenerateSummary etc.) remain the same
  const handleBackToDashboard = () => {
    if (messages.length > 1 && !isLoading) setIsInterruptModalOpen(true);
    else { setView('dashboard'); setMessages([]); }
  };

  const handleGenerateSummary = () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    generateSummary(messages, aiType, aiName)
      .then(setSummary).catch(() => setSummary("エラー")).finally(() => setIsSummaryLoading(false));
  };

  const finalizeAndSave = (conversation: StoredConversation) => {
      try {
        const storedDataRaw = localStorage.getItem('careerConsultations');
        let currentAllConversations = storedDataRaw ? JSON.parse(storedDataRaw).data || [] : [];
        let updated = resumingConversationId ? currentAllConversations.map((c:any) => c.id === resumingConversationId ? conversation : c) : [...currentAllConversations, conversation];
        saveConversations(updated);
        setUserConversations(updated.filter((c:any) => c.userId === userId));
        setView('dashboard'); setMessages([]); setSummary(''); setResumingConversationId(null);
        return true;
      } catch (e) { return false; }
  };

  const handleFinalizeAndSave = () => {
      const newConversation: StoredConversation = {
        id: resumingConversationId || Date.now(),
        userId, aiName, aiType, aiAvatar: aiAvatarKey,
        messages, summary, date: new Date().toISOString(), status: 'completed',
      };
      if (finalizeAndSave(newConversation)) {
          setIsSummaryModalOpen(false);
          alert('保存されました。');
      }
  };

  const renderContent = () => {
    switch(view) {
      case 'dashboard':
          return <UserDashboard conversations={userConversations} onNewChat={handleNewChat} onResume={(c) => { setMessages(c.messages); setAiName(c.aiName); setAiType(c.aiType); setAiAvatarKey(c.aiAvatar); setResumingConversationId(c.id); setView('chatting'); setOnboardingStep(5); }} userId={userId} nickname={nickname} onSwitchUser={onSwitchUser} />;
      case 'avatarSelection':
        return <AvatarSelectionView onSelect={handleAvatarSelected} />;
      case 'chatting':
        return (
           <div className="w-full max-w-7xl h-full flex flex-row gap-6">
            <div className="hidden lg:flex w-[400px] h-full flex-shrink-0">
              <AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} />
            </div>
            <div className="flex-1 h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <ChatWindow messages={messages} isLoading={isLoading} onEditMessage={() => {}} />
              <div className="flex-shrink-0 flex flex-col bg-white border-t border-slate-200">
                  <SuggestionChips suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                  <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} isEditing={false} initialText={''} onCancelEdit={() => {}} />
                  {messages.length > 1 && onboardingStep === 5 && (
                     <ActionFooter isReady={isConsultationReady} onSummarize={handleGenerateSummary} onInterrupt={() => setIsInterruptModalOpen(true)} />
                  )}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col bg-slate-100 ${view === 'chatting' ? 'h-full' : 'min-h-full'}`}>
      {view === 'chatting' && <Header showBackButton={true} onBackClick={handleBackToDashboard} />}
      <main className={`flex-1 flex flex-col items-center ${view === 'chatting' ? 'p-4 md:p-6 overflow-hidden' : 'p-0 sm:p-4 md:p-6 justify-start'}`}>{renderContent()}</main>
      <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summary} isLoading={isSummaryLoading} onRevise={() => {}} onFinalize={handleFinalizeAndSave} />
      <InterruptModal isOpen={isInterruptModalOpen} onSaveAndInterrupt={() => finalizeAndSave({ id: resumingConversationId || Date.now(), userId, aiName, aiType, aiAvatar: aiAvatarKey, messages, summary: '中断', date: new Date().toISOString(), status: 'interrupted' })} onExitWithoutSaving={() => { setView('dashboard'); setMessages([]); }} onContinue={() => setIsInterruptModalOpen(false)} />
    </div>
  );
};

export default UserView;
