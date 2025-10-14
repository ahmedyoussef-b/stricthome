// src/components/chatroom/session/CreateBreakoutRoomsDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { createBreakoutRooms } from '@/lib/redux/slices/sessionSlice';
import { useToast } from "@/hooks/use-toast";
import { SessionParticipant } from "@/lib/redux/slices/session/types";
import { Role } from '@prisma/client';

export default function CreateBreakoutRoomsDialog() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [numberOfRooms, setNumberOfRooms] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(10);
  
  const studentCount = useAppSelector(state => state.session.activeSession?.participants.filter((p: SessionParticipant) => p.role === Role.STUDENT).length || 0);
  const maxRooms = studentCount > 1 ? Math.floor(studentCount / 2) : 1;
  
  const handleCreate = () => {
    if (numberOfRooms > studentCount) {
        toast({
            variant: "destructive",
            title: "Trop de salles",
            description: "Le nombre de salles ne peut pas être supérieur au nombre d'élèves.",
        });
        return;
    }

    if (!durationMinutes || durationMinutes <= 0) {
      toast({
        variant: "destructive",
        title: "Durée invalide",
        description: "Veuillez spécifier une durée valide pour les salles.",
      });
      return;
    }

    dispatch(createBreakoutRooms({
      numberOfRooms,
      durationMinutes,
    }));
    setIsOpen(false);
    toast({
      title: "Salles de sous-commission créées",
      description: `${numberOfRooms} salles de sous-commission ont été créées pour ${durationMinutes} minutes.`, 
    });
  };

  const isCreateDisabled = numberOfRooms <= 0 || numberOfRooms > maxRooms || !durationMinutes || durationMinutes <= 0;

  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Users className="w-4 h-4"/>
              Salles de sous-commission
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer des Salles de Sous-Commission</DialogTitle>
            <DialogDescription>
              Divisez les participants en petits groupes pour des discussions ciblées.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="num-rooms">Nombre de salles</Label>
              <Input
                id="num-rooms"
                type="number"
                value={numberOfRooms}
                onChange={(e) => setNumberOfRooms(Math.max(1, parseInt(e.target.value, 10)))}
                min="1"
                max={maxRooms}
              />
              {numberOfRooms > maxRooms && (
                <p className="text-red-500 text-xs mt-1">Le nombre de salles ne peut pas être supérieur à la moitié du nombre d'élèves ({maxRooms}).</p>
              )}
            </div>
            <div>
              <Label htmlFor="duration">Durée (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={isCreateDisabled}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
