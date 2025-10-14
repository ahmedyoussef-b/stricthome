import type { Dispatch, SetStateAction } from "react";
import type { Lesson, Subject, Class, Teacher, Classroom } from "@/types/index";
import type { LessonSchema } from "@/types/schemas";
import { FieldErrors, SubmitHandler, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";

export interface LessonFormProps {
  type: "create" | "update";
  data?: Lesson;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    subjects?: Pick<Subject, 'id' | 'name'>[];
    classes?: Pick<Class, 'id' | 'name'>[];
    teachers?: Pick<Teacher, 'id' | 'name' | 'surname'>[];
    classrooms?: Pick<Classroom, 'id' | 'name'>[];
  };
}

export interface LessonFormReturn {
  register: UseFormRegister<LessonSchema>;
  handleSubmit: UseFormHandleSubmit<LessonSchema>;
  actualOnSubmit: SubmitHandler<LessonSchema>;
  errors: FieldErrors<LessonSchema>;
  isLoading: boolean;
  createErrorData: FetchBaseQueryError | SerializedError | undefined;
  updateErrorData: FetchBaseQueryError | SerializedError | undefined;
}
