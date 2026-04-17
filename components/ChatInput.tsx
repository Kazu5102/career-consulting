
// components/ChatInput.tsx - v4.61 - 2026-04-17 - API loop fix and fallback restoration
import React, { useState, useEffect, useRef } from 'react';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SaveIcon from './icons/SaveIcon';
import EditIcon from './icons/EditIcon';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isEditing: boolean;
  initialText: string; 
  clearSignal?: number; // 確実にクリアするための信号
  onCancelEdit: () => void;
  onStateChange?: (state: { isFocused: boolean; isTyping: boolean; isSilent: boolean; isDeepSilent: boolean; currentDraft: string }) => void;
}

const MAX_TEXTAREA_HEIGHT = 128;
const SILENCE_TIMEOUT = 600; // 通常入力領域（ローカル辞書検索用）
const DEEP_SILENCE_TIMEOUT = 2500; // 内省深堀介入領域（API通信用: T待機時間）

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading, isEditing, initialText, clearSignal = 0, onCancelEdit, onStateChange }) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [isDeepSilent, setIsDeepSilent] = useState(false);
  const [isActiveTyping, setIsActiveTyping] = useState(false); 
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deepSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);

  // clearSignalが更新されたら問答無用でクリア
  useEffect(() => {
    setText('');
    setIsActiveTyping(false);
    setIsSilent(false);
    setIsDeepSilent(false);
  }, [clearSignal]);

  // 編集開始時などの同期
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);
  
  // 静止判定ロジックの改善（領域分離アルゴリズム）
  useEffect(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (deepSilenceTimerRef.current) clearTimeout(deepSilenceTimerRef.current);
    
    // 静止判定の対象外
    if (!isFocused || isLoading || isEditing || isListening || isActiveTyping) {
      setIsSilent(false);
      setIsDeepSilent(false);
      return;
    }

    // 第一領域：通常入力領域判定（0.6秒）
    silenceTimerRef.current = setTimeout(() => {
      setIsSilent(true);
    }, SILENCE_TIMEOUT);

    // 第二領域：内省深堀介入領域判定（待機時間T=2.5秒）
    deepSilenceTimerRef.current = setTimeout(() => {
      setIsDeepSilent(true);
    }, DEEP_SILENCE_TIMEOUT);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (deepSilenceTimerRef.current) clearTimeout(deepSilenceTimerRef.current);
    };
  }, [isFocused, text, isLoading, isEditing, isListening, isActiveTyping]);

  // 状態の外部通知
  useEffect(() => {
    onStateChange?.({
      isFocused,
      isTyping: isActiveTyping || isListening, 
      isSilent,
      isDeepSilent,
      currentDraft: text
    });
  }, [isFocused, isActiveTyping, isListening, isSilent, isDeepSilent, text, onStateChange]);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setIsSilent(false);
    setIsDeepSilent(false);
    
    setIsActiveTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
        setIsActiveTyping(false);
    }, 800);
  };

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      try {
          const recognition = new SpeechRecognitionAPI();
          recognition.continuous = false;
          recognition.lang = 'ja-JP';
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setText(prev => (prev ? prev + ' ' : '') + transcript);
          };
          recognition.onerror = () => {
            setMicError('音声認識エラーが発生しました。');
            setIsListening(false);
          };
          recognition.onend = () => setIsListening(false);
          recognitionRef.current = recognition;
          recognition.start();
          setIsListening(true);
      } catch (err) {
          setMicError('音声入力の初期化に失敗しました。');
      }
    } else {
      setMicError('お使いのブラウザは音声入力に対応していません。');
    }
  };

  const handleTextSubmit = () => {
    const trimmedText = text.trim();
    if (!trimmedText || isLoading) return;
    onSubmit(trimmedText);
    // 内部でも念の為クリア
    setText('');
    setIsActiveTyping(false);
    setIsSilent(false);
    setIsDeepSilent(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  return (
    <div className="p-4">
       {isEditing && (
        <div className="text-sm text-slate-600 mb-2 px-2 flex justify-between items-center animate-pulse">
          <span className="font-semibold flex items-center gap-2"><EditIcon /> メッセージを編集中...</span>
          <button type="button" onClick={onCancelEdit} className="font-semibold px-2 py-1 rounded-md text-sky-600 hover:bg-sky-100 transition-colors">
            キャンセル
          </button>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); handleTextSubmit(); }} className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setIsSilent(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "AIが応答中です..." : isListening ? "お話しください..." : isEditing ? "メッセージを編集..." : "メッセージを入力してください..."}
          disabled={isLoading || isListening}
          className="flex-1 w-full px-4 py-3 bg-slate-100 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200 resize-none"
          rows={1}
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading || isEditing}
          className={`flex-shrink-0 w-12 h-12 rounded-full text-white flex items-center justify-center transition-colors duration-200 ${
            isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-sky-600 hover:bg-sky-700'
          } disabled:bg-slate-400 disabled:cursor-not-allowed`}
        >
          <MicrophoneIcon />
        </button>
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center transition-colors duration-200 hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isEditing ? <SaveIcon /> : <SendIcon />}
        </button>
      </form>
      {micError && <p className="text-xs text-red-500 mt-1.5 px-4">{micError}</p>}
    </div>
  );
};

export default ChatInput;
