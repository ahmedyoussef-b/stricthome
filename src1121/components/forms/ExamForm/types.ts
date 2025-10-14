//src/components/forms/ExamForm/types.ts

import type { Dispatch, SetStateAction } from "react";
import { UseFormHandleSubmit, FieldErrors, UseFormRegister, SubmitHandler } from "react-hook-form";
import type { ExamSchema } from "@/types/schemas";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import type { Exam } from "@/types";

export interface ExamFormProps {
  type: "create" | "update";
  data?: Exam;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { 
    lessons: { id: number; name: string }[] 
  };
}

export interface ExamFormReturn {
  register: UseFormRegister<ExamSchema>;
  handleSubmit: UseFormHandleSubmit<ExamSchema>;
  actualOnSubmit: SubmitHandler<ExamSchema>;
  errors: FieldErrors<ExamSchema>;
  isLoading: boolean;
  createIsError: boolean;
  updateIsError: boolean;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}
