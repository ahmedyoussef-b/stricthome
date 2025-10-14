// src/components/forms/TeacherForm/types.ts
import type { Dispatch, SetStateAction } from "react";
import type { Teacher, Subject } from "@/types";
import { UseFormHandleSubmit, FieldErrors, UseFormRegister, UseFormSetValue, SubmitHandler } from "react-hook-form";
import type { TeacherSchema } from "@/types/schemas";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { UserSex } from "@/types";

export interface TeacherFormReturn {
  register: UseFormRegister<TeacherSchema>;
  handleSubmit: UseFormHandleSubmit<TeacherSchema>;
  actualOnSubmit: SubmitHandler<TeacherSchema>;
  errors: FieldErrors<TeacherSchema>;
  isLoading: boolean;
  setValue: UseFormSetValue<TeacherSchema>;
  sexWatch: UserSex | null | undefined;
  birthdayWatch: Date | null | undefined; // Changed from string to Date
  imgPreview: string | null | undefined;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}
