'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';
import { useToast } from '@/hooks/use-toast';
import { CloudinaryUploadWidgetInfo, CloudinaryUploadWidgetResults } from './types';

interface ImageUploadProps {
  setValue: (name: string, value: any, options?: any) => void;
  isLoading: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ setValue, isLoading }) => {
  const { toast } = useToast();

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
      onSuccess={(result: CloudinaryUploadWidgetResults) => {
        if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
          const info = result.info as CloudinaryUploadWidgetInfo;
          setValue("img", info.secure_url, { shouldValidate: true, shouldDirty: true });
        }
      }}
      onError={(error) => {
        console.error("Cloudinary Upload Error:", error);
        toast({
          variant: "destructive",
          title: "Échec du téléversement",
          description: "Veuillez vérifier que votre 'upload preset' est configuré pour les téléversements non signés.",
          duration: 10000,
        });
      }}
    >
      {({ open }) => (
        <Button type="button" variant="outline" onClick={() => open()} disabled={isLoading} className="text-xs w-full">
          <Upload className="mr-2" size={14} /> Changer la photo
        </Button>
      )}
    </CldUploadWidget>
  );
};

export default ImageUpload;
