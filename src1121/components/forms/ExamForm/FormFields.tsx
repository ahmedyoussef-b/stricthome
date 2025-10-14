import InputField from "@/components/InputField";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { ExamSchema } from "@/lib/formValidationSchemas";

interface FormFieldsProps {
  register: UseFormRegister<ExamSchema>;
  errors: FieldErrors<ExamSchema>;
  isLoading: boolean;
  lessons: { id: number; name: string }[];
}

const FormFields = ({ register, errors, isLoading, lessons }: FormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField
        label="Titre de l'Examen"
        name="title"
        register={register}
        error={errors?.title}
        disabled={isLoading}
      />
      <InputField
        label="Heure de Début"
        name="startTime"
        type="datetime-local"
        register={register}
        error={errors?.startTime}
        disabled={isLoading}
      />
      <InputField
        label="Heure de Fin"
        name="endTime"
        type="datetime-local"
        register={register}
        error={errors?.endTime}
        disabled={isLoading}
      />
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Cours</label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
          {...register("lessonId")}
          disabled={isLoading}
        >
          <option value="">Sélectionner un cours</option>
          {lessons.map((lesson) => (
            <option value={String(lesson.id)} key={lesson.id}>
              {lesson.name}
            </option>
          ))}
        </select>
        {errors.lessonId?.message && (
          <p className="text-xs text-red-400">
            {errors.lessonId.message?.toString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormFields;
