import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, UseFormHandleSubmit } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from "@/lib/redux/api/entityApi/index";
import { assignmentSchema } from "@/lib/formValidationSchemas";
import type { AssignmentSchema } from "@/types/schemas";
import type { AssignmentFormProps, AssignmentFormReturn } from "./types";
import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { SerializedError } from '@reduxjs/toolkit';

const useAssignmentForm = ({
  type,
  data,
  setOpen,
}: AssignmentFormProps): AssignmentFormReturn => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssignmentSchema>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: data ? {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      lessonId: data.lessonId,
    } : {},
  });

  const router = useRouter();
  const [createAssignment, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
    isError: createIsError, 
    error: createErrorData 
  }] = useCreateAssignmentMutation();
  
  const [updateAssignment, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    isError: updateIsError, 
    error: updateErrorData 
  }] = useUpdateAssignmentMutation();

  const isLoading = isCreating || isUpdating;

  const actualOnSubmit: SubmitHandler<AssignmentSchema> = async (formData: AssignmentSchema) => {
    try {
      if (type === "create") {
        await createAssignment(formData).unwrap();
      } else if (data?.id) {
        await updateAssignment({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect below
    }
  };

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Devoir ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    }
  }, [createSuccess, updateSuccess, type, setOpen, reset, router]);

  useEffect(() => {
    const error = createErrorData || updateErrorData;
    if (error) {
      const errorMessage = (error as any)?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData]);

  return {
    register,
    errors,
    isLoading,
    handleSubmit,
    actualOnSubmit,
    createIsError,
    updateIsError,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useAssignmentForm;
