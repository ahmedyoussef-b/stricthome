import type { Dispatch, SetStateAction } from "react";
import { UseFormHandleSubmit, FieldErrors, UseFormRegister, UseFormSetValue, SubmitHandler } from "react-hook-form";
import type { ClassSchema } from "@/lib/formValidationSchemas";
import type { ClassWithDetails } from "@/app/(dashboard)/list/classes/page";

export interface ClassFormProps {
  type: "create" | "update";
  data?: ClassWithDetails;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { 
    grades?: { id: number; level: number }[];
    students?: { id: string; name: string; surname: string }[];
  };
}

export interface ClassFormReturn {
  register: UseFormRegister<ClassSchema>;
  handleSubmit: UseFormHandleSubmit<ClassSchema>;
  errors: FieldErrors<ClassSchema>;
  isLoading: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  createIsError: boolean;
  updateIsError: boolean;
  createErrorData: any;
  updateErrorData: any;
  setValue: UseFormSetValue<ClassSchema>;
  selectedStudents: string[];
}
