// src/components/admin/PublicAnnouncementForm.tsx
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { FileUploader } from "./FileUploader";
import { UploadedFilesGallery } from "./UploadedFilesGallery";

const publicAnnouncementSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  text: z.string().optional(),
  description: z.string(), 
}).refine(data => !!data.text || data.description.includes('"files":[') && !data.description.includes('"files":[]'), {
  message: "Veuillez ajouter une description ou téléverser au moins un fichier.",
  path: ["text"],
});

type PublicAnnouncementFormValues = z.infer<typeof publicAnnouncementSchema>;

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  resource_type: string;
  original_filename?: string;
}

export default function PublicAnnouncementForm() {
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<PublicAnnouncementFormValues>({
    resolver: zodResolver(publicAnnouncementSchema),
  });
  
  const textValue = watch('text');

  useEffect(() => {
    const descriptionObject = {
      isPublic: true,
      text: textValue || '',
      files: uploadedFiles,
    };
    const descriptionValue = JSON.stringify(descriptionObject);
    setValue("description", descriptionValue, { shouldValidate: true });
  }, [uploadedFiles, textValue, setValue]);

  const handleUploadSuccess = (result: any) => {
    if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
      const info = result.info as CloudinaryUploadWidgetInfo;
      const fileType = info.resource_type === 'raw' ? 'pdf' : info.resource_type;
      const file = { url: info.secure_url, type: fileType };
      setUploadedFiles(prev => [...prev, file]);
      toast({ title: "Fichier ajouté", description: info.original_filename || "Le fichier a été ajouté à la galerie." });
    }
  };

  const removeUploadedFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const onFormSubmit: SubmitHandler<PublicAnnouncementFormValues> = async (formData) => {
    if (!formData.text && uploadedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Contenu manquant",
        description: "Veuillez ajouter une description ou téléverser un fichier.",
      });
      return;
    }
      
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/public-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) throw new Error("La publication de l'annonce a échoué.");

      toast({
        title: 'Annonce Publiée',
        description: `L'annonce "${formData.title}" a été publiée avec succès.`,
      });
      reset();
      setUploadedFiles([]);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: 'Erreur',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="title">Titre de l'annonce / Galerie</Label>
        <Input id="title" {...register("title")} disabled={isSubmitting} className="mt-1"/>
        {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="text">Description (Optionnel)</Label>
        <Textarea 
          id="text" 
          {...register("text")} 
          disabled={isSubmitting} 
          placeholder="Ajoutez une description textuelle à votre annonce..."
          className="mt-1"
        />
        {errors.text && <p className="text-destructive text-sm mt-1">{errors.text.message}</p>}
      </div>

      <div>
        <Label>Fichiers (Optionnel)</Label>
        <input type="hidden" {...register("description")} />
        
        {uploadedFiles.length > 0 ? (
          <>
            <UploadedFilesGallery 
              files={uploadedFiles} 
              onRemove={removeUploadedFile} 
              disabled={isSubmitting} 
            />
            <div className="mt-2">
              <FileUploader 
                onSuccess={handleUploadSuccess} 
                disabled={isSubmitting}
                variant="gallery"
              />
            </div>
          </>
        ) : (
          <FileUploader 
            onSuccess={handleUploadSuccess} 
            disabled={isSubmitting}
          />
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {isSubmitting ? 'Publication en cours...' : 'Publier l\'annonce'}
      </Button>
    </form>
  );
}
