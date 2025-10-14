// src/components/forms/TeacherForm/useTeacherForm.ts
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, UseFormSetValue, UseFormHandleSubmit, FieldErrors, UseFormRegister } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateTeacherMutation, useUpdateTeacherMutation } from "@/lib/redux/api/entityApi";
import { teacherSchema } from "@/lib/formValidationSchemas";
import type { TeacherFormProps, TeacherFormReturn } from "@/types";
import { UserSex } from "@/types";
import type { TeacherSchema } from "@/types/schemas";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import * as paths from "@/lib/image-paths";


const useTeacherForm = ({
  type,
  initialData,
  setOpen,
}: TeacherFormProps): TeacherFormReturn => {
  const router = useRouter();
  
  const [createTeacher, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
    isError: createIsError, 
    error: createErrorData 
  }] = useCreateTeacherMutation();
  
  const [updateTeacher, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    isError: updateIsError, 
    error: updateErrorData 
  }] = useUpdateTeacherMutation();
  
  const isLoading = isCreating || isUpdating;

  const form = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || '',
      surname: initialData?.surname || '',
      username: initialData?.user?.username || '',
      email: initialData?.user?.email || '',
      password: '',
      address: initialData?.address || '',
      img: initialData?.img || null,
      phone: initialData?.phone || undefined,
      bloodType: initialData?.bloodType || '',
      sex: initialData?.sex ?? undefined,
      birthday: initialData?.birthday ? new Date(initialData.birthday) : undefined,
      subjects: initialData?.subjects?.map((subject: any) => String(subject.id)) || [],
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form;

  const sexWatch = watch("sex");
  const birthdayWatch = watch("birthday");
  const imgPreview = watch("img");


  const actualOnSubmit: SubmitHandler<TeacherSchema> = async (formData) => {
    const payload = { ...formData };
    
    if (type === "update" && (!payload.password || payload.password.trim() === "")) {
        delete (payload as any).password;
    }

    try {
      if (type === 'create') {
        await createTeacher(payload).unwrap();
      } else if (initialData?.id) {
        await updateTeacher({ ...payload, id: initialData.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by the useEffect hook
    }
  };
  
  useEffect(() => {
    if (createSuccess || updateSuccess) {
      const action = type === "create" ? "créé" : "mis à jour";
      toast({ title: `Enseignant ${action} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    }
  }, [createSuccess, updateSuccess, type, setOpen, reset, router]);

  useEffect(() => {
    const error = createErrorData || updateErrorData;
    if (error && Object.keys(error).length > 0) {
      const errorMessage = (error as any)?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData]);

  return {
    register,
    handleSubmit,
    actualOnSubmit,
    errors,
    isLoading,
    setValue,
    sexWatch,
    birthdayWatch,
    imgPreview,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useTeacherForm;
