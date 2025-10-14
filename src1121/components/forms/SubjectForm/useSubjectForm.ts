//src/components/forms/SubjectForm/useSubjectForm.ts
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { SubjectSchema, subjectSchema } from "@/lib/formValidationSchemas";
import type { UseSubjectFormProps, SubjectFormReturn } from "@/types";

const useSubjectForm = ({
  type,
  data,
  setOpen,
  createSubject,
  updateSubject
}: UseSubjectFormProps): SubjectFormReturn => {
  const router = useRouter();

  const form = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
    defaultValues: data ? {
      ...data,
      // Normalize null values from DB to undefined for the form
      weeklyHours: data.weeklyHours ?? undefined,
      coefficient: data.coefficient ?? undefined,
      isOptional: data.isOptional ?? undefined,
      teachers: data.teachers?.map(teacher => String(teacher.id)) || [],
    } : {
      weeklyHours: 2,
      coefficient: 1,
      teachers: [],
      isOptional: false,
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const selectedTeachers = watch("teachers") || [];

  const onSubmit: SubmitHandler<SubjectSchema> = async (formData) => {
    try {
      if (type === "create") {
        await createSubject(formData).unwrap();
      } else if (data?.id) {
        await updateSubject({ ...formData, id: data.id }).unwrap();
      }
      toast({ title: `Matière ${type === "create" ? "créée" : "mise à jour"} avec succès !` });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
       const errorMessage = err?.data?.message || `Impossible de ${type === "create" ? "créer" : "mettre à jour"} la matière.`;
       toast({ variant: "destructive", title: "Erreur", description: errorMessage });
    }
  };


  return {
    register,
    handleSubmit,
    errors,
    setValue,
    selectedTeachers,
    onSubmit,
  };
};

export default useSubjectForm;
