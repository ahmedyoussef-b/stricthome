// src/components/forms/TeacherForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useTeacherForm from "./useTeacherForm";
import type { TeacherFormProps } from "@/types";

const TeacherForm = ({
  type,
  initialData,
  setOpen,
  availableSubjects,
}: TeacherFormProps) => {
  const {
    register,
    handleSubmit,
    actualOnSubmit,
    errors,
    isLoading,
    setValue,
    sexWatch,
    birthdayWatch,
    imgPreview,
    createErrorData,
    updateErrorData,
  } = useTeacherForm({ type, initialData, setOpen, availableSubjects });

  return (
    <form onSubmit={handleSubmit(actualOnSubmit)} className="space-y-6">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer un Nouvel Enseignant" : "Mettre à jour l'Enseignant"}
      </h1>

      <FormFields 
        register={register}
        errors={errors}
        isLoading={isLoading}
        setValue={setValue}
        sexWatch={sexWatch}
        birthdayWatch={birthdayWatch}
        imgPreview={imgPreview}
        availableSubjects={availableSubjects || []}
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
         (type === 'update' ? "Mettre à jour l'Enseignant" : "Créer l'Enseignant")}
      </Button>
    </form>
  );
};

export default TeacherForm;
