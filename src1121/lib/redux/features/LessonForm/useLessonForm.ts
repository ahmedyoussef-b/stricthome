import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, UseFormHandleSubmit, FieldErrors, UseFormRegister } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateLessonMutation, useUpdateLessonMutation } from "@/lib/redux/api/entityApi/index";
import { lessonSchema, type LessonSchema } from "@/lib/formValidationSchemas";
import { Day } from '@/types/index';
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { formatTime } from "@/components/forms/LessonForm/utils";
import { LessonFormProps } from "@/components/forms/LessonForm/types";

interface LessonFormReturn {
  register: UseFormRegister<LessonSchema>;
  handleSubmit: UseFormHandleSubmit<LessonSchema>;
  errors: FieldErrors<LessonSchema>;
  isLoading: boolean;
  onSubmit: SubmitHandler<LessonSchema>;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}


const useLessonForm = ({
  type,
  data,
  setOpen,
}: LessonFormProps): LessonFormReturn => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
    defaultValues: data ? {
      ...data,
      classId: data.classId ?? undefined, // Ensure null is converted to undefined
      startTime: formatTime(data.startTime),
      endTime: formatTime(data.endTime),
      classroomId: data.classroomId ?? undefined,
    } : {
      name: '',
      day: Day.MONDAY,
      startTime: '',
      endTime: '',
    },
  });

  const router = useRouter();
  const [createLesson, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
    isError: createIsError, 
    error: createErrorData 
  }] = useCreateLessonMutation();
  
  const [updateLesson, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    isError: updateIsError, 
    error: updateErrorData 
  }] = useUpdateLessonMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit: SubmitHandler<LessonSchema> = async (formData) => {
    try {
      if (type === "create") {
        await createLesson(formData).unwrap();
      } else if (data?.id) {
        await updateLesson({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect below
    }
  };

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Cours ${type === "create" ? "créé" : "mis à jour"} avec succès !` });
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
    handleSubmit,
    onSubmit,
    errors,
    isLoading,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useLessonForm;
