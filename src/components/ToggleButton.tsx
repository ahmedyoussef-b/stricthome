// src/components/ToggleButton.tsx
"use client";

import { useState, useTransition } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { endAllActiveSessionsForTeacher } from '@/lib/actions';

export function ToggleButton() {
  const [isActive, setIsActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClick = () => {
    const newIsActive = !isActive;
    
    startTransition(async () => {
        try {
            // First, end any active sessions regardless of the new state
            await endAllActiveSessionsForTeacher();
            
            // Only show a toast for ending sessions if we are deactivating the card
            // or if we are activating it (to confirm cleanup)
            if (isActive) { // About to become inactive
                 toast({
                  title: "Sessions terminées",
                  description: "Toutes les invitations de session actives ont été annulées.",
                  variant: "default",
                });
            }

            // Then, trigger the card visibility
            const response = await fetch('/api/trigger-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newIsActive }),
            });

            if (!response.ok) {
                throw new Error('Server responded with an error');
            }
            
            // Finally, update the button state and show confirmation
            setIsActive(newIsActive); 
            toast({
              title: newIsActive ? "Carte spéciale activée" : "Carte spéciale désactivée",
              description: `La carte est maintenant ${newIsActive ? 'visible' : 'cachée'} pour les élèves.`,
            });

        } catch (error) {
            // Don't rollback state here, as the button state might be out of sync
            // with the actual server state. Just show an error.
            toast({
              variant: "destructive",
              title: "Erreur de diffusion",
              description: "Impossible de mettre à jour l'état pour les élèves. L'état peut être incohérent.",
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
