import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateGradeMutation, useUpdateGradeMutation } from "@/lib/redux/api/entityApi/index";
import { gradeSchema, type GradeSchema } from "@/lib/formValidationSchemas";
import type { GradeFormProps, GradeFormReturn } from "./types";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

const useGradeForm = ({
  type,
  data,
  setOpen,
}: GradeFormProps): GradeFormReturn => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GradeSchema>({
    resolver: zodResolver(gradeSchema),
    defaultValues: data || { level: undefined },
  });

  const router = useRouter();
  const [createGrade, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
    isError: createIsError, 
    error: createErrorData 
  }] = useCreateGradeMutation();
  
  const [updateGrade, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    isError: updateIsError, 
    error: updateErrorData 
  }] = useUpdateGradeMutation();

  const isLoading = isCreating || isUpdating;

  const actualOnSubmit: SubmitHandler<GradeSchema> = async (formData) => {
    try {
      if (type === "create") {
        await createGrade(formData).unwrap();
      } else if (data?.id) {
        await updateGrade({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect below
    }
  };

  useEffect(() => {
    const error: FetchBaseQueryError | SerializedError | undefined = 
    (createErrorData as FetchBaseQueryError | SerializedError | undefined) ||
    (updateErrorData as FetchBaseQueryError | SerializedError | undefined);
    if (error && Object.keys(error).length > 0) {
      const apiError = error as any;
      const errorMessage = apiError?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData]);

  return {
    register,
    handleSubmit,
    actualOnSubmit,
    errors,
    isLoading,
    createIsError,
    updateIsError,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useGradeForm;
