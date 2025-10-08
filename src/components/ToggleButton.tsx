// src/components/ToggleButton.tsx
"use client";

import { useState, useTransition } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { endAllActiveSessionsForTeacher } from '@/lib/actions/teacher.actions';

export function ToggleButton() {
  const [isActive, setIsActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClick = () => {
    const newIsActive = !isActive;
    
    startTransition(async () => {
        setIsActive(newIsActive); // Optimistic update
        try {
            // If we are activating the card, first end all active sessions.
            if (newIsActive) {
                await endAllActiveSessionsForTeacher();
                 toast({
                  title: "Sessions précédentes terminées",
                  description: "Toutes les invitations actives ont été annulées.",
                  variant: "default",
                });
            }

            const response = await fetch('/api/trigger-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newIsActive }),
            });

            if (!response.ok) {
                throw new Error('Server responded with an error');
            }

            toast({
              title: newIsActive ? "Carte spéciale activée" : "Carte spéciale désactivée",
              description: `La carte est maintenant ${newIsActive ? 'visible' : 'cachée'} pour les élèves.`,
            });

        } catch (error) {
            // Rollback state on error
            setIsActive(!newIsActive);
            toast({
              variant: "destructive",
              title: "Erreur de diffusion",
              description: "Impossible de mettre à jour l'état pour les élèves.",
            });
        }
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'text-white transition-colors duration-300',
        isActive 
          ? 'bg-red-custom hover:bg-red-custom/90' 
          : 'bg-orange-custom hover:bg-orange-custom/90'
      )}
    >
      {isPending ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : isActive ? (
        <AlertTriangle className="mr-2" />
      ) : (
        <CheckCircle className="mr-2" />
      )}
      {isActive ? 'Carte Activée' : 'Carte Désactivée'}
    </Button>
  );
}
