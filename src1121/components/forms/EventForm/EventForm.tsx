//src/components/forms/EventForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import FormFields from "./FormFields";
import useEventForm from "./useEventForm";
import type { EventFormProps } from "./types";
import { useCreateEventMutation, useUpdateEventMutation } from "@/lib/redux/api/entityApi";

const EventForm = ({
  initialData,
  availableClasses,
  setOpen, // Added setOpen prop
}: EventFormProps) => {

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();

  const {
    register,
    handleSubmit,
    onSubmit, // Use the onSubmit from the hook
    errors, // Correctly destructure errors
  } = useEventForm({
    initialData,
    availableClasses,
    setOpen,
    createEvent,
    updateEvent
  });

  const isLoading = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-xl font-semibold">
        {initialData ? "Modifier l'Événement" : "Créer un Nouvel Événement"}
      </h1>

      <FormFields
        register={register}
        errors={errors} // Pass errors to FormFields
        isLoading={isLoading}
        availableClasses={availableClasses}
        initialData={initialData}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Enregistrement...' :
         (initialData ? "Mettre à jour l'événement" : "Créer l'événement")}
      </Button>
    </form>
  );
};

export default EventForm;
