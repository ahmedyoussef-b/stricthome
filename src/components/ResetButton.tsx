// src/components/ResetButton.tsx
"use client";

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetAllStudentData } from '@/lib/actions/teacher.actions';

export function ResetButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleReset = () => {
    startTransition(async () => {
      try {
        const result = await resetAllStudentData();
        toast({
          title: "Réinitialisation réussie",
          description: result.message,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur de réinitialisation",
          description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <RefreshCw className="mr-2 h-4 w-4" />
          Remise à zéro
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr(e) ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Elle supprimera toutes les progressions,
            réinitialisera tous les classements et remettra les points de tous les élèves à zéro.
            Les comptes élèves et les classes ne seront pas supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer la remise à zéro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
