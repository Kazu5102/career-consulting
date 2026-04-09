
// components/ChatInput.tsx - v4.62 - Keystroke Statistical Analysis Model (Module 201)
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
  onStateChange?: (state: { isFocused: boolean; isTyping: boolean; isSilent: boolean; currentDraft: string }) => void;
}

const MAX_TEXTAREA_HEIGHT = 128;
const MIN_TIMEOUT = 500; // S504: 安全装置として500msを下回らないように変更
const MAX_TIMEOUT = 3000;
const ALPHA = 2.0; // α: 許容係数 (Step 1: T_base = μ + 2.0 * σ)
const MAX_INTERVALS_HISTORY = 10; // N=10 に変更

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading, isEditing, initialText, clearSignal = 0, onCancelEdit, onStateChange }) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [isActiveTyping, setIsActiveTyping] = useState(false); 
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);

  // S501: 打鍵統計解析モデル用 (モジュール201)
  const lastKeystrokeTimeRef = useRef<number | null>(null);
  const keystrokeIntervalsRef = useRef<number[]>([]); // キューはuseRefで実装
  
  // S501: 算術平均 μ、標準偏差 σ、推敲係数 β を保持するステート
  const [mu, setMu] = useState<number>(MIN_TIMEOUT);
  const [sigma, setSigma] = useState<number>(0);
  const [beta, setBeta] = useState<number>(1.0);

  // S503: 動的閾値の演算実装（動的閾値決定モジュール 202 相当）
  const calculateDynamicTimeout = (): number => {
      // Step 1（基準閾値）: T_base = μ + 2.0 * σ
      const tBase = mu + ALPHA * sigma;
      
      // Step 2（推敲補正）: T_final = T_base * β
      const tFinal = tBase * beta;

      // S504: 判定の最小値（安全装置）として、T_final が 500ms を下回らないようにクランプ処理
      return Math.min(Math.max(tFinal, MIN_TIMEOUT), MAX_TIMEOUT);
  };

  // clearSignalが更新されたら問答無用でクリア
  useEffect(() => {
    setText('');
    setIsActiveTyping(false);
    setIsSilent(false);
  }, [clearSignal]);

  // 編集開始時などの同期
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);
  
  // 静止判定ロジックの改善 (動的閾値の適用)
  useEffect(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    // 静止判定の対象外
    if (!isFocused || isLoading || isEditing || isListening || isActiveTyping) {
      setIsSilent(false);
      return;
    }

    // S504: タイマー制御への反映
    const currentTimeout = calculateDynamicTimeout();

    silenceTimerRef.current = setTimeout(() => {
      // S505: セキュリティ境界の遵守 (機密データはRAM上でのみ処理)
      setIsSilent(true);
    }, currentTimeout);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isFocused, text, isLoading, isEditing, isListening, isActiveTyping, mu, sigma, beta]);

  // 状態の外部通知
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
      textarea.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    setIsSilent(false);
    
    // S503: Step 2（推敲補正）現在の文字数 L に応じて β を決定
    const L = val.length;
    let newBeta = 1.0;
    if (L < 20) {
        newBeta = 1.0;
    } else if (L >= 20 && L < 100) {
        newBeta = 1.5;
    } else {
        newBeta = 2.0;
    }
    setBeta(newBeta);

    // S502: 統計演算ロジックの実装（打鍵統計解析モジュール 201 相当）
    const now = Date.now();
    if (lastKeystrokeTimeRef.current) {
        const interval = now - lastKeystrokeTimeRef.current;
        if (interval < 3000) { // S502: 3秒以上の間隔はノイズとして除外（外れ値フィルタリング）
            keystrokeIntervalsRef.current.push(interval);
            if (keystrokeIntervalsRef.current.length > MAX_INTERVALS_HISTORY) {
                keystrokeIntervalsRef.current.shift();
            }
            
            // S502: μ と σ を逐次計算
            const intervals = keystrokeIntervalsRef.current;
            if (intervals.length > 0) {
                const newMu = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                const variance = intervals.reduce((a, b) => a + Math.pow(b - newMu, 2), 0) / intervals.length;
                const newSigma = Math.sqrt(variance);
                
                setMu(newMu);
                setSigma(newSigma);
            }
        }
    }
    lastKeystrokeTimeRef.current = now;

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
