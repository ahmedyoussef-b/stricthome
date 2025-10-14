// src/components/wizard/ScenarioManager.tsx
'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { useToast } from '@/hooks/use-toast';
import {
    useGetAllDraftsQuery,
    useCreateDraftMutation,
    useUpdateDraftMutation,
    useDeleteDraftMutation,
    useActivateDraftMutation,
} from '@/lib/redux/api/draftApi';
import { setInitialData } from '@/lib/redux/features/wizardSlice';
import useWizardData from '@/hooks/useWizardData';
import { selectActiveDraft, setActiveDraft as setActiveDraftAction } from '@/lib/redux/features/scheduleDraftSlice';
import { parseDraftToWizardData, serializeWizardDataForUpdate } from '@/lib/draft-utils'; // Import new utils

// UI Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Loader2, CheckCircle, Trash2, Save } from 'lucide-react';
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


export default function ScenarioManager() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const wizardData = useWizardData();
  const activeDraft = useAppSelector(selectActiveDraft);

  // RTK Query Hooks
  const { data: drafts = [], isLoading: isLoadingDrafts } = useGetAllDraftsQuery();
  const [createDraft, { isLoading: isCreating }] = useCreateDraftMutation();
  const [updateDraft, { isLoading: isUpdating }] = useUpdateDraftMutation();
  const [deleteDraft, { isLoading: isDeleting }] = useDeleteDraftMutation();
  const [activateDraft, { isLoading: isActivating }] = useActivateDraftMutation();


  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');

  const isLoading = isCreating || isUpdating || isDeleting || isActivating;

  const handleCreate = async () => {
    if (!newScenarioName.trim()) {
      toast({ variant: 'destructive', title: 'Nom du scénario requis' });
      return;
    }

    try {
        const payload = serializeWizardDataForUpdate({
            ...wizardData,
            name: newScenarioName,
            description: newScenarioDesc,
        });
        
        const newDraftData = await createDraft(payload as any).unwrap();
        
        const wizardFormatData = await parseDraftToWizardData(newDraftData);
        dispatch(setActiveDraftAction(newDraftData));
        dispatch(setInitialData(wizardFormatData));

        toast({ title: 'Nouveau scénario créé et activé' });
        setNewScenarioName('');
        setNewScenarioDesc('');
        setIsDialogOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.data?.message || "Impossible de créer le scénario." });
    }
  };

  const handleLoad = async (draftId: string) => {
    try {
        const draftToLoad = drafts.find(d => d.id === draftId);
        if (!draftToLoad) throw new Error("Scénario non trouvé.");

        await activateDraft(draftId).unwrap();

        const wizardFormatData = await parseDraftToWizardData(draftToLoad);
        dispatch(setActiveDraftAction(draftToLoad));
        dispatch(setInitialData(wizardFormatData));
        toast({ title: 'Scénario activé', description: "Les données du scénario ont été chargées." });
        setIsDialogOpen(false);
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Erreur', description: error.data?.message || "Impossible de charger le scénario." });
    }
  };

  const handleDelete = async (draftId: string) => {
    try {
        await deleteDraft(draftId).unwrap();
        toast({ title: 'Scénario supprimé' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.data?.message || "Impossible de supprimer le scénario." });
    }
  };
  
  const handleSave = async () => {
    if (!activeDraft) return;

    try {
        // Prepare the payload including the active draft's ID.
        const payload = serializeWizardDataForUpdate({
            ...wizardData,
            id: activeDraft.id, 
            name: activeDraft.name,
            description: activeDraft.description,
        });

        const updatedDraftData = await updateDraft(payload).unwrap();
        
        dispatch(setActiveDraftAction(updatedDraftData));
        toast({ title: 'Scénario sauvegardé', description: `Vos modifications pour "${activeDraft.name}" ont été sauvegardées.`});
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erreur', description: error.data?.message || "Impossible de sauvegarder le scénario." });
    }
  };


  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleSave} disabled={isLoading || !activeDraft}>
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Sauvegarder
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button><PlusCircle className="mr-2 h-4 w-4"/>Gérer les Scénarios</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gérer les Scénarios d'Emploi du Temps</DialogTitle>
            <DialogDescription>
              Créez, chargez ou supprimez différents scénarios pour expérimenter avec votre emploi du temps.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Nouveau Scénario</h4>
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Nom</Label>
                <Input 
                  id="scenario-name" 
                  value={newScenarioName} 
                  onChange={(e) => setNewScenarioName(e.target.value)} 
                  placeholder="Ex: Plan A - Semestre 1"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenario-desc">Description (Optionnel)</Label>
                <Input 
                  id="scenario-desc" 
                  value={newScenarioDesc} 
                  onChange={(e) => setNewScenarioDesc(e.target.value)}
                  placeholder="Avec contraintes pour les examens..."
                  disabled={isLoading}
                />
              </div>
              <Button onClick={handleCreate} disabled={isLoading || !newScenarioName.trim()} className="w-full">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer et Activer
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Scénarios Sauvegardés</h4>
              <ScrollArea className="h-64 border rounded-lg p-2">
                {isLoadingDrafts ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary"/>
                    </div>
                ) : drafts.length > 0 ? drafts.map(draft => (
                  <div key={draft.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {draft.name}
                          {draft.isActive && <CheckCircle className="h-4 w-4 text-green-500"  />}
                        </p>
                        <p className="text-xs text-muted-foreground">{draft.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleLoad(draft.id)} disabled={draft.isActive || isLoading}>
                            Charger
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={isLoading}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action supprimera définitivement le scénario "{draft.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(draft.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                  </div>
                )) : <p className="text-sm text-center text-muted-foreground py-10">Aucun scénario sauvegardé.</p>}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
