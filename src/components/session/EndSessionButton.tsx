// src/components/session/EndSessionButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff } from 'lucide-react';
import { endCoursSession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface EndSessionButtonProps {
  sessionId: string;
}

export function EndSessionButton({ sessionId }: EndSessionButtonProps) {
  const [isEnding, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEndSession = () => {
    startTransition(async () => {
      try {
        await endCoursSession(sessionId);
        toast({
          title: "Session terminée",
          description: "La session a été terminée pour tous les participants.",
        });
        // La redirection sera gérée par la logique de la page principale
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de terminer la session.",
        });
      }
    });
  };

  return (
    <Button variant="destructive" onClick={handleEndSession} disabled={isEnding}>
      {isEnding ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <PhoneOff className="mr-2 h-4 w-4" />
      )}
      Terminer la session
    </Button>
  );
}
