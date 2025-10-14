//src/components/forms/SubjectForm/FormFields.tsx
import InputField from "@/components/InputField";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { SubjectSchema } from "@/lib/formValidationSchemas";
import { MultiSelectField } from '../MultiSelectField';

interface FormFieldsProps {
  register: UseFormRegister<SubjectSchema>;
  errors: FieldErrors<SubjectSchema>;
  isLoading: boolean;
  teachers: { id: string; name: string; surname: string }[];
  setValue: (name: "teachers", value: string[]) => void;
  selectedTeachers: string[];
  type: "create" | "update";
  // Removed data property
}

const FormFields = ({ register, errors, isLoading, teachers, setValue, selectedTeachers, type }: FormFieldsProps) => {
  const teacherOptions = teachers.map(t => ({ value: t.id, label: `${t.name} ${t.surname}` }));
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Nom de la Matière"
          name="name"
          register={register}
          error={errors?.name}
          disabled={isLoading}
        />
        <InputField
          label="Heures/semaine (défaut)"
          name="weeklyHours"
          type="number"
          register={register}
          error={errors?.weeklyHours}
          disabled={isLoading}
        />
        <InputField
          label="Coefficient (défaut)"
          name="coefficient"
          type="number"
          register={register}
          error={errors?.coefficient}
          disabled={isLoading}
        />
      </div>

      <MultiSelectField
        label="Assigner des enseignants (Optionnel)"
        options={teacherOptions}
        selected={selectedTeachers}
        onChange={(selected) => setValue("teachers", selected)}
        placeholder="Rechercher et sélectionner des enseignants..."
        disabled={isLoading}
      />
      {errors.teachers && <p className="text-xs text-red-400">{errors.teachers.message}</p>}
    </>
  );
};

export default FormFields;
