// src/components/forms/LessonForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useLessonForm from "./useLessonForm";
import type { LessonFormProps } from "./types";

const LessonForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: LessonFormProps) => {
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    actualOnSubmit,
    createErrorData,
    updateErrorData,
  } = useLessonForm({ type, data, setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(actualOnSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Cours" : "Mettre à jour le Cours"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
        relatedData={relatedData}
      />
      
      {(createErrorData || updateErrorData) && (
        <span className="text-red-500 text-sm">
          {(createErrorData as any)?.data?.message || 
           (updateErrorData as any)?.data?.message || 
           "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Traitement..." : 
         (type === "create" ? "Créer le Cours" : "Mettre à jour le Cours")}
      </Button>
    </form>
  );
};

export default LessonForm;
