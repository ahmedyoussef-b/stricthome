// src/components/StudentPlaceholder.tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { StudentWithCareer } from '@/lib/types';
import { VideoOff } from 'lucide-react';

interface StudentPlaceholderProps {
  student: StudentWithCareer;
  isOnline: boolean;
}

export function StudentPlaceholder({ student, isOnline }: StudentPlaceholderProps) {
  const careerName = student.etat?.metier?.nom;

  return (
    <Card 
      className={cn(
        "relative aspect-video bg-muted rounded-lg overflow-hidden flex flex-col items-center justify-center p-2",
        !isOnline && "opacity-70"
      )}
    >
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/50 text-xs px-2 py-1 rounded-full">
            <VideoOff className="h-3 w-3" />
            <span>Hors ligne</span>
        </div>
        <Avatar className="h-12 w-12 text-xl mb-2">
            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-sm text-center">{student.name}</p>
        {careerName && <p className="text-xs text-muted-foreground text-center">{careerName}</p>}
    </Card>
  );
}
