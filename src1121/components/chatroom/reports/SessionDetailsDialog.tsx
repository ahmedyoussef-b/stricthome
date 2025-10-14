import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { SessionStats } from './SessionStats';
import { SessionParticipantsTable } from './SessionParticipantsTable';
import type { SessionReport } from '@/lib/redux/slices/reportSlice';

interface SessionDetailsDialogProps {
  session: SessionReport;
  children: React.ReactNode;
}

export function SessionDetailsDialog({ session, children }: SessionDetailsDialogProps) {
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
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de la session - {getClassName(session)}</DialogTitle>
          <DialogDescription>
            Session du {new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short'
            }).format(new Date(session.startTime))}
            {session.endTime && ` - ${new Intl.DateTimeFormat('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short'
            }).format(new Date(session.endTime))}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <SessionStats 
            startTime={session.startTime}
            endTime={session.endTime}
            duration={session.duration}
            participantCount={session.participants.length}
            averageTime={averageTime}
          />

          <div>
            <h4 className="text-lg font-semibold mb-3">Participants</h4>
            <SessionParticipantsTable participants={session.participants} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
