// src/components/profile/useProfileForm.ts
'use client';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProfileMutation } from "@/lib/redux/api/entityApi"; // Import from entityApi
import { profileUpdateSchema, type ProfileUpdateSchema } from "@/lib/formValidationSchemas";
import { UserProfile } from "./types";
import { useEffect } from "react";

interface UseProfileFormProps {
  userProfile: UserProfile;
}

export default function useProfileForm({ userProfile }: UseProfileFormProps) {
  const { toast } = useToast();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileUpdateSchema>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: userProfile.name ?? '',
      surname: userProfile.surname ?? '',
      username: userProfile.user.username,
      email: userProfile.user.email,
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      img: userProfile.user.img || null,
      password: '',
      twoFactorEnabled: userProfile.user.twoFactorEnabled || false,
    },
  });

  const imgUrl = watch("img");
  const twoFactorEnabled = watch("twoFactorEnabled");
  
  const onSubmit: SubmitHandler<ProfileUpdateSchema> = async (data) => {
    // Create a payload with all form data.
    const payload: Partial<ProfileUpdateSchema> = { ...data };
    
    // If the password is empty, remove it from the payload to avoid sending it.
    if (!payload.password || payload.password.trim() === '') {
      delete payload.password;
    }

    try {
      await updateProfile(payload).unwrap();
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Échec de la mise à jour',
        description: error.data?.message || error.message || "Une erreur est survenue.",
      });
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    onSubmit,
    setValue,
    imgUrl,
    twoFactorEnabled,
  };
};
