// src/lib/constants.ts
import { 
  Home, Calendar, BarChart, BookUser, GraduationCap, Users, Book, School, 
  BookCopy, PencilLine, ClipboardList, BookCheck, ClipboardCheck, MessageSquare, 
  Megaphone, UserCircle, Settings 
} from 'lucide-react';
import type { SessionTemplate } from '@/lib/redux/slices/session/types';
import { Role } from '@/types';

export const ITEM_PER_PAGE = 10;
export const SESSION_COOKIE_NAME = 'appSessionToken';

export const dayLabels: Record<string, string> = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche',
};

// Keywords to identify subjects that should be taught in labs/split groups
export const labSubjectKeywords: string[] = ['physique', 'informatique', 'sciences', 'technique'];
export const sectionOptions: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
export const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const attendanceMap: { [key: string]: { present: number; absent: number } } = {
  Lun: { present: 0, absent: 0 },
  Mar: { present: 0, absent: 0 },
  Mer: { present: 0, absent: 0 },
  Jeu: { present: 0, absent: 0 },
  Ven: { present: 0, absent: 0 },
  Sam: { present: 0, absent: 0 },
};

export const menuItems: Array<{
  title: string;
  items: Array<{
    icon: React.ElementType;
    label: string;
    href: string;
    visible: Role[]; 
  }>;
}> = [
  {
    title: "MENU",
    items: [
      { icon: Home, label: "Accueil", href: "/accueil", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.AGENT_ADMINISTRATIF], },
      { icon: Calendar, label: "Planificateur", href: "/shuddle", visible: [Role.ADMIN], },
      { icon: BarChart, label: "Rapports", href: "/admin/reports", visible: [Role.ADMIN], },
      { icon: BookUser, label: "Enseignants", href: "/list/teachers", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: GraduationCap, label: "Étudiants", href: "/list/students", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: Users, label: "Parents", href: "/list/parents", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: Book, label: "Matières", href: "/list/subjects", visible: [Role.ADMIN], },
      { icon: School, label: "Classes", href: "/list/classes", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: BookCopy, label: "Cours", href: "/list/lessons", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: PencilLine, label: "Examens", href: "/list/exams", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: ClipboardList, label: "Devoirs", href: "/list/assignments", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: BookCheck, label: "Résultats", href: "/list/results", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: ClipboardCheck, label: "Présence", href: "/list/attendance", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: Calendar, label: "Événements", href: "/list/events", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: MessageSquare, label: "Chatroom", href: "/list/chatroom", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT] },
      { icon: MessageSquare, label: "Messages", href: "/list/messages", visible: [Role.ADMIN, Role.TEACHER, Role.PARENT] },
      { icon: Megaphone, label: "Annonces", href: "/list/announcements", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
    ],
  },
  {
    title: "AUTRE",
    items: [
      { icon: UserCircle, label: "Profil", href: "/profile", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.AGENT_ADMINISTRATIF], },
      { icon: Settings, label: "Paramètres", href: "/settings", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.AGENT_ADMINISTRATIF], },
    ],
  },
];

export const SESSION_TEMPLATES: SessionTemplate[] = [];
