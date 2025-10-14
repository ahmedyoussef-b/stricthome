// src/components/forms/GradeForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useGradeForm from "./useGradeForm";
import { GradeFormProps } from "./types";

const GradeForm = ({
  type,
  data,
  setOpen,
}: GradeFormProps) => {
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    actualOnSubmit,
    createIsError,
    updateIsError,
    createErrorData,
    updateErrorData,
  } = useGradeForm({ type, data, setOpen });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(actualOnSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Niveau" : "Mettre à Jour le Niveau"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
      />
      
      {(createIsError || updateIsError) && (
        <span className="text-destructive text-sm mt-2">
          Erreur: {(createErrorData as any)?.data?.message || 
                  (updateErrorData as any)?.data?.message || 
                  "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" className="mt-4" disabled={isLoading}>
        {isLoading ? "Traitement..." : 
         (type === "create" ? "Créer Niveau" : "Mettre à Jour Niveau")}
      </Button>
    </form>
  );
};

export default GradeForm;
