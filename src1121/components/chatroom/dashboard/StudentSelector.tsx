// src/components/chatroom/dashboard/StudentSelector.tsx
'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Hand } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { toggleStudentSelection } from '@/lib/redux/slices/sessionSlice';
import type { ClassRoom, SessionParticipant } from '@/lib/redux/slices/session/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface StudentSelectorProps {
  classroom: ClassRoom;
}

export default function StudentSelector({ classroom }: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useAppDispatch();
  const { selectedStudents, signaledPresence } = useAppSelector(state => state.session);

  // Ensure classroom.students is treated as an array, even if it's undefined.
  const students = classroom.students || [];

  const filteredStudents = students.filter(student =>
    (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentToggle = (studentId: string) => {
    dispatch(toggleStudentSelection(studentId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {selectedStudents.length} sélectionné{selectedStudents.length > 1 ? 's' : ''}
          </Badge>
        </div>
      
      <ScrollArea className="h-96">
        <div className="space-y-3 pr-4">
          {filteredStudents.map((student: SessionParticipant) => {
            const isSelected = selectedStudents.includes(student.id!);
            const isDisabled = !student.isOnline;
            const hasSignaled = signaledPresence.includes(student.userId!);
            
            return (
              <div
                key={student.id}
                onClick={() => !isDisabled && handleStudentToggle(student.id!)}
                className={cn(
                  "flex items-center space-x-4 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  isDisabled 
                    ? "bg-muted/50 border-transparent opacity-60" 
                    : "bg-card hover:bg-muted/50",
                  isSelected && "border-primary bg-primary/10"
                )}
              >
                <Checkbox
                  id={`student-${student.id}`}
                  checked={isSelected}
                  onCheckedChange={() => handleStudentToggle(student.id!)}
                  disabled={isDisabled}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.img || `https://api.dicebear.com/8.x/bottts/svg?seed=${student.name || 'avatar'}`}
                      alt={student.name || 'Avatar'}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        {student.name}
                        {hasSignaled && <Hand className="w-4 h-4 text-yellow-500 animate-bounce" title="Présence signalée !" />}
                      </p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge
                    variant={student.isOnline ? "default" : "secondary"}
                    className={cn(
                      "flex items-center gap-1.5",
                       student.isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", student.isOnline ? "bg-green-500" : "bg-muted-foreground")} />
                    {student.isOnline ? "En ligne" : "Hors ligne"}
                  </Badge>
                </div>
              </div>
            )
          })}
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <p>Aucun élève trouvé</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
