import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateAttendanceMutation, useUpdateAttendanceMutation } from "@/lib/redux/api/entityApi/index";
import { attendanceSchema, type AttendanceSchema } from "@/lib/formValidationSchemas";
import type { AttendanceFormProps, AttendanceFormReturn } from "./types";

const useAttendanceForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: AttendanceFormProps): AttendanceFormReturn => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: data ? {
      ...data,
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : undefined,
      present: data.present ?? false,
    } : {
      present: true,
    },
  });

  const isPresent = watch("present");

  const router = useRouter();
  const [createAttendance, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
    isError: createIsError, 
    error: createErrorData 
  }] = useCreateAttendanceMutation();
  
  const [updateAttendance, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    isError: updateIsError, 
    error: updateErrorData 
  }] = useUpdateAttendanceMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData) => {
    try {
      if (type === "create") {
        await createAttendance(formData).unwrap();
      } else if (data?.id) {
        await updateAttendance({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect below
    }
  });

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Présence ${type === "create" ? "enregistrée" : "mise à jour"} avec succès !` });
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
    errors,
    isLoading,
    isPresent,
    onSubmit,
    setValue,
    createIsError,
    updateIsError,
    createErrorData,
    updateErrorData,
  };
};

export default useAttendanceForm;