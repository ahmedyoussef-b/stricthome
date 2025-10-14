import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCreateClassMutation, useUpdateClassMutation } from "@/lib/redux/api/entityApi/index";
import { classSchema, type ClassSchema } from "@/lib/formValidationSchemas";
import type { ClassFormProps, ClassFormReturn } from "./types";

const useClassForm = ({
  type,
  data,
  setOpen,
}: ClassFormProps): ClassFormReturn => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ClassSchema>({ 
    resolver: zodResolver(classSchema),
    defaultValues: data ? { 
      name: data.name,
      abbreviation: data.abbreviation || '',
      capacity: data.capacity || 0,
      gradeLevel: data.grade?.level, // Set gradeLevel from related data
      studentIds: data.students?.map((s: { id: string }) => s.id) || [],
    } : { 
      capacity: 25,
      studentIds: [],
    },
  });

  const selectedStudents = watch("studentIds") || [];

  const router = useRouter();
  const [createClass, { 
    isLoading: isCreating, 
    isSuccess: createSuccess, 
    isError: createIsError, 
    error: createErrorData 
  }] = useCreateClassMutation();
  
  const [updateClass, { 
    isLoading: isUpdating, 
    isSuccess: updateSuccess, 
    isError: updateIsError, 
    error: updateErrorData 
  }] = useUpdateClassMutation();

  const isLoading = isCreating || isUpdating;

  const actualOnSubmit: SubmitHandler<ClassSchema> = async (formData) => {
    try {
      if (type === "create") {
        await createClass(formData).unwrap();
      } else if (data?.id) {
        await updateClass({ ...formData, id: data.id }).unwrap();
      }
    } catch (err) {
      // Error is handled by useEffect below
    }
  };

  const onSubmit = handleSubmit(actualOnSubmit);

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Classe ${type === "create" ? "créée" : "mise à jour"} avec succès !`});
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
    onSubmit,
    createIsError,
    updateIsError,
    createErrorData,
    updateErrorData,
    setValue,
    selectedStudents,
  };
};

export default useClassForm;
