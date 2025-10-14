"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { CloudinaryUploadWidgetResults } from "@cloudinary-util/types";
import { UseFormSetValue, FieldValues, Path, PathValue } from "react-hook-form";
import * as paths from "@/lib/image-paths";

interface ImageUploadProps<T extends FieldValues & { img?: string | null | undefined }> {
  setValue: UseFormSetValue<T>;
  imgPreview: string | null | undefined;
  isLoading: boolean;
  error?: { message?: string };
}

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
}

const ImageUpload = <T extends FieldValues & { img?: string | null | undefined }>({ setValue, imgPreview, isLoading, error }: ImageUploadProps<T>) => {
  return (
    <div className="flex flex-col gap-2 w-full md:col-span-1">
      <label className="text-xs font-medium text-gray-700">Image de Profil</label>
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
        onSuccess={(result: CloudinaryUploadWidgetResults) => {
          if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
            const info = result.info as CloudinaryUploadWidgetInfo;
            setValue("img" as Path<T>, info.secure_url as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true });
          }
        }}
        onError={(error) => {
          console.error("Cloudinary Upload Error:", error);
          toast({
            variant: "destructive",
            title: "Échec du téléversement",
            description: 
              typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
                ? error.message
                : "Une erreur est survenue lors du téléversement de l'image.",
          });
        }}
      >
        {({ open }) => (
          <button 
            type="button" 
            onClick={() => open()} 
            className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer p-2 border rounded disabled:opacity-50" 
            disabled={isLoading}
          >
            <Image src={paths.uploadIcon} alt="Upload" width={28} height={28} />
            <span>{imgPreview ? "Changer la Photo" : "Télécharger une Photo"}</span>
          </button>
        )}
      </CldUploadWidget>
      {imgPreview && (
        <div className="relative w-20 h-20 mt-2">
          <Image src={imgPreview} alt="Preview" fill sizes="80px" className="rounded object-cover"/>
        </div>
      )}
      {error?.message && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
  );
};

export default ImageUpload;
