// components/OnlineUsers.tsx
"use client";
import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher/client';
import { Users } from 'lucide-react';

export function OnlineUsers({ chatroomId }: { chatroomId: string }) {
  const [onlineUsers, setOnlineUsers] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (!chatroomId) return;
    
    const channelName = `presence-chatroom-${chatroomId}`;
    const channel = pusherClient.subscribe(channelName);
    
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      const users = Object.keys(members.members).map((id) => ({
        id: id,
        name: members.members[id].name
      }));
      setOnlineUsers(users);
    });

    channel.bind('pusher:member_added', (member: any) => {
      setOnlineUsers(prev => [...prev, {
        id: member.id,
        name: member.info.name
      }]);
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setOnlineUsers(prev => prev.filter(user => user.id !== member.id));
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [chatroomId]);

  return (
    <div className="bg-muted p-3 rounded-lg border">
      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
        <Users className="h-4 w-4" /> En ligne ({onlineUsers.length})
      </h4>
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {onlineUsers.map(user => (
          <div key={user.id} className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
