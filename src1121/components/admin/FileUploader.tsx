"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { UploadCloud, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onSuccess: (result: any) => void;
  disabled?: boolean;
  variant?: "default" | "gallery";
}

export function FileUploader({ onSuccess, disabled, variant = "default" }: FileUploaderProps) {
  const { toast } = useToast();

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
      options={{ multiple: true }}
      onSuccess={onSuccess}
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
        <Button
          type="button"
          variant="outline"
          onClick={() => open()}
          disabled={disabled}
          className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted transition-colors ${
            variant === "gallery" ? "aspect-square h-full" : ""
          }`}
        >
          {variant === "gallery" ? (
            <>
              <Plus className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-center mt-1">Ajouter plus</span>
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <span className="font-semibold">Cliquez pour téléverser</span>
              <span className="text-xs text-muted-foreground">Téléversez des images ou des documents</span>
            </>
          )}
        </Button>
      )}
    </CldUploadWidget>
  );
}