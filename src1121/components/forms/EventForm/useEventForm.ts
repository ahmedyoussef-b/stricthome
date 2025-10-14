// src/components/forms/EventForm/useEventForm.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, type UseFormReturn } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { eventSchema, type EventSchema } from "@/lib/formValidationSchemas";
import type { UseEventFormProps, EventFormReturn } from "./types";

const useEventForm = ({
  initialData,
  setOpen,
  createEvent,
  updateEvent
}: UseEventFormProps): EventFormReturn => {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime ? new Date(initialData.startTime) : undefined,
      endTime: initialData?.endTime ? new Date(initialData.endTime) : undefined,
      classId: initialData?.classId || null,
    },
  });

  const onSubmit: SubmitHandler<EventSchema> = async (data) => {
    try {
      if (initialData?.id) {
        await updateEvent({ id: initialData.id, ...data }).unwrap();
        toast({ title: "Succès", description: "Événement mis à jour avec succès." });
      } else {
        await createEvent(data).unwrap();
        toast({ title: "Succès", description: "Événement créé avec succès." });
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.data?.message || "Une erreur s'est produite."
      });
    }
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
  };
};

export default useEventForm;
