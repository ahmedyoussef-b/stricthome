// src/components/forms/AnnouncementForm/AnnouncementForm.tsx
"use client";

import React, { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation } from "@/lib/redux/api/entityApi/index";
import { announcementSchema as formSchema, type AnnouncementSchema } from "@/lib/formValidationSchemas";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import FormFields from "./FormFields";
import { Button } from "@/components/ui/button";
import type { AnnouncementWithClass, Class, CloudinaryUploadWidgetResults } from "@/types";
import { FileUploader } from '@/components/admin/FileUploader';
import { UploadedFilesGallery } from '@/components/admin/UploadedFilesGallery';
import FormError from '../FormError';


// --- Types ---
type RelatedClass = Pick<Class, 'id' | 'name'>;

interface AnnouncementFormProps {
  type: "create" | "update";
  data?: AnnouncementWithClass;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { classes: RelatedClass[] };
}

// --- Hook Logic ---
const useAnnouncementForm = ({ type, data, setOpen }: AnnouncementFormProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; type: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data?.title ?? "",
      description: data?.description ?? "", // The raw description string
      date: data?.date ? new Date(data.date) : new Date(),
      classId: data?.classId ?? null,
    },
  });
 
  const textValue = watch('description');

  useEffect(() => {
    if (type === 'update' && data?.description) {
      try {
        const fileInfo = JSON.parse(data.description);
        if (fileInfo.files && Array.isArray(fileInfo.files)) {
          setUploadedFiles(fileInfo.files);
          setValue('description', fileInfo.text || '');
        }
      } catch (e) {
        // Not a JSON description, so it's legacy text.
      }
    }
  }, [data, type, setValue]);

  const router = useRouter();
  const { toast } = useToast();
  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();
  const isLoading = isCreating || isUpdating;

  const onSubmit: SubmitHandler<AnnouncementSchema> = async (formData) => {
    const descriptionObject = {
      isPublic: false, // This is a school announcement, not a public one
      text: formData.description,
      files: uploadedFiles,
    };
    const finalDescription = JSON.stringify(descriptionObject);

    const payload = { ...formData, description: finalDescription };

    try {
      if (type === "create") {
        await createAnnouncement(payload).unwrap();
      } else if (data?.id) {
        await updateAnnouncement({ ...payload, id: data.id }).unwrap();
      }
      toast({ title: `Annonce ${type === "create" ? "créée" : "mise à jour"} avec succès !` });
      setOpen(false);
      reset();
      setUploadedFiles([]);
      router.refresh();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Échec de l'opération",
        description: err.data?.message || "Une erreur inattendue s'est produite.",
      });
    }
  };

  const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
      const info = result.info as any;
      const fileType = info.resource_type === 'raw' ? 'pdf' : info.resource_type;
      const file = { url: info.secure_url, type: fileType };
      setUploadedFiles(prev => [...prev, file]);
      toast({ title: "Fichier ajouté", description: info.original_filename || "Le fichier a été ajouté." });
    }
  };

  const removeUploadedFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
 

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    uploadedFiles,
    onSubmit,
    removeUploadedFile,
    handleUploadSuccess,
  };
};

// --- Main Component ---
export default function AnnouncementForm({ type, data, setOpen, relatedData }: AnnouncementFormProps) {
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    uploadedFiles,
    onSubmit,
    removeUploadedFile,
    handleUploadSuccess,
  } = useAnnouncementForm({ type, data, setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Publier une Nouvelle Annonce" : "Mettre à jour l'Annonce"}
      </h1>

      <div className="flex flex-col gap-4">
        <FormFields
          register={register}
          errors={errors}
          isLoading={isLoading}
          classes={relatedData?.classes || []}
          data={data}
        />
        <FileUploadSection
          uploadedFiles={uploadedFiles}
          isLoading={isLoading}
          onRemoveFile={removeUploadedFile}
          onUploadSuccess={handleUploadSuccess}
          error={errors.description}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {type === "create" ? "Publier" : "Mettre à jour"}
      </Button>
    </form>
  );
}


// --- Sub-components (as they are only used here) ---
import { FieldError } from 'react-hook-form';

interface FileUploadSectionProps {
  uploadedFiles: { url: string; type: string }[];
  isLoading: boolean;
  onRemoveFile: (index: number) => void;
  onUploadSuccess: (result: CloudinaryUploadWidgetResults) => void;
  error?: FieldError;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ 
  uploadedFiles, 
  isLoading, 
  onRemoveFile, 
  onUploadSuccess, 
  error 
}) => {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Fichiers joints (Optionnel)</h3>
      {uploadedFiles.length > 0 ? (
        <>
          <UploadedFilesGallery 
            files={uploadedFiles} 
            onRemove={onRemoveFile} 
            disabled={isLoading} 
          />
          <div className="mt-2">
            <FileUploader 
              onSuccess={onUploadSuccess} 
              disabled={isLoading}
              variant="gallery"
            />
          </div>
        </>
      ) : (
        <FileUploader 
          onSuccess={onUploadSuccess} 
          disabled={isLoading}
        />
      )}
      <FormError error={error} />
    </div>
  );
};
