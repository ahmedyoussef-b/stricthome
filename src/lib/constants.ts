// src/lib/constants.ts
import {
    LayoutDashboard,
    Users,
    Edit,
    CheckCircle,
    Rocket,
    Megaphone,
    UserCircle,
    Settings,
    RefreshCw
} from 'lucide-react';
import type { Role } from '@prisma/client';
import { CreateAnnouncementForm } from '@/components/CreateAnnouncementForm';
import { ResetButton } from '@/components/ResetButton';

// Définition des éléments de menu pour une configuration centralisée
export const menuItems = [
    {
        title: "Principal",
        items: [
            { 
                label: "Tableau de Bord", 
                href: "/teacher", 
                icon: LayoutDashboard,
                roles: ['PROFESSEUR'] as Role[],
            },
            { 
                label: "Gérer les Classes", 
                href: "/teacher/classes", 
                icon: Users,
                roles: ['PROFESSEUR'] as Role[],
            },
            { 
                label: "Validations", 
                href: "/teacher/validations", 
                icon: CheckCircle,
                roles: ['PROFESSEUR'] as Role[],
            },
            { 
                label: "Gérer les Tâches", 
                href: "/teacher/tasks", 
                icon: Edit,
                roles: ['PROFESSEUR'] as Role[],
            },
             { 
                label: "Classe du Futur", 
                href: "/teacher/future-classroom", 
                icon: Rocket,
                roles: ['PROFESSEUR'] as Role[],
            },
        ],
    },
    {
        title: "Actions",
        items: [
            { 
                label: "Créer une Annonce", 
                component: CreateAnnouncementForm,
                roles: ['PROFESSEUR'] as Role[],
            },
            {
                label: "Remise à zéro",
                component: ResetButton,
                roles: ['PROFESSEUR'] as Role[],
            }
        ]
    },
    {
        title: "Utilisateur",
        items: [
            { 
                label: "Profil", 
                href: "/profile", // Lien générique pour le profil
                icon: UserCircle,
                roles: ['PROFESSEUR'] as Role[],
            },
            { 
                label: "Paramètres", 
                href: "/settings", // Lien générique pour les paramètres
                icon: Settings,
                roles: ['PROFESSEUR'] as Role[],
            },
        ],
    },
];
