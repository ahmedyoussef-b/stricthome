//srccomponents/profile/PersonalInfoCard.tsx

'use client';
import React from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Home, UploadCloud } from 'lucide-react';
import DynamicAvatar from '@/components/DynamicAvatar';
import { UserProfile, CloudinaryUploadWidgetResults, CloudinaryUploadWidgetInfo, ProfileUpdateSchema } from './types';
import FormError from '@/components/forms/FormError';
import { CldUploadWidget } from 'next-cloudinary';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface PersonalInfoCardProps {
  register: UseFormRegister<ProfileUpdateSchema>;
  errors: FieldErrors<ProfileUpdateSchema>;
  isLoading: boolean;
  setValue: UseFormSetValue<ProfileUpdateSchema>;
  imgUrl: string | null;
  userProfile: UserProfile;
}

const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  register,
  errors,
  isLoading,
  setValue,
  imgUrl,
  userProfile,
}) => {
  const { toast } = useToast();

  const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === "success" && typeof result.info === 'object' && result.info !== null && 'secure_url' in result.info) {
      const info = result.info as CloudinaryUploadWidgetInfo;
      setValue("img", info.secure_url, { shouldValidate: true, shouldDirty: true });
       toast({ title: "Photo mise à jour", description: "Cliquez sur 'Sauvegarder les modifications' pour enregistrer." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Personnelles</CardTitle>
        <CardDescription>Détails visibles sur votre profil public.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center gap-4">
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
            onSuccess={handleUploadSuccess}
            onError={(error) => toast({ variant: "destructive", title: "Échec du téléversement", description: "Veuillez vérifier votre configuration Cloudinary."})}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                disabled={isLoading}
                className="relative group cursor-pointer"
              >
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20">
                  <DynamicAvatar 
                    imageUrl={imgUrl}
                    seed={userProfile.user.id}
                    isLCP={true}
                  />
                   <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <UploadCloud className="h-8 w-8 text-white" />
                      <span className="text-xs text-white mt-1">Changer</span>
                  </div>
                </div>
              </button>
            )}
          </CldUploadWidget>
           <FormError error={errors.img} />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userProfile.user.role !== 'STUDENT' && (
            <>
              <div>
                <Label htmlFor="name">Prénom</Label>
                <Input id="name" {...register("name")} disabled={isLoading} />
                <FormError error={errors.name} />
              </div>
              <div>
                <Label htmlFor="surname">Nom</Label>
                <Input id="surname" {...register("surname")} disabled={isLoading} />
                <FormError error={errors.surname} />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="phone" className="flex items-center"><Phone size={14} className="mr-2"/>Téléphone</Label>
            <Input id="phone" {...register("phone")} disabled={isLoading} />
            <FormError error={errors.phone} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address" className="flex items-center"><Home size={14} className="mr-2"/>Adresse</Label>
            <Input id="address" {...register("address")} disabled={isLoading} />
            <FormError error={errors.address} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoCard;
