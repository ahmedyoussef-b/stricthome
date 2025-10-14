//src/components/forms/AssignmentForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useAssignmentForm from "./useAssignmentForm";
import { AssignmentFormProps } from "./types";

const AssignmentForm = ({type,data,setOpen, relatedData}: AssignmentFormProps) => {
  const { register,errors,isLoading,
    handleSubmit,
    actualOnSubmit,
    createIsError,
    updateIsError,
    createErrorData,
    updateErrorData,
  } = useAssignmentForm({ type, data,setOpen, relatedData });

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(actualOnSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouveau Devoir" : "Mettre à jour le Devoir"}
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
         (type === "create" ? "Créer le Devoir" : "Mettre à jour le Devoir")}
      </Button>
    </form>
  );
};

export default AssignmentForm;
