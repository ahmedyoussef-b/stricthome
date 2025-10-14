// src/hooks/useSocket.tsx
import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { io, Socket } from 'socket.io-client';
import { updateStudentPresence, studentSignaledPresence } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { RootState } from '@/lib/redux/store';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
        if (socketRef.current) {
            console.log("🔌 [SocketProvider] User logged out, disconnecting socket.");
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        return;
    }

    if (socketRef.current?.connected) {
        return; // Socket already initialized and connected
    }
    
    // Connect to the custom server, which will be the same origin as the web page.
    console.log(`🔌 [SocketProvider] Initializing socket connection for user ${user.id}`);

    // The path is not needed anymore as we are connecting to the root server
    socketRef.current = io({ // Connect to the same server that serves the page
      transports: ['websocket', 'polling'],
      auth: {
        userId: user.id,
      },
    });

    const socket = socketRef.current;

    // --- DEBUG MIDDLEWARE ---
    socket.onAny((event: string, ...args: any[]) => {
        console.log(`📡 [Socket Client] Received event: '${event}' with data:`, args);
    });
    
    socket.on('connect', () => {
      console.log(`✅ [Socket Client] Connected with ID: ${socket.id}`);
    });

    socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.log(`🔌 [Socket Client] Disconnected: ${reason}`);
    });
    
    socket.on('connect_error', (err: Error) => {
      console.error(`❌ [Socket Client] Connection error: ${err.message}`);
    });


    // --- CENTRALIZED EVENT LISTENERS ---
    
    socket.on('presence:update', (onlineUserIds: string[]) => {
      console.log(`📡 [SocketProvider] Received presence update. Online users: ${onlineUserIds.length}`);
      dispatch(updateStudentPresence({ onlineUserIds }));
    });

    socket.on('student:signaled_presence', (studentId: string) => {
        console.log(`✋ [SocketProvider] Student ${studentId} signaled presence.`);
        dispatch(studentSignaledPresence(studentId));
    });

    socket.on('session:invite', (sessionData: any) => {
      console.log(`📬 [SocketProvider] Received invite for session: ${sessionData.title}`);
      dispatch(addNotification({
        type: 'session_invite',
        title: `Invitation: ${sessionData.title}`,
        message: `De: ${sessionData.host.name || 'Admin'}`,
        actionUrl: `/list/chatroom/session?sessionId=${sessionData.id}`
      }));
      toast.info(`Nouvelle invitation de ${sessionData.host.name || 'Admin'}`);
    });


    return () => {
      if (socket) {
        console.log("🔌 [SocketProvider] Cleanup: disconnecting socket.");
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, dispatch]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
