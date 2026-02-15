
import React, { useEffect, useRef } from 'react';
import { ChatMessage, MessageAuthor } from '../types';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onEditMessage: (index: number) => void;
  onRegenerate?: () => void; // Added for regeneration
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onEditMessage, onRegenerate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  let lastUserMessageIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].author === MessageAuthor.USER) {
          lastUserMessageIndex = i;
          break;
      }
  }

  return (
    <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto pb-6">
      {messages.map((msg, index) => {
        const isLastMessage = index === messages.length - 1;
        const isAiThinking = isLastMessage && msg.author === MessageAuthor.AI && isLoading;
        const isEditable = index === lastUserMessageIndex && !isLoading;
        
        // Allow regeneration only for the very last message if it's from AI and not currently thinking
        const showRegenerate = isLastMessage && msg.author === MessageAuthor.AI && !isLoading && onRegenerate;

        return (
          <MessageBubble
            key={index}
            message={msg}
            isEditable={isEditable}
            onEdit={() => onEditMessage(index)}
            isThinking={isAiThinking}
            onRegenerate={showRegenerate ? onRegenerate : undefined}
          />
        );
      })}
    </div>
  );
};

export default ChatWindow;
