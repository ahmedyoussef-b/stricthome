import React from 'react';
import { Button } from '@/components/ui/button';
import { Building } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { updateLessonRoom } from '@/lib/redux/features/schedule/scheduleSlice';
import { toast } from '@/hooks/use-toast';
import type { Day, Lesson, WizardData } from '@/types';
import { getAvailableRoomsForSlot } from './utils';
import { dayLabels } from '@/lib/constants';

interface RoomSelectorPopoverProps {
  lesson: Lesson | null;
  day: Day;
  timeSlot: string;
  wizardData: WizardData;
  fullSchedule: Lesson[];
}

const RoomSelectorPopover: React.FC<RoomSelectorPopoverProps> = ({ 
  lesson, 
  day, 
  timeSlot, 
  wizardData, 
  fullSchedule 
}) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = React.useState(false);

  const availableRooms = React.useMemo(() => {
    if (!lesson) return [];
    const lessonDuration = (new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()) / (1000 * 60);
    return getAvailableRoomsForSlot(day, timeSlot, lessonDuration, wizardData, fullSchedule, lesson.id);
  }, [day, timeSlot, fullSchedule, wizardData, lesson]);
  
  const handleRoomChange = (newRoomId: number | null) => {
    if (!lesson) return;
    dispatch(updateLessonRoom({ lessonId: lesson.id, classroomId: newRoomId }));
    toast({ title: "Salle modifiée", description: `Le cours a été assigné à une nouvelle salle.` });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-1 right-1 p-0.5 h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Changer de salle">
          <Building size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Salles Disponibles</h4>
          <p className="text-sm text-muted-foreground">
            Créneau: {dayLabels[day]} {timeSlot}
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {availableRooms.length > 0 ? availableRooms.map(room => (
              <Button
                key={room.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleRoomChange(room.id)}
                disabled={!lesson}
              >
                {room.name}
              </Button>
            )) : <p className="text-sm text-muted-foreground p-2">Aucune salle libre.</p>}
            
            {lesson?.classroomId && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start mt-2"
                onClick={() => handleRoomChange(null)}
              >
                Retirer la salle
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RoomSelectorPopover;
