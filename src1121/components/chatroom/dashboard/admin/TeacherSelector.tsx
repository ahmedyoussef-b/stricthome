'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { toggleTeacherSelection } from '@/lib/redux/slices/sessionSlice';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SessionParticipant } from '@prisma/client';

// The data passed to this component is expected to be enriched
// with user details and online status.
interface EnrichedSessionParticipant extends SessionParticipant {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    img?: string | null;
  };
  isOnline: boolean;
}

export default function TeacherSelector() {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useAppDispatch();
  const { selectedTeachers, meetingCandidates } = useAppSelector(state => state.session);
  const teachers = meetingCandidates as unknown as EnrichedSessionParticipant[];

  const filteredTeachers = teachers.filter(teacher =>
    teacher.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeacherToggle = (userId: string) => {
    dispatch(toggleTeacherSelection(userId));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un professeur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3 pr-4">
          {filteredTeachers.map((teacher) => {
            const isSelected = selectedTeachers.includes(teacher.userId);
            const isDisabled = !teacher.isOnline;

            return (
              <div
                key={teacher.userId}
                onClick={() => !isDisabled && handleTeacherToggle(teacher.userId)}
                className={cn(
                  "flex items-center space-x-4 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  isDisabled
                    ? "bg-muted/50 border-transparent opacity-60"
                    : "bg-card hover:bg-muted/50",
                  isSelected && "border-primary bg-primary/10"
                )}
              >
                <Checkbox
                  id={`teacher-${teacher.userId}`}
                  checked={isSelected}
                  onCheckedChange={() => handleTeacherToggle(teacher.userId)}
                  disabled={isDisabled}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.user.img || `https://api.dicebear.com/8.x/bottts/svg?seed=${teacher.user.name}`}
                      alt={teacher.user.name || 'Avatar'}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-foreground">{teacher.user.name}</p>
                      <p className="text-sm text-muted-foreground">{teacher.user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={teacher.isOnline ? "default" : "secondary"}
                    className={cn(
                      "flex items-center gap-1.5",
                      teacher.isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", teacher.isOnline ? "bg-green-500" : "bg-muted-foreground")} />
                    {teacher.isOnline ? "En ligne" : "Hors ligne"}
                  </Badge>
                </div>
              </div>
            )
          })}

          {filteredTeachers.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <p>Aucun professeur trouvé</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
