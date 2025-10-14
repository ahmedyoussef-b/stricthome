// src/components/dashboard/admin/AdminActionCards.tsx
import Link from "next/link";
import { Wand2, Presentation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Role as AppRole } from "@/types";
import Clock3D from "@/components/dashboard/admin/Clock3D";

const adminSections = [
  { 
    title: "Générateur d'Emploi du Temps", 
    href: "/shuddle", 
    icon: Wand2, 
    description: "Lancer l'assistant pour configurer les entités et générer un emploi du temps optimisé.",
    visible: [AppRole.ADMIN]
  },
  { 
    title: "Tableau de Bord Chatroom", 
    href: "/admin/chatroom", 
    icon: Presentation, 
    description: "Consulter les statistiques d'utilisation de la Chatroom et lancer des réunions.",
    visible: [AppRole.ADMIN]
  }
];

const AdminActionCards = () => {
  console.log("👑 [AdminActionCards] Rendu des cartes d'action.");
  return (
    <>
      {adminSections.map((section) => (
        <Link href={section.href} key={section.title} className="block group col-span-1">
          <Card className="h-full shadow-lg hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <section.icon className="h-8 w-8 text-accent" />
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
      <Card className="h-full shadow-lg hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center p-4 bg-card relative overflow-hidden">
        <Clock3D />
      </Card>
    </>
  );
};

export default AdminActionCards;
