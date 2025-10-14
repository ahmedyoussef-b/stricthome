import type { Teacher, Student, Parent, Admin, Role } from "@/types";
import { ProfileUpdateSchema } from "@/types/schemas";

export type UserProfile = (Teacher | Student | Parent | Admin) & {
  user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    img: string | null;
    twoFactorEnabled?: boolean | null;
  };
  address?: string | null; // Add address as an optional property
};

export interface CloudinaryUploadWidgetInfo {
  secure_url: string;
}

export interface CloudinaryUploadWidgetResults {
  event?: "success" | string; // Marked event as optional
  info?: any; // Simplified info type to any
}

export const roleTranslations: { [key in Role]: string } = {
  ADMIN: "Administrateur",
  TEACHER: "Enseignant",
  STUDENT: "Étudiant",
  PARENT: "Parent",
  VISITOR: "Visiteur",
};

export interface ProfileFormReturn {
  register: any;
  handleSubmit: any;
  errors: any;
  isLoading: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  setValue: any;
  imgUrl: string | null;
  twoFactorEnabled: boolean;
}

export type { ProfileUpdateSchema };
