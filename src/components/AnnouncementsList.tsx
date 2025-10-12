// src/components/AnnouncementsList.tsx
import { AnnouncementWithAuthor } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Megaphone, Download } from 'lucide-react';
import Link from 'next/link';

interface AnnouncementsListProps {
  announcements: AnnouncementWithAuthor[];
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  if (announcements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone />
            Annonces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">Aucune annonce pour le moment.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone />
          Annonces Récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {announcements.map((annonce) => (
            <div key={annonce.id} className="border-b pb-4 last:border-b-0 last:pb-0">
              <h3 className="font-semibold">{annonce.title}</h3>
              <p className="text-sm mt-1">{annonce.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Par {annonce.author.name} - {format(new Date(annonce.createdAt), 'dd MMM yyyy')}
              </p>
              {annonce.attachmentUrl && (
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={annonce.attachmentUrl} target="_blank" download>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger la pièce jointe
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
