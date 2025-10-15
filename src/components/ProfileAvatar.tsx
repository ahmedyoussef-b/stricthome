// src/components/ProfileAvatar.tsx
'use client';

import { useTransition } from 'react';
import { User } from 'next-auth';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CloudinaryUploadWidget } from '@/components/CloudinaryUploadWidget';
import { updateUserProfileImage } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Camera, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ProfileAvatarProps {
  user: User;
  isInteractive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ProfileAvatar({ user, isInteractive = false, className, children }: ProfileAvatarProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { update } = useSession();

  const handleUploadSuccess = (result: any) => {
    console.log('👤 [AVATAR] handleUploadSuccess déclenché avec le résultat :', result);
    const imageUrl = result.info.secure_url;
    if (!imageUrl) {
        console.error('❌ [AVATAR] Aucune URL sécurisée trouvée dans le résultat de l\'upload.');
        toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Aucune URL d\'image n\'a été reçue.'
        });
        return;
    }

    startTransition(async () => {
      try {
        console.log(`🚀 [AVATAR] Appel de l'action serveur updateUserProfileImage avec l'URL: ${imageUrl}`);
        const updatedUser = await updateUserProfileImage(imageUrl);
        console.log('✅ [AVATAR] Action serveur terminée. Utilisateur mis à jour reçu :', updatedUser);
        
        console.log('🔄 [AVATAR] Déclenchement de la mise à jour de la session client...');
        await update(); 
        console.log('✅ [AVATAR] Mise à jour de la session client terminée.');

        toast({
          title: 'Photo de profil mise à jour!',
        });
      } catch (error) {
        console.error('❌ [AVATAR] Erreur lors de la transition :', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: "Impossible de mettre à jour l'image.",
        });
      }
    });
  };

  const interactiveAvatar = (
    <CloudinaryUploadWidget onUpload={handleUploadSuccess}>
      {({ open }) => (
        <div onClick={children ? undefined : open} className={cn("relative group cursor-pointer", !children && "block")}>
           {children ? <div onClick={open}>{children}</div> : null}
           {!children && (
            <>
                 <Avatar className={cn("h-10 w-10", className)}>
                    {user.image ? (
                        <Image src={user.image} alt={user.name ?? 'Avatar'} width={40} height={40} className="object-cover" />
                    ) : (
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    )}
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                        <Camera className="h-5 w-5 text-white" />
                    )}
                </div>
            </>
           )}
        </div>
      )}
    </CloudinaryUploadWidget>
  );

  const staticAvatar = (
    <Avatar className={cn("h-10 w-10", className)}>
      {user.image ? (
        <Image src={user.image} alt={user.name ?? 'Avatar'} width={40} height={40} className="object-cover" />
      ) : (
        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
      )}
    </Avatar>
  );

  return isInteractive ? interactiveAvatar : staticAvatar;
}
