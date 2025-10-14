import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
  id: string;
  type: 'session_invite' | 'session_ended' | 'student_joined' | 'student_left' | 'session_started' | 'hand_raised' | 'hand_lowered' | 'all_hands_cleared' | 'reaction_sent';
  title: string;
  message: string;
  timestamp: string; // Changed from Date to string
  read: boolean;
  actionUrl?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<AppNotification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: AppNotification = {
        ...action.payload,
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(), // Use ISO string
        read: false,
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
        }
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
  },
  selectors: {
    selectUnreadCount: (state) => state.unreadCount,
  }
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification } = notificationSlice.actions;
export const { selectUnreadCount } = notificationSlice.selectors;
export default notificationSlice.reducer;
