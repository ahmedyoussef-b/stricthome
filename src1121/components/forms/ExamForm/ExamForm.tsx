//src/components/forms/ExamForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useExamForm from "./useExamForm";
import { ExamFormProps } from "./types";

const ExamForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: ExamFormProps) => {
  const {
    register,
    errors,
    isLoading,
    handleSubmit,
    actualOnSubmit,
    createIsError,
    updateIsError,
    createErrorData,
    updateErrorData,
  } = useExamForm({ type, data, setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(actualOnSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouvel Examen" : "Mettre à jour l'Examen"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
        lessons={relatedData?.lessons || []}
      />
      
      {(createIsError || updateIsError) && (
        <span className="text-red-500 text-sm">
          {(createErrorData as any)?.data?.message || 
           (updateErrorData as any)?.data?.message || 
           "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Traitement en cours..." : 
         (type === "create" ? "Créer l'Examen" : "Mettre à jour l'Examen")}
      </Button>
    </form>
  );
};

export default ExamForm;
