

import React, { useState, useEffect, useRef } from 'react';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SaveIcon from './icons/SaveIcon';
import EditIcon from './icons/EditIcon';

// Manually define types for Web Speech API to fix TypeScript errors.
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
// End of type definitions

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isEditing: boolean;
  initialText: string;
  onCancelEdit: () => void;
}

const MAX_TEXTAREA_HEIGHT = 128; // Set a max height of 128px (approx. 5-6 lines)

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading, isEditing, initialText, onCancelEdit }) => {
  const [text, setText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(isEditing ? initialText : '');
  }, [isEditing, initialText]);
  
  // Auto-resize textarea to show all content, with a max height.
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto'; // Reset height to get accurate scrollHeight
      const scrollHeight = textarea.scrollHeight;

      if (scrollHeight > MAX_TEXTAREA_HEIGHT) {
        textarea.style.height = `${MAX_TEXTAREA_HEIGHT}px`;
        textarea.style.overflowY = 'auto'; // Show scrollbar when max height is reached
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden'; // Hide scrollbar when below max height
      }
    }
  }, [text]);

  const handleMicClick = () => {
    // Stop listening
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false); // Make UI responsive immediately
      return;
    }

    // Lazy initialization on first click for iOS compatibility
    if (!recognitionRef.current) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        try {
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = false;
            recognition.lang = 'ja-JP';
            recognition.interimResults = false;

            recognition.onresult = (event: SpeechRecognitionEvent) => {
              const transcript = event.results[0][0].transcript;
              setText(prev => (prev ? prev + ' ' : '') + transcript);
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
              console.error('Speech recognition error:', event.error);
              if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setMicError('マイクの使用が許可されていません。ブラウザの設定を確認してください。');
              } else {
                setMicError('音声認識エラーが発生しました。');
              }
              setIsListening(false);
            };

            recognition.onend = () => {
              setIsListening(false);
            };
            
            recognitionRef.current = recognition;
        } catch (err) {
            console.error("Failed to initialize SpeechRecognition", err);
            const message = 'お使いのブラウザは音声入力に対応していないか、設定に問題があります。';
            setMicError(message);
            alert(message);
            return;
        }
      } else {
        const message = 'お使いのブラウザは音声入力に対応していません。';
        setMicError(message);
        alert(message);
        return;
      }
    }
    
    // Start listening
    const recognition = recognitionRef.current;
    if (recognition) {
        setMicError('');
        try {
            recognition.start();
            setIsListening(true);
        } catch (e) {
            console.error("Error starting recognition:", e);
             if (e instanceof DOMException && e.name === 'InvalidStateError') {
                console.warn("Recognition already started.");
            } else {
                setMicError('音声認識を開始できませんでした。');
                setIsListening(false);
            }
        }
    }
  };

  const handleTextSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSubmit(text);
    if (!isEditing) {
        setText('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleTextSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const handleCancel = () => {
    onCancelEdit();
  };
  
  const placeholderText = isLoading 
    ? "AIが応答中です..." 
    : isListening 
    ? "お話しください..." 
    : isEditing 
    ? "メッセージを編集..." 
    : "メッセージを入力してください (Shift+Enterで改行)";

  return (
    <div className="p-4">
       {isEditing && (
        <div className="text-sm text-slate-600 mb-2 px-2 flex justify-between items-center animate-pulse">
          <span className="font-semibold flex items-center gap-2"><EditIcon /> メッセージを編集中...</span>
          <button type="button" onClick={handleCancel} className="font-semibold px-2 py-1 rounded-md text-sky-600 hover:bg-sky-100 transition-colors">
            キャンセル
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={isLoading || isListening}
          className="flex-1 w-full px-4 py-3 bg-slate-100 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200 resize-none"
          rows={1}
          autoFocus
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading || isEditing}
          className={`flex-shrink-0 w-12 h-12 rounded-full text-white flex items-center justify-center transition-colors duration-200 ${
            isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-sky-600 hover:bg-sky-700'
          } disabled:bg-slate-400 disabled:cursor-not-allowed`}
          title={micError || (isListening ? '録音を停止' : '音声入力')}
        >
          <MicrophoneIcon />
        </button>
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center transition-colors duration-200 hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
          aria-label={isEditing ? '編集を保存' : 'メッセージを送信'}
        >
          {isEditing ? <SaveIcon /> : <SendIcon />}
        </button>
      </form>
      {micError && <p className="text-xs text-red-500 mt-1.5 px-4">{micError}</p>}
    </div>
  );
};

export default ChatInput;