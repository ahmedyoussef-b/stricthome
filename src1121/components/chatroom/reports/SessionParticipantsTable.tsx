import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Participant {
  id: string;
  name: string;
  email: string;
  joinTime: string;
  leaveTime?: string;
  duration: number;
}

interface SessionParticipantsTableProps {
  participants: Participant[];
}

export function SessionParticipantsTable({ participants }: SessionParticipantsTableProps) {
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateString));
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Arrivée</TableHead>
          <TableHead>Départ</TableHead>
          <TableHead>Temps de participation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => (
          <TableRow key={participant.id}>
            <TableCell className="font-medium">{participant.name}</TableCell>
            <TableCell>{participant.email}</TableCell>
            <TableCell>{formatDateTime(participant.joinTime)}</TableCell>
            <TableCell>
              {participant.leaveTime ? formatDateTime(participant.leaveTime) : 'En cours'}
            </TableCell>
            <TableCell>{formatDuration(participant.duration)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
