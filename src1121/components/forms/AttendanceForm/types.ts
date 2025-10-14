//src/components/forms/AttendanceForm/types.ts
import type { Dispatch, SetStateAction, BaseSyntheticEvent } from "react";
import type { Student, LessonWithDetails, Attendance } from "@/types";
import { FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { AttendanceSchema } from "@/lib/formValidationSchemas";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";


export interface AttendanceFormProps {
  type: "create" | "update";
  data?: Attendance;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    students: Pick<Student, 'id' | 'name' | 'surname'>[];
    lessons: Pick<LessonWithDetails, 'id' | 'name'>[];
  };
}

export interface AttendanceFormReturn {
  register: UseFormRegister<AttendanceSchema>;
  handleSubmit: UseFormHandleSubmit<AttendanceSchema>;
  errors: FieldErrors<AttendanceSchema>;
  isLoading: boolean;
  isPresent: boolean;
  onSubmit: (e?: BaseSyntheticEvent) => Promise<void>;
  setValue: UseFormSetValue<AttendanceSchema>;
  createIsError: boolean;
  updateIsError: boolean;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}
