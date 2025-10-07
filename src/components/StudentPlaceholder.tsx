// src/components/StudentPlaceholder.tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { StudentWithCareer } from '@/lib/types';
import { Hand, VideoOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface StudentPlaceholderProps {
  student: StudentWithCareer;
  isOnline: boolean;
  isHandRaised?: boolean;
}

export function StudentPlaceholder({ student, isOnline, isHandRaised }: StudentPlaceholderProps) {
  const careerName = student.etat?.metier?.nom;

  return (
    <Card 
      className={cn(
        "relative aspect-video bg-muted rounded-lg overflow-hidden flex flex-col items-center justify-center p-2",
        !isOnline && "opacity-70",
        isHandRaised && "ring-2 ring-blue-500"
      )}
    >
        <div className={cn(
            "absolute top-2 right-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
             isOnline ? "bg-green-500/20 text-green-700" : "bg-background/50"
        )}>
            {isOnline ? (
                <>
                    <div className="w-2 h-2 rounded-full bg-green-500"/>
                    <span>En ligne</span>
                </>
            ) : (
                <>
                    <VideoOff className="h-3 w-3" />
                    <span>Hors ligne</span>
                </>
            )}
        </div>
        {isHandRaised && (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <div className="absolute top-2 left-2 bg-blue-500/80 backdrop-blur-sm rounded-md p-1 animate-pulse">
                            <Hand className="h-3 w-3 text-white" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                       <p>Main levée</p>
                    </TooltipContent>
                </Tooltip>
             </TooltipProvider>
        )}
        <Avatar className="h-12 w-12 text-xl mb-2">
            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-sm text-center">{student.name}</p>
        {careerName && <p className="text-xs text-muted-foreground text-center">{careerName}</p>}
    </Card>
  );
}
