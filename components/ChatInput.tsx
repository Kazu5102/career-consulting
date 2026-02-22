
// components/ChatInput.tsx - v4.52 - Multimodal Support
import React, { useState, useEffect, useRef } from 'react';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SaveIcon from './icons/SaveIcon';
import EditIcon from './icons/EditIcon';
import ImageIcon from './icons/ImageIcon';
import TrashIcon from './icons/TrashIcon';

interface ChatInputProps {
  onSubmit: (text: string, image?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
  isEditing: boolean;
  initialText: string; 
  clearSignal?: number;
  onCancelEdit: () => void;
  onStateChange?: (state: { isFocused: boolean; isTyping: boolean; isSilent: boolean; currentDraft: string }) => void;
}

const MAX_TEXTAREA_HEIGHT = 128;
const SILENCE_TIMEOUT = 600;

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, isLoading, isEditing, initialText, clearSignal = 0, onCancelEdit, onStateChange }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [isActiveTyping, setIsActiveTyping] = useState(false); 
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setText('');
    setImage(null);
    setIsActiveTyping(false);
    setIsSilent(false);
  }, [clearSignal]);

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);
  
  useEffect(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!isFocused || isLoading || isEditing || isListening || isActiveTyping) {
      setIsSilent(false);
      return;
    }
    silenceTimerRef.current = setTimeout(() => setIsSilent(true), SILENCE_TIMEOUT);
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [isFocused, text, image, isLoading, isEditing, isListening, isActiveTyping]);

  useEffect(() => {
    onStateChange?.({ isFocused, isTyping: isActiveTyping || isListening, isSilent, currentDraft: text });
  }, [isFocused, isActiveTyping, isListening, isSilent, text, onStateChange]);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsSilent(false);
    setIsActiveTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsActiveTyping(false), 800);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setImage({ data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) processFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleMicClick = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      try {
          const recognition = new SpeechRecognitionAPI();
          recognition.lang = 'ja-JP';
          recognition.onresult = (event: any) => setText(prev => (prev ? prev + ' ' : '') + event.results[0][0].transcript);
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);
          recognitionRef.current = recognition;
          recognition.start();
          setIsListening(true);
      } catch { setMicError('音声入力の初期化に失敗しました。'); }
    } else { setMicError('お使いのブラウザは音声入力に対応していません。'); }
  };

  const handleTextSubmit = () => {
    const trimmedText = text.trim();
    if ((!trimmedText && !image) || isLoading) return;
    onSubmit(trimmedText, image || undefined);
    setText('');
    setImage(null);
    setIsActiveTyping(false);
    setIsSilent(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
  };

  return (
    <div className="p-4">
      {isEditing && (
        <div className="text-sm text-slate-600 mb-2 px-2 flex justify-between items-center animate-pulse">
          <span className="font-semibold flex items-center gap-2"><EditIcon /> メッセージを編集中...</span>
          <button type="button" onClick={onCancelEdit} className="font-semibold px-2 py-1 rounded-md text-sky-600 hover:bg-sky-100 transition-colors">キャンセル</button>
        </div>
      )}

      {image && (
        <div className="mb-3 px-2 flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative group">
                <img 
                  src={`data:${image.mimeType};base64,${image.data}`} 
                  alt="Preview" 
                  className="h-20 w-auto rounded-xl border-2 border-sky-400 shadow-lg object-cover"
                />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-md hover:bg-rose-600 transition-colors"
                >
                    <TrashIcon className="w-3 h-3" />
                </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border">Image Attached</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleTextSubmit(); }} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center transition-all hover:text-sky-600 hover:border-sky-300 active:scale-90"
        >
          <ImageIcon />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); setIsSilent(false); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isLoading ? "AIが応答中です..." : "画像ペーストも可能です..."}
          disabled={isLoading || isListening}
          className="flex-1 w-full px-4 py-3 bg-slate-100 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200 resize-none"
          rows={1}
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading || isEditing}
          className={`flex-shrink-0 w-11 h-11 rounded-2xl text-white flex items-center justify-center transition-all ${
            isListening ? 'bg-red-500 animate-pulse' : 'bg-sky-600 hover:bg-sky-700'
          } disabled:bg-slate-300`}
        >
          <MicrophoneIcon />
        </button>
        <button
          type="submit"
          disabled={isLoading || (!text.trim() && !image)}
          className="flex-shrink-0 w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center transition-all hover:bg-emerald-600 disabled:bg-slate-300"
        >
          {isEditing ? <SaveIcon /> : <SendIcon />}
        </button>
      </form>
      {micError && <p className="text-xs text-red-500 mt-1.5 px-4">{micError}</p>}
    </div>
  );
};

export default ChatInput;
