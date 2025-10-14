//src/components/chatroom/report/SessionReportCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionStats } from './SessionStats';
import { SessionDetailsDialog } from './SessionDetailsDialog';
import type { SessionReport } from '@/lib/redux/slices/reportSlice';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface SessionReportCardProps {
  session: SessionReport;
}

export default function SessionReportCard({ session }: SessionReportCardProps) {
  const averageTime = session.participants.length > 0 
    ? session.participants.reduce((sum, p) => sum + p.duration, 0) / session.participants.length
    : 0;
  
  // Ensure className is a string
  const getClassName = (session: SessionReport) => {
    if (typeof session.className === 'object' && session.className !== null) {
      return (session.className as any).name || 'Session';
    }
    return session.className || 'Session';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{getClassName(session)}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Par {session.teacherName}
            </p>
          </div>
          <Badge 
            variant={session.status === 'active' ? 'default' : 'secondary'}
            className={session.status === 'active' ? 'bg-green-100 text-green-800' : ''}
          >
            {session.status === 'active' ? 'Active' : 'Terminée'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <SessionStats 
          startTime={session.startTime}
          duration={session.duration}
          participantCount={session.participants.length}
          averageTime={averageTime}
          compact
        />

        <SessionDetailsDialog session={session}>
          <Button variant="outline" className="w-full">
            <Eye className="w-4 h-4 mr-2" />
            Voir les détails
          </Button>
        </SessionDetailsDialog>
      </CardContent>
    </Card>
  );
}
