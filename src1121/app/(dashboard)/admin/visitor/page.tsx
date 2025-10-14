// src/app/[locale]/(dashboard)/admin/visitor/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GalleryHorizontal, Megaphone } from 'lucide-react';
import PublicAnnouncementForm from '@/components/admin/PublicAnnouncementForm';
import PublicAnnouncementsCard from "@/components/admin/PublicAnnouncementsCard"; // We'll show the list here as well

export default function VisitorContentPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion du Contenu Visiteur</h1>
        <p className="text-muted-foreground mt-1">
          Publiez des annonces publiques, des galeries d'événements et gérez le contenu visible par tous.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Publier une Annonce ou une Galerie</CardTitle>
                    <CardDescription>
                       Téléversez un ou plusieurs fichiers (PDF, images) pour créer une annonce publique ou une galerie d'événement.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PublicAnnouncementForm />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <PublicAnnouncementsCard />
        </div>
      </div>
    </div>
  );
}
