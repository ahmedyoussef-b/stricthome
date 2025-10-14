import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateLessonMutation, useUpdateLessonMutation } from "@/lib/redux/api/entityApi/index";
import { lessonSchema, type LessonSchema } from "@/lib/formValidationSchemas";
import { formatTime } from "./utils";
import type { LessonFormProps, LessonFormReturn } from "./types";
import { Day } from '@/types/index';
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

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
      startTime: formatTime(data.startTime),
      endTime: formatTime(data.endTime),
      classId: data.classId ?? undefined, // Convert null to undefined
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
    error: createErrorData 
  }] = useCreateLessonMutation();
  
  const [updateLesson, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    error: updateErrorData 
  }] = useUpdateLessonMutation();

  const isLoading = isCreating || isUpdating;

  const actualOnSubmit: SubmitHandler<LessonSchema> = async (formData) => {
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
    if(createSuccess || updateSuccess) {
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
  }, [createErrorData, updateErrorData]);

  return {
    register,
    handleSubmit,
    actualOnSubmit,
    errors,
    isLoading,
    createErrorData: createErrorData as FetchBaseQueryError | SerializedError | undefined,
    updateErrorData: updateErrorData as FetchBaseQueryError | SerializedError | undefined,
  };
};

export default useLessonForm;
