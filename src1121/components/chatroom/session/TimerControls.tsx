
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Clock, Play, Pause, RotateCcw, TimerOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { setTimer, toggleTimer, resetTimer, stopTimer } from '@/lib/redux/slices/sessionSlice';

export default function TimerControls() {
  const dispatch = useAppDispatch();
  const timer = useAppSelector(state => state.session.activeSession?.classTimer);
  const [duration, setDuration] = useState(5); // Default to 5 minutes
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSetTimer = () => {
    if (duration > 0) {
      dispatch(setTimer(duration * 60));
      setIsDialogOpen(false);
    }
  };

  if (!timer) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Démarrer un minuteur
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurer le minuteur</DialogTitle>
            <DialogDescription>
              Choisissez une durée pour l'activité.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="duration">Durée (en minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              min="1"
            />
          </div>
          <DialogFooter>
              <Button onClick={handleSetTimer}>Démarrer le minuteur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="p-4 shadow-lg">
        <Label className="text-sm font-medium">Contrôles du minuteur</Label>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="outline" size="icon" onClick={() => dispatch(toggleTimer())} title={timer.isActive ? 'Pause' : 'Play'}>
            {timer.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => dispatch(resetTimer())} title="Réinitialiser">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => dispatch(stopTimer())} title="Arrêter">
            <TimerOff className="w-4 h-4" />
          </Button>
        </div>
    </Card>
  );
}
