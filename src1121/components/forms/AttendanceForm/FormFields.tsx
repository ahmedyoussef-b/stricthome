//src/components/forms/AttendanceForm/FormFields.tsx
"use client";

import InputField from "@/components/InputField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { AttendanceSchema } from "@/lib/formValidationSchemas";

interface FormFieldsProps {
  register: UseFormRegister<AttendanceSchema>;
  errors: FieldErrors<AttendanceSchema>;
  isLoading: boolean;
  isPresent: boolean;
  setValue: UseFormSetValue<AttendanceSchema>;
  students: { id: string; name: string; surname: string }[];
  lessons: { id: number; name: string }[];
  isUpdate: boolean;
}

const FormFields = ({
  register,
  errors,
  isLoading,
  isPresent,
  setValue,
  students,
  lessons,
  isUpdate,
}: FormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-2 w-full">
        <Label>Étudiant</Label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
          {...register("studentId")}
          disabled={isLoading || isUpdate}
        >
          <option value="">Sélectionner un étudiant</option>
          {students.map((student) => (
            <option value={student.id} key={student.id}>
              {student.name} {student.surname}
            </option>
          ))}
        </select>
        {errors.studentId && <p className="text-xs text-red-400">{errors.studentId.message}</p>}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label>Cours</Label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
          {...register("lessonId")}
          disabled={isLoading || isUpdate}
        >
          <option value="">Sélectionner un cours</option>
          {lessons.map((lesson) => (
            <option value={String(lesson.id)} key={lesson.id}>
              {lesson.name}
            </option>
          ))}
        </select>
        {errors.lessonId && <p className="text-xs text-red-400">{errors.lessonId.message as string}</p>}
      </div>

      <InputField
        label="Date"
        name="date"
        type="date"
        register={register as any}
        error={errors?.date}
        disabled={isLoading}
      />

      <div className="flex items-center space-x-2 pt-6">
        <Checkbox
          id="present"
          checked={isPresent}
          onCheckedChange={(checked) => setValue("present", checked as boolean)}
          disabled={isLoading}
        />
        <Label htmlFor="present" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Présent(e)
        </Label>
        {errors.present && <p className="text-xs text-red-400">{errors.present.message}</p>}
      </div>
    </div>
  );
};

export default FormFields;
