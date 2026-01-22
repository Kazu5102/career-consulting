
// components/ChatInput.tsx - v2.38 - Enforced Sync & Clear
import React, { useState, useEffect, useRef } from 'react';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SaveIcon from './icons/SaveIcon';
import EditIcon from './icons/EditIcon';

// Manually define types for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isEditing: boolean;
  initialText: string; 
  onCancelEdit: () => void;
  onStateChange?: (state: { isFocused: boolean; isTyping: boolean; isSilent: boolean; currentDraft: string }) => void;
}

const MAX_TEXTAREA_HEIGHT = 128;
const SILENCE_TIMEOUT = 3000; 
const TYPING_ACTIVE_TIMEOUT = 800; 

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading, isEditing, initialText, onCancelEdit, onStateChange }) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [isActiveTyping, setIsActiveTyping] = useState(false); 
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 重要: 親コンポーネントからの強制リセット命令(空文字)を確実に反映
  useEffect(() => {
    setText(initialText);
  }, [initialText]);
  
  // 静止判定ロジック
  useEffect(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    if (!isFocused || isLoading || isEditing || isListening || isActiveTyping) {
      setIsSilent(false);
      return;
    }

    silenceTimerRef.current = setTimeout(() => {
      setIsSilent(true);
    }, SILENCE_TIMEOUT);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isFocused, text, isLoading, isEditing, isListening, isActiveTyping]);

  // 親コンポーネントへの状態通知
  useEffect(() => {
    onStateChange?.({
      isFocused,
      isTyping: isActiveTyping || isListening, 
      isSilent,
      currentDraft: text
    });
  }, [isFocused, isActiveTyping, isListening, isSilent, text, onStateChange]);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      if (scrollHeight > MAX_TEXTAREA_HEIGHT) {
        textarea.style.height = `${MAX_TEXTAREA_HEIGHT}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setIsSilent(false);
    
    setIsActiveTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
        setIsActiveTyping(false);
    }, TYPING_ACTIVE_TIMEOUT);
  };

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        try {
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = false;
            recognition.lang = 'ja-JP';
            recognition.interimResults = false;
            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              setText(prev => (prev ? prev + ' ' : '') + transcript);
            };
            recognition.onerror = (event) => {
              setMicError('音声認識エラーが発生しました。');
              setIsListening(false);
            };
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        } catch (err) {
            setMicError('音声入力の初期化に失敗しました。');
            return;
        }
      } else {
        setMicError('お使いのブラウザは音声入力に対応していません。');
        return;
      }
    }
    
    try {
        recognitionRef.current?.start();
        setIsListening(true);
    } catch (e) {
        setIsListening(false);
    }
  };

  const handleTextSubmit = () => {
    const trimmedText = text.trim();
    if (!trimmedText || isLoading) return;
    
    onSubmit(trimmedText);
    
    // 送信直後に内部ステートを確実にクリア
    setText('');
    setIsActiveTyping(false);
    setIsSilent(false);
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
