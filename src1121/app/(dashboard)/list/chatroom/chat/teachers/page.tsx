'use client';

import ChatRoom from '@/components/chatroom/chat/ChatRoom';

export default function TeachersChatPage() {
  return (
    <ChatRoom
      roomType="teacher"
      title="Chat Professeurs"
      description="Espace de discussion entre professeurs"
      allowedRoles={['ADMIN', 'TEACHER']}
    />
  );
}
