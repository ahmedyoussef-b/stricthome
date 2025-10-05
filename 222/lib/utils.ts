
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueUserId(userType: 'teacher' | 'student' | string, baseId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  // Utiliser seulement les 8 premiers caractères de l'ID de base pour la lisibilité
  return `${userType}-${baseId.substring(0, 8)}-${timestamp}-${random}`;
}
