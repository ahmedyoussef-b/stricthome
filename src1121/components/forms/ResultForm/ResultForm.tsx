
//src/components/forms/ResultForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import useResultForm from "./useResultForm";
import type { ResultFormProps } from "./useResultForm"; // Import from the hook file
import FormFields from "./FormFields";


const ResultForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: ResultFormProps) => {
  const {
    register,
    handleSubmit,
    actualOnSubmit,
    errors,
    isLoading,
    setValue,
    assessmentType,
    createIsError,
    updateIsError,
    createErrorData,
    updateErrorData,
  } = useResultForm({ type, data, setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(actualOnSubmit)}> {/* Wrapped with handleSubmit */}
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Résultat" : "Mettre à jour le Résultat"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
        setValue={setValue}
        assessmentType={assessmentType}
        relatedData={relatedData}
        isUpdate={type === 'update'}
      />
      
      {(createIsError || updateIsError) && (
        <span className="text-red-500 text-sm">
          {(createErrorData as any)?.data?.message || 
           (updateErrorData as any)?.data?.message || 
           "Une erreur s'est produite."}
        </span>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Traitement..." : 
         (type === "create" ? "Créer Résultat" : "Mettre à jour Résultat")}
      </Button>
    </form>
  );
};

export default ResultForm;
