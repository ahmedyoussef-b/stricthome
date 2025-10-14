import { MessageCircle } from 'lucide-react';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatMessage } from '@/lib/redux/slices/session/types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  emptyMessage?: React.ReactNode;
}

export function ChatMessageList({ 
  messages, 
  currentUserId,
  emptyMessage = (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
      <p>Aucun message pour le moment.</p>
      <p className="text-sm">Soyez le premier à envoyer un message !</p>
    </div>
  )
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        emptyMessage
      ) : (
        messages.map((message) => (
          <ChatMessageItem 
            key={message.id} 
            message={message} 
            isCurrentUser={message.userId === currentUserId} 
          />
        ))
      )}
    </div>
  );
}