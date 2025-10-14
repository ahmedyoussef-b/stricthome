
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/lib/redux/slices/session/types';

interface ChatMessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export function ChatMessageItem({ message, isCurrentUser }: ChatMessageItemProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const userName = typeof message.userName === 'string' ? message.userName : 'Utilisateur';

  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <img
          src={message.userAvatar || `https://api.dicebear.com/8.x/bottts/svg?seed=${userName}`}
          alt={userName}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      )}
      
      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-first' : ''}`}>
        <div className={`rounded-lg p-3 ${
          isCurrentUser
            ? 'bg-blue-600 text-white'
            : 'bg-white border'
        }`}>
          {!isCurrentUser && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {userName}
              </span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getRoleBadgeColor(message.userRole)}`}
              >
                {message.userRole === 'admin' ? 'Admin' : 
                 message.userRole === 'teacher' ? 'Prof' : 'Élève'}
              </Badge>
            </div>
          )}
          <p className="text-sm">{message.message}</p>
          <p className={`text-xs mt-1 ${
            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>

      {isCurrentUser && (
        <img
          src={message.userAvatar || `https://api.dicebear.com/8.x/bottts/svg?seed=${userName}`}
          alt={userName}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      )}
    </div>
  );
}
