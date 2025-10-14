// src/components/landing/LandingPage.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const features = [
  {
    title: "Planification Intelligente",
    description: "Générez des emplois du temps optimisés en quelques clics grâce à notre assistant intelligent."
  },
  {
    title: "Gestion Simplifiée",
    description: "Centralisez la gestion des classes, des enseignants, des élèves et des matières."
  },
  {
    title: "Communication Fluide",
    description: "Facilitez les échanges entre enseignants, parents et administration grâce à la messagerie intégrée."
  },
  {
    title: "Sessions Interactives",
    description: "Engagez les élèves avec des chatrooms, des quiz et des sondages en temps réel."
  }
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center shadow-sm">
        <Link href="/" className="flex items-center justify-center">
          <SchoolIcon className="h-6 w-6 text-primary" />
          <span className="sr-only">Edu-Plateforme Scolaire</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Connexion
          </Link>
          <Button asChild>
            <Link href="/register">S'inscrire</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    La plateforme scolaire tout-en-un pour l'école de demain
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Gérez emplois du temps, communication et vie scolaire avec une facilité déconcertante. Conçu pour les administrateurs, les enseignants et les parents.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/register">Commencer</Link>
                  </Button>
                </div>
              </div>
              <Image
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                height="550"
                src="https://picsum.photos/550/550"
                width="550"
                data-ai-hint="school students classroom"
              />
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Fonctionnalités Clés</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Tout ce dont votre établissement a besoin</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  De la planification à la communication, notre plateforme centralise tous les outils pour une gestion scolaire efficace et sereine.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Edu-Plateforme Scolaire. Tous droits réservés.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Conditions d'utilisation
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Confidentialité
          </Link>
        </nav>
      </footer>
    </div>
  );
}

function SchoolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 22v-4a2 2 0 1 0-4 0v4" />
      <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
      <path d="M18 5v17" />
      <path d="m6 5 6-3 6 3" />
      <path d="M6 5v17" />
      <path d="M12 5v17" />
    </svg>
  )
}
