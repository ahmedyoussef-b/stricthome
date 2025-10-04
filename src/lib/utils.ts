
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueUserId(userType: 'teacher' | 'student' | string, baseId: string): string {
  // Using the full user ID is safer to prevent collisions.
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${userType}-${baseId}-${timestamp}-${random}`;
}
