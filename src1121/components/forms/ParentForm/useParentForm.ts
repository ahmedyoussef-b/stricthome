
// src/components/forms/ParentForm/useParentForm.ts
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, UseFormRegister, FieldErrors, UseFormSetValue, UseFormHandleSubmit } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateParentMutation, useUpdateParentMutation } from "@/lib/redux/api/entityApi";
import { parentSchema } from "@/lib/formValidationSchemas";
import type { ParentFormProps, ParentFormValues } from "@/types";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

interface ParentFormReturn {
  register: UseFormRegister<ParentFormValues>;
  handleSubmit: UseFormHandleSubmit<ParentFormValues>;
  actualOnSubmit: SubmitHandler<ParentFormValues>;
  errors: FieldErrors<ParentFormValues>;
  isLoading: boolean;
  setValue: UseFormSetValue<ParentFormValues>;
  imgPreview: string | null | undefined;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}

const useParentForm = ({
  type,
  initialData,
  setOpen,
}: ParentFormProps): ParentFormReturn => {
  const router = useRouter();

  const [createParent, {
    isLoading: isCreating,
    isSuccess: createSuccess,
    isError: createIsError,
    error: createErrorData
  }] = useCreateParentMutation();

  const [updateParent, {
    isLoading: isUpdating,
    isSuccess: updateSuccess,
    isError: updateIsError,
    error: updateErrorData
  }] = useUpdateParentMutation();

  const isLoading = isCreating || isUpdating;

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || '',
      surname: initialData?.surname || '',
      username: initialData?.user?.username || '',
      email: initialData?.user?.email || '',
      password: '', // Password should typically not be pre-filled
      address: initialData?.address || '',
      img: initialData?.img || null,
      phone: initialData?.phone || '',
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const [imgPreview, setImgPreview] = useState<string | null | undefined>(initialData?.img || null);
  const watchedImg = watch("img");

  const actualOnSubmit: SubmitHandler<ParentFormValues> = async (formData) => {
    try {
      if (type === "create") {
        await createParent(formData).unwrap();
      } else if (initialData?.id) {
        await updateParent({ ...formData, id: initialData.id }).unwrap();
      }
      setOpen(false);
      router.refresh();
      toast({
        title: `${type === "create" ? "Parent créé" : "Parent mis à jour"} avec succès !`,
      });
    } catch (err) {
      // Error is handled by the useEffect below
    }
  };

  useEffect(() => {
    if (createIsError || updateIsError) {
      const apiError = (createErrorData || updateErrorData) as any;
      const errorMessage = apiError?.data?.message || "Une erreur est survenue lors de l'enregistrement du parent.";
      toast({ variant: "destructive", title: "Échec de l'enregistrement", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData]);

    // Handle image file change
    useEffect(() => {
        if (watchedImg && typeof watchedImg === 'string') {
            setImgPreview(watchedImg);
        }
    }, [watchedImg]);


  return {
    register,
    handleSubmit,
    actualOnSubmit,
    errors,
    isLoading,
    setValue,
    imgPreview,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useParentForm;
