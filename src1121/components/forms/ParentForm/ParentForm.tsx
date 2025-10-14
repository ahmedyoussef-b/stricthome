// src/components/forms/ParentForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useParentForm from "./useParentForm";
import type { ParentFormProps } from "@/types";

const ParentForm = ({
  type,
  initialData,
  setOpen,
}: ParentFormProps) => {
  const {
    register,
    handleSubmit,
    actualOnSubmit,
    errors,
    isLoading,
    setValue,
    imgPreview,
    createErrorData,
    updateErrorData,
  } = useParentForm({ type, initialData, setOpen });

  return (
    <form onSubmit={handleSubmit(actualOnSubmit)} className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Parent" : "Mettre à jour le Parent"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
        setValue={setValue}
        imgPreview={imgPreview}
        type={type}
      />
      
      {(createErrorData || updateErrorData) && (
        <span className="text-red-500 text-sm mt-2">
          Erreur: {(createErrorData as any)?.data?.message || 
                  (updateErrorData as any)?.data?.message || 
                  "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
        {isLoading ? 'Enregistrement...' : 
         (type === 'update' ? "Mettre à jour le Parent" : "Créer le Parent")}
      </Button>
    </form>
  );
};

export default ParentForm;
