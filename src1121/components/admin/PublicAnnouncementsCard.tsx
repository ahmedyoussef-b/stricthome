// src/components/admin/PublicAnnouncementsCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Trash2, GalleryHorizontal, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

interface AnnouncementFile {
  url: string;
  type: string;
}

interface PublicAnnouncement {
  id: number;
  title: string;
  date: string;
  files: AnnouncementFile[];
}

export default function PublicAnnouncementsCard() {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/public-announcements');
      if (!response.ok) {
        throw new Error("Impossible de charger les annonces.");
      }
      const data = await response.json();
      setAnnouncements(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const response = await fetch('/api/public-announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "La suppression a échoué.");
      }
      
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      toast({
        title: "Annonce supprimée",
        description: "L'annonce publique a été supprimée avec succès.",
      });

    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: e.message,
      });
    } finally {
      setDeletingId(null);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
       return (
        <div className="flex flex-col items-center justify-center h-full text-destructive">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <p>Erreur: {error}</p>
          <Button onClick={fetchAnnouncements} variant="outline" size="sm" className="mt-4">Réessayer</Button>
        </div>
      );
    }

    if (announcements.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <GalleryHorizontal className="h-12 w-12 mb-4 text-gray-300" />
          <h3 className="text-lg font-medium">Aucune annonce publique</h3>
          <p className="text-sm">Publiez une annonce pour la voir ici.</p>
        </div>
      );
    }
    
    return (
      <ScrollArea className="h-full pr-3">
        <div className="flex flex-col gap-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{ann.title}</h4>
                  <p className="text-xs text-muted-foreground">{new Date(ann.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" disabled={deletingId === ann.id}>
                        {deletingId === ann.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ?</AlertDialogTitle>
                      <AlertDialogDescription>Cette action est irréversible et supprimera l'annonce "{ann.title}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(ann.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="mt-2">
                {ann.files.length === 1 && ann.files[0].type === 'image' && (
                  <Link href={ann.files[0].url} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md relative aspect-video group">
                     <Image src={ann.files[0].url} alt={ann.title} fill sizes="300px" className="rounded-md object-cover group-hover:opacity-90 transition-opacity" />
                  </Link>
                )}
                 {ann.files.length === 1 && ann.files[0].type !== 'image' && (
                  <Link href={ann.files[0].url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <FileText className="h-4 w-4"/> Voir le document
                  </Link>
                )}
                {ann.files.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {ann.files.map((file, idx) => (
                      <Link key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square group">
                        <Image src={file.url} alt={`${ann.title} - ${idx + 1}`} fill sizes="100px" className="rounded-md object-cover"/>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className="h-full min-h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Annonces Publiques Récentes</CardTitle>
        <CardDescription>Les 10 dernières annonces publiées.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
