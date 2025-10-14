// src/components/forms/SubjectForm/SubjectForm.tsx
"use client";

import React from 'react';
import FormFields from "./FormFields";
import useSubjectForm from "./useSubjectForm";
import type { SubjectFormProps } from "@/types";
import { Button } from '@/components/ui/button';
import { useCreateSubjectMutation, useUpdateSubjectMutation } from "@/lib/redux/api/entityApi";

const SubjectForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: SubjectFormProps) => {

  const [createSubject, { isLoading: isCreating }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: isUpdating }] = useUpdateSubjectMutation();

  const { register, handleSubmit, errors, setValue, selectedTeachers, onSubmit } = useSubjectForm({ 
      type, 
      data, 
      setOpen, 
      relatedData,
      createSubject,
      updateSubject,
  });

  const isLoading = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer une Nouvelle Matière" : "Mettre à jour la Matière"}
      </h1>
      <FormFields
        register={register}
        errors={errors}
        isLoading={isLoading}
        setValue={setValue}
        teachers={relatedData?.teachers || []}
        type={type} 
        selectedTeachers={selectedTeachers}
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Enregistrement...' : 
         (type === 'update' ? "Mettre à jour la matière" : "Créer la matière")}
      </Button>
    </form>
  );
};

export default SubjectForm;
