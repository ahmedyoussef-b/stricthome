// src/components/NotificationDropdown.tsx
'use client';

import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { markAsRead, removeNotification, markAllAsRead, type AppNotification } from '@/lib/redux/slices/notificationSlice';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NotificationDropdown() {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector(state => state.notifications);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAll = () => {
    dispatch(markAllAsRead());
  }

  const handleDelete = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <DropdownMenuContent align="end" className="w-80 md:w-96">
      <div className="flex items-center justify-between p-2">
        <DropdownMenuLabel>Notifications ({unreadCount})</DropdownMenuLabel>
        {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1" onClick={handleMarkAll}>
                <CheckCheck className="w-4 h-4" />
                Tout marquer comme lu
            </Button>
        )}
      </div>
      <DropdownMenuSeparator />
      <ScrollArea className="h-[300px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Bell className="w-12 h-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">Aucune nouvelle notification</p>
            <p className="text-xs text-muted-foreground">Tout est à jour !</p>
          </div>
        ) : (
          notifications.map((notif: AppNotification) => (
            <DropdownMenuItem
              key={notif.id}
              className={cn("flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 data-[highlighted]:bg-muted/50", !notif.read && "bg-primary/5")}
              onSelect={(e) => e.preventDefault()} // Prevent closing on click
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-primary" style={{ opacity: notif.read ? 0 : 1 }}/>
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-sm">{notif.title}</p>
                <p className="text-xs text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground/70">
                    {new Date(notif.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                  {!notif.read && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMarkAsRead(notif.id)}>
                        <Check className="h-4  text-green-500" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(notif.id)}>
                      <Trash2 className="h-4 " />
                  </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </ScrollArea>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/list/announcements" className="flex items-center justify-center text-sm text-primary">
          Voir toutes les annonces
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
