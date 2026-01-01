
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
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
};

const SourceChip: React.FC<{ url: string; title?: string }> = ({ url, title }) => {
    const displayTitle = title || new URL(url).hostname;
    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 max-w-full px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-slate-50 hover:text-sky-600 hover:border-sky-300 transition-colors shadow-sm"
        >
            <LinkIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[150px]">{displayTitle}</span>
        </a>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isEditable, onEdit, isThinking }) => {
  const isUser = message.author === MessageAuthor.USER;

  const bubbleClasses = isUser
    ? 'bg-sky-600 text-white prose prose-invert'
    : 'bg-slate-200 text-slate-800 prose prose-slate';

  const containerClasses = isUser
    ? 'justify-end'
    : 'justify-start';

  const groundingChunks = message.groundingMetadata?.groundingChunks || [];
  const uniqueSources = groundingChunks
      .filter(chunk => chunk.web?.uri)
      .map(chunk => ({ uri: chunk.web!.uri!, title: chunk.web!.title }))
      // Deduplicate by URI
      .filter((source, index, self) => 
          index === self.findIndex((s) => s.uri === source.uri)
      );

  return (
    <div className={`group flex items-end gap-2 ${containerClasses}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
          <RobotIcon isThinking={isThinking} />
        </div>
      )}
       {isEditable && isUser && (
        <button 
          onClick={onEdit}
          className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
          aria-label="メッセージを編集"
        >
          <EditIcon />
        </button>
      )}
      
      <div className={`flex flex-col gap-2 max-w-lg lg:max-w-2xl`}>
          <div className={`px-5 py-3 rounded-2xl ${bubbleClasses} ${isUser ? 'rounded-br-lg' : 'rounded-bl-lg'} break-words shadow-sm`}>
            {message.text ? (
              <div dangerouslySetInnerHTML={createMarkup(message.text)} />
            ) : (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{animationDelay: '-0.3s'}}></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{animationDelay: '-0.15s'}}></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Grounding Sources (Search Results) */}
          {uniqueSources.length > 0 && !isUser && (
              <div className="flex flex-wrap gap-2 ml-2">
                  {uniqueSources.map((source, idx) => (
                      <SourceChip key={idx} url={source.uri} title={source.title} />
                  ))}
              </div>
          )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
