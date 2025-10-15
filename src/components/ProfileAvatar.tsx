// src/components/ProfileAvatar.tsx
'use client';

import { useTransition, useState, useEffect } from 'react';
import { User } from 'next-auth';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const { update, data: session } = useSession();
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Synchroniser l'image locale avec l'utilisateur actuel
  useEffect(() => {
    const safeImageUrl = user.image ?? null;
    console.log('🔄 [AVATAR] Synchronisation image utilisateur:', safeImageUrl);
    setLocalImageUrl(safeImageUrl);
  }, [user.image]);

  const handleUploadSuccess = (result: any) => {
    console.log('=== DÉBUT UPLOAD AVATAR ===');
    
    if (result.event === 'success') {
      const imageUrl = result.info.secure_url || result.info.url;
      console.log('🖼️ [AVATAR] URL image extraite:', imageUrl);
      
      if (!imageUrl) {
        console.error('❌ [AVATAR] Aucune URL valide trouvée');
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Aucune URL d\'image valide reçue.'
        });
        return;
      }

      setIsUploading(true);
      
      // Mettre à jour immédiatement l'image locale pour feedback visuel
      console.log('🎨 [AVATAR] Mise à jour immédiate de l\'image locale');
      setLocalImageUrl(imageUrl);

      startTransition(async () => {
        try {
          console.log('🚀 [AVATAR] Début transition - appel action serveur...');
          
          // Appel de l'action serveur
          const updatedUser = await updateUserProfileImage(imageUrl);
          console.log('✅ [AVATAR] Action serveur réussie:', {
            id: updatedUser.id,
            image: updatedUser.image
          });

          // Mettre à jour la session NextAuth
          console.log('🔄 [AVATAR] Mise à jour session NextAuth...');
          await update();
          console.log('✅ [AVATAR] Session mise à jour');

          // Forcer la mise à jour avec l'image de la base de données
          setLocalImageUrl(updatedUser.image);

          toast({
            title: '✅ Photo mise à jour!',
            description: 'Votre photo de profil a été changée avec succès.',
          });

          console.log('=== UPLOAD AVATAR RÉUSSI ===');

        } catch (error) {
          console.error('❌ [AVATAR] Erreur lors de la mise à jour:', error);
          
          // Revenir à l'ancienne image en cas d'erreur
          const safeUserImage = user.image ?? null;
          setLocalImageUrl(safeUserImage);
          
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: error instanceof Error ? error.message : "Impossible de mettre à jour l'image de profil.",
          });
        } finally {
          setIsUploading(false);
        }
      });
    }
  };

  // Utiliser l'image locale si disponible, sinon l'image de l'utilisateur (avec gestion de undefined)
  const currentImageUrl = localImageUrl ?? (user.image ?? null);

  const interactiveAvatar = (
    <CloudinaryUploadWidget onUpload={handleUploadSuccess}>
      {({ open, loaded }) => (
        <div className="relative">
          <div 
            onClick={(e) => {
              if (!loaded || isUploading) return;
              e.preventDefault();
              e.stopPropagation();
              console.log('📸 [AVATAR] Ouverture widget...');
              open();
            }} 
            className={cn(
              "relative group",
              loaded && !isUploading && "cursor-pointer",
              (!loaded || isUploading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {children ? (
              <div onClick={open}>{children}</div>
            ) : (
              <>
                <Avatar className={cn(
                  "h-10 w-10 transition-all duration-200",
                  loaded && !isUploading && "ring-2 ring-transparent hover:ring-blue-500",
                  className
                )}>
                  {currentImageUrl ? (
                    <>
                      <AvatarImage 
                        src={currentImageUrl} 
                        alt={user.name || 'Avatar'} 
                        className="object-cover"
                        onError={(e) => {
                          console.error('❌ [AVATAR] Erreur chargement image:', currentImageUrl);
                        }}
                        onLoad={() => console.log('✅ [AVATAR] Image chargée avec succès')}
                      />
                      <AvatarFallback className="bg-gray-100">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-gray-100">
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : (
                        user.name?.charAt(0) || 'U'
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Overlay au survol */}
                {loaded && !isUploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                )}
                
                {/* Indicateur de chargement */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Indicateur de chargement du widget */}
          {!loaded && (
            <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      )}
    </CloudinaryUploadWidget>
  );

  const staticAvatar = (
    <Avatar className={cn("h-10 w-10", className)}>
      {currentImageUrl ? (
        <>
          <AvatarImage 
            src={currentImageUrl} 
            alt={user.name || 'Avatar'} 
            className="object-cover"
            onError={(e) => {
              console.error('❌ [AVATAR STATIC] Erreur chargement:', currentImageUrl);
            }}
          />
          <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
        </>
      ) : (
        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
      )}
    </Avatar>
  );

  return isInteractive ? interactiveAvatar : staticAvatar;
}