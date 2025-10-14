
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, UseFormHandleSubmit, FieldErrors, UseFormRegister } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateExamMutation, useUpdateExamMutation } from "@/lib/redux/api/entityApi/index";
import { examSchema } from "@/lib/formValidationSchemas";
import type { ExamSchema } from "@/types/schemas";
import type { ExamFormProps, ExamFormReturn } from "./types";
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

const useExamForm = ({
  type,
  data,
  setOpen,
}: ExamFormProps): ExamFormReturn => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
    defaultValues: data ? {
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      lessonId: data.lessonId,
    } : {},
  });

  const router = useRouter();
  const [
    createExam,
    { 
      isLoading: isCreating,
      isSuccess: createSuccess,
      isError: createIsError,
      error: createErrorData,
    }
  ] = useCreateExamMutation();

  const [
    updateExam,
    { 
      isLoading: isUpdating,
      isSuccess: updateSuccess,
      isError: updateIsError,
      error: updateErrorData,
    }
  ] = useUpdateExamMutation();

  const isLoading = isCreating || isUpdating;

  const actualOnSubmit: SubmitHandler<ExamSchema> = async (formData) => {
    try {
      if (type === "create") {
        await createExam(formData).unwrap();
      } else if (data?.id) {
        await updateExam({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect below
    }
  };
  
  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Examen ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    }
  }, [createSuccess, updateSuccess, type, setOpen, reset, router]);

  useEffect(() => {
    const error: FetchBaseQueryError | SerializedError | undefined = 
    (createErrorData as FetchBaseQueryError | SerializedError | undefined) ||
    (updateErrorData as FetchBaseQueryError | SerializedError | undefined);
    if (error && Object.keys(error).length > 0) {
      const errorMessage = (error as any)?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData]);

  return {
    register,
    handleSubmit: handleSubmit as UseFormHandleSubmit<ExamSchema>,
    actualOnSubmit,
    errors,
    isLoading,
    createIsError,
    updateIsError,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useExamForm;
