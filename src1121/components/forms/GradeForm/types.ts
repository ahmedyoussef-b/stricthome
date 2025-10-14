import type { Dispatch, SetStateAction } from "react";
import type { Grade } from "@/types/index";
import { FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { GradeSchema } from "@/lib/formValidationSchemas";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

export interface GradeFormProps {
  type: "create" | "update";
  data?: Grade;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export interface GradeFormReturn {
  register: UseFormRegister<GradeSchema>;
  errors: FieldErrors<GradeSchema>;
  isLoading: boolean;
  handleSubmit: UseFormHandleSubmit<GradeSchema>;
  actualOnSubmit: SubmitHandler<GradeSchema>;
  createIsError: boolean;
  updateIsError: boolean;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}
