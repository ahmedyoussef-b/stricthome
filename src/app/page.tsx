// src/app/page.tsx
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthSession } from '@/lib/session';
import { ArrowRight, BookOpen, UserCheck, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPublicAnnouncements } from '@/lib/actions/announcement.actions';
import { format } from 'date-fns';
import { AnnouncementWithAuthor } from '@/lib/types';

export default async function HomePage() {
  const session = await getAuthSession();
  const announcements = await getPublicAnnouncements(3);

  // Redirect logged-in users to their respective dashboards
  if (session?.user) {
    if (session.user.role === 'PROFESSEUR') {
      redirect('/teacher');
    } else if (session.user.role === 'ELEVE') {
      redirect(`/student/${session.user.id}`);
    }
  }

  // Render homepage content for non-logged-in users
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header user={null} />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 sm:py-32 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-primary">
            Classroom Connector
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Une plateforme innovante pour connecter professeurs et élèves, personnaliser l'apprentissage et explorer des futurs passionnants.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">
                Accéder à la plateforme <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Annonces Récentes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {announcements.map((annonce: AnnouncementWithAuthor) => (
                  <Card key={annonce.id}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Megaphone className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>{annonce.title}</CardTitle>
                      </div>
                       <CardDescription>{format(new Date(annonce.createdAt), 'dd MMMM yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{annonce.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités Clés</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <UserCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Tableaux de Bord par Rôle</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>Des interfaces distinctes et optimisées pour les professeurs et les élèves, offrant les outils adaptés à chaque besoin.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Librairie de Métiers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>Un catalogue de carrières avec des thèmes visuels uniques pour inspirer les élèves et personnaliser leur environnement d'apprentissage.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <ArrowRight className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Sessions Interactives</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>Lancez des sessions vidéo en direct avec un ou plusieurs élèves pour un enseignement ciblé et un support en temps réel.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Classroom Connector. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
