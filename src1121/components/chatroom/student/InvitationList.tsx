import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, Bell } from 'lucide-react';
import type { AppNotification } from '@/lib/redux/slices/notificationSlice';

interface InvitationListProps {
  invitations: (AppNotification & { actionUrl: string })[];
  onJoin: (invitation: AppNotification & { actionUrl: string }) => void;
  onDecline: (invitationId: string) => void;
}

export function InvitationList({ invitations, onJoin, onDecline }: InvitationListProps) {
  return (
    <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-white to-green-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Bell className="w-5 h-5" />
          Invitations en attente ({invitations.length})
        </CardTitle>
        <CardDescription>
          Cliquez pour rejoindre une session ou décliner l'invitation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Invitation pour {invitation.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {invitation.message}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Il y a {Math.floor((Date.now() - new Date(invitation.timestamp).getTime()) / 60000)} min</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 animate-pulse">
                  Nouveau
                </Badge>
                <Button
                  size="sm"
                  onClick={() => onJoin(invitation)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Rejoindre
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline(invitation.id)}
                >
                  Décliner
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
