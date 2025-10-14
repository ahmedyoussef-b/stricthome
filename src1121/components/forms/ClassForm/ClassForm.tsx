// src/components/forms/ClassForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useClassForm from "./useClassForm";
import { ClassFormProps } from "./types";

const ClassForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: ClassFormProps) => {
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    onSubmit,
    createIsError,
    updateIsError,
    createErrorData,
    updateErrorData,
    setValue,
    selectedStudents,
  } = useClassForm({ type, data, setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer une Nouvelle Classe" : "Mettre à jour la Classe"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
        grades={relatedData?.grades || []}
        students={relatedData?.students || []}
        setValue={setValue}
        selectedStudents={selectedStudents}
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
         (type === "create" ? "Créer la Classe" : "Mettre à jour la Classe")}
      </Button>
    </form>
  );
};

export default ClassForm;
