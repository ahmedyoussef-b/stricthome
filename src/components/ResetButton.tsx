// src/components/ResetButton.tsx
"use client";

import { useState } from 'react';
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
import { Loader2, RefreshCw, Construction } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetAllStudentData, resetPeriodicData } from '@/lib/actions/teacher.actions';

export function ResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const [isMaintaining, setIsMaintaining] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setIsResetting(true);
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
    } finally {
      setIsResetting(false);
    }
  };
  
  const handleMaintenance = async () => {
    setIsMaintaining(true);
    try {
        const result = await resetPeriodicData();
        toast({
            title: "Maintenance réussie",
            description: result.message,
        });
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Erreur de maintenance",
            description: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
        });
    } finally {
        setIsMaintaining(false);
    }
  }

  const isPending = isResetting || isMaintaining;

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
          <AlertDialogTitle>Zone d'Administration</AlertDialogTitle>
          <AlertDialogDescription>
            Choisissez une action de maintenance. Attention, certaines actions sont irréversibles.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 my-4">
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2"><Construction className="h-4 w-4 text-blue-500" /> Maintenance Quotidienne</h4>
                <p className="text-sm text-muted-foreground mt-1">
                    Réinitialise les points journaliers/hebdo/mensuels et les séries. Simule le passage à un nouveau jour.
                </p>
                 <Button onClick={handleMaintenance} disabled={isPending} className="w-full mt-3" variant="secondary">
                    {isMaintaining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Construction className="mr-2 h-4 w-4" />}
                    Lancer la maintenance
                </Button>
            </div>

            <div className="p-4 border-destructive border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 text-destructive"><RefreshCw className="h-4 w-4" /> Remise à Zéro Complète</h4>
                <p className="text-sm text-muted-foreground mt-1">
                    Action irréversible. Supprime toutes les progressions et réinitialise les points de tous les élèves. Idéal pour un nouveau trimestre.
                </p>
                 <Button onClick={handleReset} disabled={isPending} className="w-full mt-3" variant="destructive">
                    {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Confirmer la remise à zéro
                </Button>
            </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Fermer</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
