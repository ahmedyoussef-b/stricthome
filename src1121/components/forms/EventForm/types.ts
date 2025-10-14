// src/components/forms/EventForm/types.ts
import { eventSchema, type EventSchema } from "@/lib/formValidationSchemas";
import type { Event, Class } from "@/types/index";
import type { SubmitHandler, FieldErrors, UseFormRegister, UseFormHandleSubmit } from "react-hook-form";
import type { z } from "zod";
import type { Dispatch, SetStateAction } from "react";

// The complex UseMutation and MutationDefinition types are not needed here.
// We can simplify the prop types to just be functions.
export interface EventFormProps {
  initialData?: Event | null;
  availableClasses: Pick<Class, 'id' | 'name'>[];
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export interface UseEventFormProps extends EventFormProps {
    createEvent: (data: any) => any;
    updateEvent: (data: any) => any;
}

export interface EventFormReturn {
    register: UseFormRegister<EventSchema>;
    handleSubmit: UseFormHandleSubmit<EventSchema>;
    onSubmit: SubmitHandler<EventSchema>;
    errors: FieldErrors<EventSchema>;
}
