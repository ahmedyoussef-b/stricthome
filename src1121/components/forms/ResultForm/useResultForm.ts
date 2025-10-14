
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, UseFormHandleSubmit, FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateResultMutation, useUpdateResultMutation } from "@/lib/redux/api/entityApi/";
import { resultSchema } from "@/lib/formValidationSchemas";
import type { ResultSchema } from "@/types/schemas";
import type { Dispatch, SetStateAction } from "react";
import type { Result, Student, Exam, Assignment } from "@/types/index";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

// Types were moved here from types.ts to break a circular dependency
export interface ResultFormProps {
  type: "create" | "update";
  data?: Result;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    students?: Pick<Student, 'id' | 'name' | 'surname'>[];
    exams?: Pick<Exam, 'id' | 'title'>[];
    assignments?: Pick<Assignment, 'id' | 'title'>[];
  };
}

export interface ResultFormReturn {
  register: UseFormRegister<ResultSchema>;
  handleSubmit: UseFormHandleSubmit<ResultSchema>;
  actualOnSubmit: SubmitHandler<ResultSchema>;
  errors: FieldErrors<ResultSchema>;
  isLoading: boolean;
  setValue: UseFormSetValue<ResultSchema>;
  assessmentType: "exam" | "assignment";
  createIsError: boolean;
  updateIsError: boolean;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}


const useResultForm = ({
  type,
  data,
  setOpen,
}: ResultFormProps): ResultFormReturn => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
    defaultValues: data ? {
        ...data,
        assessmentType: data.examId ? 'exam' : 'assignment',
        examId: data.examId ?? undefined,
        assignmentId: data.assignmentId ?? undefined,
    } : {
        score: 0,
        assessmentType: 'exam',
    }
  });

  const assessmentType = watch('assessmentType');
  
  const router = useRouter();
  const [createResult, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
    isError: createIsError, 
    error: createErrorData 
  }] = useCreateResultMutation();
  
  const [updateResult, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    isError: updateIsError, 
    error: updateErrorData 
  }] = useUpdateResultMutation();

  const isLoading = isCreating || isUpdating;

  const actualOnSubmit: SubmitHandler<ResultSchema> = async (formData) => {
    const payload = { ...formData };
    
    if (assessmentType === 'exam') {
        payload.assignmentId = null;
    } else {
        payload.examId = null;
    }

    try {
      if (type === "create") {
        await createResult(payload).unwrap();
      } else if (data?.id) {
        await updateResult({ ...payload, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect below
    }
  };


  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Résultat ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
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
    assessmentType,
    createIsError,
    updateIsError,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useResultForm;
