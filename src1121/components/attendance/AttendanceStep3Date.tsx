import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttendanceStep3DateProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function AttendanceStep3Date({ selectedDate, onSelectDate }: AttendanceStep3DateProps) {
  return (
    <div className="space-y-2 animate-in fade-in-0">
      <label className="font-semibold flex items-center gap-2 text-sm  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        <CalendarIcon className="w-4 h-4 text-primary" />
        Étape 3: Sélectionner la date de l'absence
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar 
            mode="single" 
            selected={selectedDate} 
            onSelect={onSelectDate} 
            initialFocus 
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}