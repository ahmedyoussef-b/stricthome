import prisma from "@/lib/prisma";
import type { Role } from "@/types/index"; 
import { MoreHorizontal } from 'lucide-react';

const UserCard = async ({
  type,
  bgColorClass, // Nouvelle prop pour la couleur de fond
}: {
  type: Role;
  bgColorClass: string; // Tailwind CSS class for background
}) => {
  console.log(`👥 [UserCard] Récupération du nombre d'utilisateurs pour le rôle : ${type}`);
  let count = 0;
  try {
    switch (type) {
      case "ADMIN":
        count = await prisma.admin.count();
        break;
      case "TEACHER":
        count = await prisma.teacher.count();
        break;
      case "STUDENT":
        count = await prisma.student.count();
        break;
      case "PARENT":
        count = await prisma.parent.count();
        break;
      case "VISITOR":
        count = await prisma.user.count({ where: { role: "VISITOR" } });
        break;
      default:
        console.warn(`[UserCard] Type de rôle inattendu reçu : ${type}`);
        count = 0;
    }
    console.log(`👥 [UserCard] Rôle ${type} a ${count} utilisateur(s).`);
  } catch (error) {
    console.error(`❌ [UserCard] Erreur lors de la récupération du nombre pour le rôle ${type}:`, error);
  }


  const roleTranslations: { [key in Role]?: string } = {
    ADMIN: "Administrateurs",
    TEACHER: "Enseignants",
    STUDENT: "Étudiants",
    PARENT: "Parents",
    VISITOR: "Visiteurs",
  };

  const typeDisplay = roleTranslations[type] || (type.charAt(0) + type.slice(1).toLowerCase() + 's');

  return (
    <div className={`rounded-2xl ${bgColorClass} p-4 flex-1 min-w-[130px] shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white/70 px-2 py-1 rounded-full text-gray-700 font-semibold">
          2024/25 {/* This could be dynamic */}
        </span>
        <MoreHorizontal className="w-5 h-5 text-white/70" />
      </div>
      <h1 className="text-3xl font-semibold my-4 text-white text-center">{count}</h1>
      <h2 className="text-sm font-medium text-gray-100">{typeDisplay}</h2>
    </div>
  );
};

export default UserCard;
