// src/app/[locale]/(dashboard)/list/messages/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, User, Users, Book } from "lucide-react";
import Link from 'next/link';
import { getServerSession } from "@/lib/auth-utils";
import { Role } from "@/types";

export default async function MessagesPage() {
  const session = await getServerSession();
  const userRole = session?.user?.role;
  const locale = 'fr';

  const renderContent = () => {
    switch(userRole) {
      case Role.ADMIN:
      case Role.TEACHER:
        return (
          <>
            <CardDescription className="px-6">
              Pour envoyer un message à un parent, veuillez vous rendre sur la page des parents et utiliser l'icône de message sur la carte du parent concerné.
            </CardDescription>
            <CardContent className="mt-4">
               <Link href={`/list/parents`}>
                 <Button className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Aller à la liste des Parents
                    <ArrowRight className="ml-auto h-4 w-4" />
                 </Button>
               </Link>
            </CardContent>
          </>
        );
      case Role.PARENT:
        return (
          <>
            <CardDescription className="px-6">
              Pour envoyer un message à un enseignant, veuillez vous rendre sur la page des enseignants et utiliser l'icône de message sur la carte de l'enseignant concerné.
            </CardDescription>
            <CardContent className="mt-4">
               <Link href={`/list/teachers`}>
                 <Button className="w-full">
                    <Book className="mr-2 h-4 w-4" />
                    Aller à la liste des Enseignants
                    <ArrowRight className="ml-auto h-4 w-4" />
                 </Button>
               </Link>
            </CardContent>
          </>
        );
      case Role.STUDENT:
      default:
        return (
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>La messagerie directe n'est pas disponible pour votre rôle pour le moment.</p>
            </div>
          </CardContent>
        );
    }
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Messagerie</CardTitle>
            </div>
          </div>
        </CardHeader>
        {renderContent()}
      </Card>
    </div>
  );
}
