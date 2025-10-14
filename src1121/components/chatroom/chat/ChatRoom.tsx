//src/components/chat/ChatRoom.tsx
'use client';
import { useAppSelector } from '@/lib/redux/hooks';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { sendGeneralMessage, clearChatMessages } from '@/lib/redux/slices/sessionSlice';
import { ChatAccessDenied } from './ChatAccessDenied';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { Role } from '@/types';

interface ChatRoomProps {
  roomType: 'admin' | 'teacher';
  title: string;
  description?: string;
  allowedRoles: ('ADMIN' | 'TEACHER')[];
}

export default function ChatRoom({ roomType, title, description, allowedRoles }: ChatRoomProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const messages = useAppSelector((state) => state.session.chatMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear messages when component unmounts or room changes
  useEffect(() => {
    dispatch(clearChatMessages());
    return () => {
      dispatch(clearChatMessages());
    };
  }, [dispatch, roomType]);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message = {
      id: `msg_${Date.now()}`,
      userId: user.id,
      userName: user.name || user.email,
      userAvatar: user.img || undefined,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      userRole: user.role.toLowerCase() as 'admin' | 'teacher'
    };
    
    dispatch(sendGeneralMessage(message));
    setNewMessage('');
  };

  if (!user || !allowedRoles.includes(user.role as 'ADMIN' | 'TEACHER')) {
    return <ChatAccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="h-[calc(100vh-2rem)] flex flex-col">
          <ChatHeader title={title} description={description} />
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ChatMessageList 
              messages={messages} 
              currentUserId={user.id} 
            />
            <div ref={messagesEndRef} />
            
            <div className="p-4 border-t">
              <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={handleSendMessage}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
