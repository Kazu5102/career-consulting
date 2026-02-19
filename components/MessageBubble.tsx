
// components/MessageBubble.tsx - v4.52 - Multimodal Support
import React from 'react';
import { marked } from 'marked';
import { ChatMessage, MessageAuthor } from '../types';
import UserIcon from './icons/UserIcon';
import RobotIcon from './icons/RobotIcon';
import EditIcon from './icons/EditIcon';
import LinkIcon from './icons/LinkIcon';

interface MessageBubbleProps {
  message: ChatMessage;
  isEditable?: boolean;
  onEdit?: () => void;
  isThinking?: boolean;
}

const createMarkup = (markdownText: string) => {
    if (!markdownText) return { __html: '' };
    const cleanText = markdownText.replace(/\[(HAPPY|CURIOUS|THINKING|REASSURE)\]/g, '');
    const textWithActions = cleanText.replace(/\[([^\]]+)\]/g, (match, p1) => {
        if (['HAPPY', 'CURIOUS', 'THINKING', 'REASSURE'].includes(p1)) return '';
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 mx-1 border border-amber-200">🐕 ${p1}</span>`;
    });
    return { __html: marked.parse(textWithActions, { breaks: true, gfm: true }) as string };
};

const SourceChip: React.FC<{ url: string; title?: string }> = ({ url, title }) => {
    const displayTitle = title || new URL(url).hostname;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 max-w-full px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <LinkIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[150px]">{displayTitle}</span>
        </a>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isEditable, onEdit, isThinking }) => {
  const isUser = message.author === MessageAuthor.USER;
  const bubbleClasses = isUser ? 'bg-sky-600 text-white prose prose-invert' : 'bg-slate-200 text-slate-800 prose prose-slate';
  const containerClasses = isUser ? 'justify-end' : 'justify-start';

  const groundingChunks = message.groundingMetadata?.groundingChunks || [];
  const uniqueSources = groundingChunks.filter(chunk => chunk.web?.uri).map(chunk => ({ uri: chunk.web!.uri!, title: chunk.web!.title }));

  return (
    <div className={`group flex items-end gap-2 ${containerClasses} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center"><RobotIcon isThinking={isThinking} /></div>}
       {isEditable && isUser && <button onClick={onEdit} className="p-1.5 rounded-full text-slate-400 hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-all"><EditIcon /></button>}
      
      <div className={`flex flex-col gap-2 max-w-lg lg:max-w-2xl`}>
          <div className={`px-5 py-3 rounded-2xl ${bubbleClasses} ${isUser ? 'rounded-br-lg' : 'rounded-bl-lg'} break-words shadow-sm`}>
            {message.image && (
                <div className="mb-4 mt-1 rounded-xl overflow-hidden border-2 border-white/20 shadow-md">
                    <img 
                      src={`data:${message.image.mimeType};base64,${message.image.data}`} 
                      alt="Attached" 
                      className="max-w-full h-auto block m-0 cursor-pointer hover:scale-[1.02] transition-transform" 
                      onClick={() => window.open(`data:${message.image.mimeType};base64,${message.image.data}`, '_blank')}
                    />
                </div>
            )}
            {message.text ? <div dangerouslySetInnerHTML={createMarkup(message.text)} /> : !message.image && <div className="flex items-center justify-center space-x-1 py-1"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div></div>}
          </div>
          {uniqueSources.length > 0 && !isUser && <div className="flex flex-wrap gap-2 ml-2">{uniqueSources.map((source, idx) => <SourceChip key={idx} url={source.uri} title={source.title} />)}</div>}
      </div>
      {isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center"><UserIcon /></div>}
    </div>
  );
};

export default MessageBubble;
